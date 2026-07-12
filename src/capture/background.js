'use strict';

/**
 * Background lanes for v1:
 *  - Cursor / IDE agent-looking processes (alive = running)
 *  - Manual "I'm running an agent on X" (via store API)
 *
 * Browser tabs and open-ended process watchlists are intentionally out of scope.
 */

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/** Process names (no .exe) treated as IDE agent hosts when a window title looks agent-like. */
const IDE_PROCESS_NAMES = new Set(['cursor', 'code', 'code - insiders']);

/**
 * Title heuristics for agent / terminal work inside Cursor or VS Code.
 * Conservative: better to miss than to invent background work.
 */
const AGENT_TITLE_RE =
  /\b(agent|composer|terminal|powershell|cmd\.exe|command prompt|bash|zsh|wsl|claude|codex)\b/i;

const POLL_MS = 5000;

function parseTasklistCsv(stdout) {
  // tasklist /fo csv /nh → "Image Name","PID","Session Name","Session#","Mem Usage"
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    const match = line.match(/^"([^"]+)","(\d+)"/);
    if (!match) continue;
    const image = match[1];
    const pid = Number(match[2]);
    const base = image.replace(/\.exe$/i, '').toLowerCase();
    out.push({ image, pid, name: base });
  }
  return out;
}

async function listProcesses() {
  try {
    const { stdout } = await execFileAsync(
      'tasklist',
      ['/fo', 'csv', '/nh'],
      { windowsHide: true, timeout: 8000, maxBuffer: 2 * 1024 * 1024 }
    );
    return parseTasklistCsv(stdout);
  } catch {
    return [];
  }
}

/**
 * Also peek window titles for Cursor/Code via PowerShell — optional enrichment.
 * Falls back silently if PowerShell is blocked.
 */
async function listIdeWindowTitles() {
  const script =
    `Get-Process Cursor,Code -ErrorAction SilentlyContinue | ` +
    `Where-Object { $_.MainWindowTitle } | ` +
    `Select-Object ProcessName,Id,MainWindowTitle | ConvertTo-Json -Compress`;
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 8000, maxBuffer: 1024 * 1024 }
    );
    const text = String(stdout || '').trim();
    if (!text) return [];
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((r) => ({
      name: String(r.ProcessName || '').toLowerCase(),
      pid: Number(r.Id) || 0,
      title: String(r.MainWindowTitle || ''),
    }));
  } catch {
    return [];
  }
}

function createBackgroundTracker(store, options = {}) {
  const pollMs = options.pollMs ?? POLL_MS;
  /** @type {Map<string, { rowId: number, label: string }>} */
  const openIdeLanes = new Map();
  let timer = null;
  let running = false;
  let lastError = null;
  let tickCount = 0;

  function sourceKeyForIde(name, pid, title) {
    // Prefer stable-ish key: process + normalised title bucket (not raw pid alone,
    // so a restart with same title can continue — pid included for uniqueness when title empty)
    const t = (title || '').trim().toLowerCase().slice(0, 80);
    return `ide:${name}:${t || pid}`;
  }

  async function tick() {
    tickCount += 1;
    try {
      const procs = await listProcesses();
      const ideProcs = procs.filter((p) => IDE_PROCESS_NAMES.has(p.name));
      const windows = await listIdeWindowTitles();

      /** @type {Map<string, { app: string, title: string, pid: number }>} */
      const detected = new Map();

      // Window-title based agent lanes (best signal)
      for (const w of windows) {
        if (!IDE_PROCESS_NAMES.has(w.name)) continue;
        if (!AGENT_TITLE_RE.test(w.title)) continue;
        const key = sourceKeyForIde(w.name, w.pid, w.title);
        detected.set(key, { app: w.name, title: w.title, pid: w.pid });
      }

      // If Cursor/Code is running but no agent-like title matched, do not invent a BG lane.
      // Manual agents cover intentional background work without a matching title.

      // Open new lanes
      for (const [key, info] of detected) {
        if (openIdeLanes.has(key)) continue;
        // Skip if store already has this open (e.g. after hot reload)
        const existing = store.findOpenSpan.get('bg', key);
        if (existing) {
          openIdeLanes.set(key, { rowId: existing.id, label: info.title });
          continue;
        }
        const rowId = store.openSpan({
          laneType: 'bg',
          sourceKey: key,
          app: info.app,
          title: info.title,
          state: 'running',
          startTs: Date.now(),
          meta: { kind: 'ide-agent', pid: info.pid },
        });
        openIdeLanes.set(key, { rowId, label: info.title });
      }

      // Close lanes that disappeared
      for (const [key, lane] of openIdeLanes) {
        if (detected.has(key)) continue;
        store.closeSpanById(lane.rowId, Date.now(), 'done', 'process-gone');
        openIdeLanes.delete(key);
      }

      lastError = null;
    } catch (err) {
      lastError = err.message || String(err);
    }
  }

  function start() {
    if (running) return;
    running = true;
    // Do not mass-close manual agents on restart — only orphan IDE lanes without matching process
    tick();
    timer = setInterval(() => { tick(); }, pollMs);
    if (timer.unref) timer.unref();
  }

  function stop() {
    if (!running) return;
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
    const now = Date.now();
    for (const [key, lane] of openIdeLanes) {
      store.closeSpanById(lane.rowId, now, 'done', 'stop');
      openIdeLanes.delete(key);
    }
  }

  function getDebug() {
    return {
      running,
      tickCount,
      lastError,
      openIdeLanes: [...openIdeLanes.entries()].map(([k, v]) => ({ key: k, ...v })),
      ideProcessNames: [...IDE_PROCESS_NAMES],
    };
  }

  return {
    start,
    stop,
    tick,
    getDebug,
    IDE_PROCESS_NAMES,
    AGENT_TITLE_RE,
  };
}

module.exports = {
  createBackgroundTracker,
  parseTasklistCsv,
  IDE_PROCESS_NAMES,
  AGENT_TITLE_RE,
  POLL_MS,
};
