'use strict';

const SCHEMA_VERSION = 1;

const MIGRATIONS = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS capture_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_spans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lane_type TEXT NOT NULL CHECK (lane_type IN ('fg', 'bg')),
  source_key TEXT NOT NULL,
  app TEXT,
  title TEXT,
  state TEXT NOT NULL DEFAULT 'active',
  start_ts INTEGER NOT NULL,
  end_ts INTEGER,
  close_reason TEXT,
  meta_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spans_lane_start ON activity_spans (lane_type, start_ts);
CREATE INDEX IF NOT EXISTS idx_spans_open ON activity_spans (end_ts);
CREATE INDEX IF NOT EXISTS idx_spans_source ON activity_spans (source_key, start_ts);

CREATE TABLE IF NOT EXISTS manual_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  notes TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  span_id INTEGER
);

CREATE TABLE IF NOT EXISTS proposed_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_ts INTEGER NOT NULL,
  end_ts INTEGER NOT NULL,
  lane_type TEXT NOT NULL,
  desc_draft TEXT,
  cat_draft TEXT,
  proj_draft TEXT,
  tags_draft TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence REAL,
  evidence_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_segments_status ON proposed_segments (status, start_ts);
`;

function migrateCaptureDb(db) {
  db.exec(MIGRATIONS);
  const row = db.prepare('SELECT value FROM capture_meta WHERE key = ?').get('schema_version');
  const current = row ? Number(row.value) : 0;
  if (current < SCHEMA_VERSION) {
    db.prepare(
      'INSERT INTO capture_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run('schema_version', String(SCHEMA_VERSION));
  }
  return SCHEMA_VERSION;
}

module.exports = { SCHEMA_VERSION, MIGRATIONS, migrateCaptureDb };
