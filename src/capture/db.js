'use strict';

const Database = require('better-sqlite3');
const { migrateCaptureDb } = require('./schema');

function openCaptureDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  migrateCaptureDb(db);
  return db;
}

function createCaptureStore(db) {
  const insertSpan = db.prepare(`
    INSERT INTO activity_spans
      (lane_type, source_key, app, title, state, start_ts, end_ts, close_reason, meta_json, created_at)
    VALUES
      (@lane_type, @source_key, @app, @title, @state, @start_ts, @end_ts, @close_reason, @meta_json, @created_at)
  `);

  const updateSpanEnd = db.prepare(`
    UPDATE activity_spans
    SET end_ts = @end_ts, state = @state, close_reason = @close_reason
    WHERE id = @id
  `);

  const findOpenSpan = db.prepare(`
    SELECT * FROM activity_spans
    WHERE lane_type = ? AND source_key = ? AND end_ts IS NULL
    ORDER BY start_ts DESC LIMIT 1
  `);

  const findOpenByLane = db.prepare(`
    SELECT * FROM activity_spans
    WHERE lane_type = ? AND end_ts IS NULL
    ORDER BY start_ts DESC
  `);

  const listRecentSpans = db.prepare(`
    SELECT * FROM activity_spans
    WHERE start_ts >= ?
    ORDER BY start_ts DESC
    LIMIT ?
  `);

  const insertManual = db.prepare(`
    INSERT INTO manual_agents (label, notes, started_at, ended_at, span_id)
    VALUES (@label, @notes, @started_at, NULL, @span_id)
  `);

  const endManual = db.prepare(`
    UPDATE manual_agents SET ended_at = @ended_at WHERE id = @id AND ended_at IS NULL
  `);

  const listOpenManual = db.prepare(`
    SELECT * FROM manual_agents WHERE ended_at IS NULL ORDER BY started_at DESC
  `);

  const listManualToday = db.prepare(`
    SELECT * FROM manual_agents WHERE started_at >= ? ORDER BY started_at DESC
  `);

  const countPendingSegments = db.prepare(`
    SELECT COUNT(*) AS n FROM proposed_segments WHERE status = 'pending'
  `);

  function writeClosedSpan(span) {
    const info = insertSpan.run({
      lane_type: span.laneType,
      source_key: span.sourceKey,
      app: span.app || null,
      title: span.title || null,
      state: span.state || 'active',
      start_ts: span.startTs,
      end_ts: span.endTs,
      close_reason: span.closeReason || null,
      meta_json: span.meta ? JSON.stringify(span.meta) : null,
      created_at: Date.now(),
    });
    return info.lastInsertRowid;
  }

  function openSpan(span) {
    const info = insertSpan.run({
      lane_type: span.laneType,
      source_key: span.sourceKey,
      app: span.app || null,
      title: span.title || null,
      state: span.state || 'active',
      start_ts: span.startTs,
      end_ts: null,
      close_reason: null,
      meta_json: span.meta ? JSON.stringify(span.meta) : null,
      created_at: Date.now(),
    });
    return info.lastInsertRowid;
  }

  function closeSpanById(id, endTs, state, closeReason) {
    updateSpanEnd.run({
      id,
      end_ts: endTs,
      state: state || 'active',
      close_reason: closeReason || 'switch',
    });
  }

  function closeOpenLaneSpans(laneType, endTs, closeReason) {
    const rows = findOpenByLane.all(laneType);
    for (const row of rows) {
      closeSpanById(row.id, endTs, row.state, closeReason);
    }
    return rows.length;
  }

  function startManualAgent(label, notes) {
    const now = Date.now();
    const sourceKey = `manual:${label.trim().toLowerCase()}:${now}`;
    const spanId = openSpan({
      laneType: 'bg',
      sourceKey,
      app: 'manual-agent',
      title: label.trim(),
      state: 'running',
      startTs: now,
      meta: { kind: 'manual', notes: notes || '' },
    });
    const info = insertManual.run({
      label: label.trim(),
      notes: notes || null,
      started_at: now,
      span_id: spanId,
    });
    return { id: info.lastInsertRowid, spanId, startedAt: now, label: label.trim() };
  }

  function stopManualAgent(id) {
    const now = Date.now();
    const row = db.prepare('SELECT * FROM manual_agents WHERE id = ?').get(id);
    if (!row || row.ended_at) return null;
    endManual.run({ id, ended_at: now });
    if (row.span_id) closeSpanById(row.span_id, now, 'done', 'manual-stop');
    return { id, endedAt: now };
  }

  function getStatus(sinceTs) {
    const since = sinceTs || Date.now() - 24 * 60 * 60 * 1000;
    const recent = listRecentSpans.all(since, 40);
    const openFg = findOpenByLane.all('fg');
    const openBg = findOpenByLane.all('bg');
    const manualOpen = listOpenManual.all();
    const pending = countPendingSegments.get().n;
    return {
      tracking: true,
      openFg: openFg.length,
      openBg: openBg.length,
      manualAgents: manualOpen,
      pendingSegments: pending,
      recentSpans: recent,
    };
  }

  function dayBoundsMs(dateStr) {
    // Local day bounds
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }

  function spansForDay(dateStr) {
    const { startMs, endMs } = dayBoundsMs(dateStr);
    return db.prepare(`
      SELECT * FROM activity_spans
      WHERE start_ts < ? AND (end_ts IS NULL OR end_ts > ?)
      ORDER BY start_ts ASC
    `).all(endMs, startMs);
  }

  return {
    db,
    writeClosedSpan,
    openSpan,
    closeSpanById,
    closeOpenLaneSpans,
    findOpenSpan,
    findOpenByLane,
    listRecentSpans,
    startManualAgent,
    stopManualAgent,
    listOpenManual,
    listManualToday,
    getStatus,
    spansForDay,
    dayBoundsMs,
  };
}

module.exports = { openCaptureDb, createCaptureStore };
