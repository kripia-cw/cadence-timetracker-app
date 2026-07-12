'use strict';

/**
 * Span merger for foreground (and reusable) activity.
 * Debounces brief focus flickers so Alt-Tab noise does not shred spans.
 */

const DEFAULTS = {
  debounceMs: 8000,
  idleCloseMs: 10 * 60 * 1000,
};

/**
 * Pure state machine. Feed samples chronologically; collect closed spans + open span.
 *
 * Sample shape: { ts, app, title, fingerprint, idleMs, excluded }
 */
function createSpanMerger(options = {}) {
  const debounceMs = options.debounceMs ?? DEFAULTS.debounceMs;
  const idleCloseMs = options.idleCloseMs ?? DEFAULTS.idleCloseMs;

  let open = null; // { fingerprint, app, title, startTs, lastTs, state }
  let pending = null; // { fingerprint, app, title, sinceTs }
  const closed = [];

  function closeOpen(endTs, reason) {
    if (!open) return;
    closed.push({
      laneType: 'fg',
      sourceKey: open.fingerprint,
      app: open.app,
      title: open.title,
      state: reason === 'idle' ? 'idle' : 'active',
      startTs: open.startTs,
      endTs: endTs,
      closeReason: reason || 'switch',
    });
    open = null;
    pending = null;
  }

  function openNew(sample) {
    open = {
      fingerprint: sample.fingerprint,
      app: sample.app,
      title: sample.title,
      startTs: sample.ts,
      lastTs: sample.ts,
      state: 'active',
    };
    pending = null;
  }

  function push(sample) {
    if (!sample || typeof sample.ts !== 'number') return;

    if (sample.excluded) {
      if (open) closeOpen(sample.ts, 'excluded');
      pending = null;
      return;
    }

    if (sample.idleMs != null && sample.idleMs >= idleCloseMs) {
      if (open) closeOpen(sample.ts, 'idle');
      pending = null;
      return;
    }

    if (!open) {
      openNew(sample);
      return;
    }

    open.lastTs = sample.ts;

    if (sample.fingerprint === open.fingerprint) {
      // Still on same focus — cancel any pending switch
      pending = null;
      open.app = sample.app;
      open.title = sample.title;
      return;
    }

    // Different fingerprint — debounce before committing the switch
    if (!pending || pending.fingerprint !== sample.fingerprint) {
      pending = {
        fingerprint: sample.fingerprint,
        app: sample.app,
        title: sample.title,
        sinceTs: sample.ts,
      };
      return;
    }

    if (sample.ts - pending.sinceTs >= debounceMs) {
      const committed = { ...pending };
      closeOpen(committed.sinceTs, 'switch');
      openNew({
        ts: committed.sinceTs,
        app: committed.app,
        title: committed.title,
        fingerprint: committed.fingerprint,
      });
      // Advance lastTs to current sample
      open.lastTs = sample.ts;
    }
  }

  function flush(ts) {
    if (pending && open && ts - pending.sinceTs >= debounceMs) {
      const committed = { ...pending };
      closeOpen(committed.sinceTs, 'switch');
      openNew({
        ts: committed.sinceTs,
        app: committed.app,
        title: committed.title,
        fingerprint: committed.fingerprint,
      });
      open.lastTs = ts;
    } else if (open) {
      open.lastTs = ts;
    }
  }

  function getOpen() {
    return open ? { ...open } : null;
  }

  function drainClosed() {
    const out = closed.splice(0, closed.length);
    return out;
  }

  function snapshot() {
    return {
      open: getOpen(),
      pending: pending ? { ...pending } : null,
      closedCount: closed.length,
    };
  }

  return { push, flush, getOpen, drainClosed, snapshot, debounceMs, idleCloseMs };
}

module.exports = { createSpanMerger, DEFAULTS };
