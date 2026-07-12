'use strict';

const path = require('path');
const { openCaptureDb, createCaptureStore } = require('./db');
const { createForegroundTracker } = require('./foreground');
const { createBackgroundTracker } = require('./background');
const { presenceMinutes, attributedMinutes, gapsBetweenMerged, mergeIntervals } = require('./presence');

/**
 * Main-process capture orchestrator.
 * Uses the same cadence.db path as the renderer KV store; capture tables are additive.
 */
function createCaptureService(dbPath, options = {}) {
  const db = openCaptureDb(dbPath);
  const store = createCaptureStore(db);
  const fg = createForegroundTracker(store, options.foreground);
  const bg = createBackgroundTracker(store, options.background);

  let started = false;

  function start() {
    if (started) return;
    started = true;
    fg.start();
    bg.start();
  }

  function stop() {
    if (!started) return;
    started = false;
    fg.stop();
    bg.stop();
  }

  function getStatus() {
    const status = store.getStatus();
    return {
      ...status,
      started,
      foreground: fg.getDebug(),
      background: bg.getDebug(),
    };
  }

  function startManualAgent(label, notes) {
    if (!label || !String(label).trim()) {
      throw new Error('Label is required');
    }
    return store.startManualAgent(String(label), notes || '');
  }

  function stopManualAgent(id) {
    return store.stopManualAgent(Number(id));
  }

  function getDaySummary(dateStr) {
    const spans = store.spansForDay(dateStr);
    const { startMs } = store.dayBoundsMs(dateStr);

    function toDayMinutes(span) {
      const s = Math.max(span.start_ts, startMs);
      const e = span.end_ts == null ? Date.now() : span.end_ts;
      const sm = Math.floor((s - startMs) / 60000);
      const em = Math.floor((e - startMs) / 60000);
      if (em <= sm) return null;
      return [sm, em];
    }

    const intervals = spans.map(toDayMinutes).filter(Boolean);
    const fgIntervals = spans.filter((s) => s.lane_type === 'fg').map(toDayMinutes).filter(Boolean);
    const bgIntervals = spans.filter((s) => s.lane_type === 'bg').map(toDayMinutes).filter(Boolean);

    return {
      date: dateStr,
      spans,
      attributedMinutes: attributedMinutes(intervals),
      presenceMinutes: presenceMinutes(intervals),
      fgPresenceMinutes: presenceMinutes(fgIntervals),
      bgPresenceMinutes: presenceMinutes(bgIntervals),
      gapCount: gapsBetweenMerged(intervals, 5).length,
      openManual: store.listOpenManual.all(),
    };
  }

  function suggestBreakFromIdle(fgDebug) {
    // Hint only — never auto-create a Break entry
    const open = fgDebug && fgDebug.merger && fgDebug.merger.open;
    return {
      suggestBreak: !open && started,
      reason: !open ? 'No foreground span (idle or excluded)' : null,
    };
  }

  return {
    dbPath,
    db,
    store,
    start,
    stop,
    getStatus,
    startManualAgent,
    stopManualAgent,
    getDaySummary,
    suggestBreakFromIdle,
    fg,
    bg,
  };
}

function resolveDbPathFromUserData(userDataPath) {
  return path.join(userDataPath, 'cadence.db');
}

module.exports = {
  createCaptureService,
  resolveDbPathFromUserData,
  // re-exports for tests / UI helpers
  presenceMinutes,
  attributedMinutes,
  gapsBetweenMerged,
  mergeIntervals,
};
