'use strict';

const { getForegroundSnapshot } = require('./win32');
const { createSpanMerger } = require('./merge');
const { isExcludedProcess, redactTitle, fingerprint, normalizeProcessName } = require('./exclusions');

const POLL_MS = 2000;

function createForegroundTracker(store, options = {}) {
  const pollMs = options.pollMs ?? POLL_MS;
  const merger = createSpanMerger({
    debounceMs: options.debounceMs,
    idleCloseMs: options.idleCloseMs,
  });

  let timer = null;
  let openRowId = null;
  let lastError = null;
  let sampleCount = 0;
  let running = false;

  function persistClosed(spans) {
    for (const span of spans) {
      store.writeClosedSpan(span);
    }
  }

  function syncOpenRow(sample) {
    const open = merger.getOpen();
    if (!open) {
      openRowId = null;
      return;
    }
    // Keep a single open DB row for the current FG span
    if (openRowId == null) {
      openRowId = store.openSpan({
        laneType: 'fg',
        sourceKey: open.fingerprint,
        app: open.app,
        title: open.title,
        state: 'active',
        startTs: open.startTs,
      });
    }
  }

  function onClosedFromMerger(closed) {
    if (!closed.length) return;
    // Close the tracked open row for the first closed span if fingerprints match
    if (openRowId != null) {
      const first = closed[0];
      store.closeSpanById(openRowId, first.endTs, first.state, first.closeReason);
      openRowId = null;
      // Remaining closed spans (rare) written fully
      if (closed.length > 1) persistClosed(closed.slice(1));
    } else {
      persistClosed(closed);
    }
  }

  function tick() {
    sampleCount += 1;
    const snap = getForegroundSnapshot();
    if (!snap.ok) {
      lastError = snap.reason || 'unknown';
      // Still feed idle-only sample so idle timeout can close spans
      merger.push({
        ts: Date.now(),
        app: '',
        title: '',
        fingerprint: '',
        idleMs: snap.idleMs || 0,
        excluded: true,
      });
      const closed = merger.drainClosed();
      onClosedFromMerger(closed);
      return;
    }

    const title = redactTitle(snap.title);
    const app = normalizeProcessName(snap.app) || snap.app;
    const excluded = isExcludedProcess(snap.app, { title: snap.title });
    const fp = excluded ? '' : fingerprint(app, title);

    merger.push({
      ts: snap.ts || Date.now(),
      app,
      title,
      fingerprint: fp,
      idleMs: snap.idleMs || 0,
      excluded,
    });

    const closed = merger.drainClosed();
    onClosedFromMerger(closed);
    syncOpenRow(snap);
    lastError = null;
  }

  function start() {
    if (running) return;
    running = true;
    // Close any orphan open FG spans from a previous crash
    store.closeOpenLaneSpans('fg', Date.now(), 'restart');
    openRowId = null;
    tick();
    timer = setInterval(tick, pollMs);
    if (timer.unref) timer.unref();
  }

  function stop() {
    if (!running) return;
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
    const now = Date.now();
    merger.flush(now);
    const closed = merger.drainClosed();
    onClosedFromMerger(closed);
    const open = merger.getOpen();
    if (open && openRowId != null) {
      store.closeSpanById(openRowId, now, 'active', 'stop');
      openRowId = null;
    } else if (open) {
      store.writeClosedSpan({
        laneType: 'fg',
        sourceKey: open.fingerprint,
        app: open.app,
        title: open.title,
        state: 'active',
        startTs: open.startTs,
        endTs: now,
        closeReason: 'stop',
      });
    }
  }

  function getDebug() {
    return {
      running,
      sampleCount,
      lastError,
      openRowId,
      merger: merger.snapshot(),
    };
  }

  return { start, stop, tick, getDebug, merger };
}

module.exports = { createForegroundTracker, POLL_MS };
