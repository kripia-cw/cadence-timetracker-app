'use strict';

/**
 * Process exclusions for foreground capture.
 * Short bank codes use exact match; password managers use substring match.
 */

const EXCLUDED_PROCESS_EXACT = new Set([
  // NZ / AU banks (desktop shells if present)
  'anz',
  'asb',
  'bnz',
  'westpac',
  'kiwibank',
  'commbank',
  'netbank',
  // Cadence packaged name if ever renamed
  'cadence',
  'time-tracker',
]);

const EXCLUDED_PROCESS_SUBSTRINGS = [
  '1password',
  'keepass',
  'keeweb',
  'bitwarden',
  'lastpass',
  'dashlane',
  'roboform',
  'enpass',
  'nordpass',
  'keeperpasswordmanager',
  'passwordsafe',
  'authy',
  'microsoft.authenticator',
  'winauth',
];

/** Window-title patterns replaced with [redacted] before persistence. */
const TITLE_REDACT_PATTERNS = [
  /\bpassword\b/i,
  /\botp\b/i,
  /\bone[-\s]?time\s+code\b/i,
  /\bverification\s+code\b/i,
  /\bcredit\s*card\b/i,
  /\bcvv\b/i,
];

function normalizeProcessName(name) {
  if (!name) return '';
  return String(name).replace(/\.exe$/i, '').trim().toLowerCase();
}

function isCadenceWindow(processName, title) {
  const n = normalizeProcessName(processName);
  const t = String(title || '').toLowerCase();
  if (n === 'cadence' || n === 'time-tracker') return true;
  // Dev: `electron .` — only skip when the window is Cadence itself
  if (n === 'electron' && (t.includes('cadence') || t === '' || t.includes('time tracker'))) {
    return true;
  }
  return false;
}

function isExcludedProcess(processName, opts = {}) {
  const n = normalizeProcessName(processName);
  if (!n) return false;
  if (isCadenceWindow(n, opts.title)) return true;
  if (EXCLUDED_PROCESS_EXACT.has(n)) return true;
  return EXCLUDED_PROCESS_SUBSTRINGS.some((s) => n.includes(s));
}

function redactTitle(title) {
  const raw = title == null ? '' : String(title);
  if (!raw) return '';
  for (const re of TITLE_REDACT_PATTERNS) {
    if (re.test(raw)) return '[redacted]';
  }
  return raw;
}

function fingerprint(app, title) {
  return `${normalizeProcessName(app)}||${String(title || '').trim().toLowerCase()}`;
}

module.exports = {
  EXCLUDED_PROCESS_EXACT,
  EXCLUDED_PROCESS_SUBSTRINGS,
  TITLE_REDACT_PATTERNS,
  normalizeProcessName,
  isCadenceWindow,
  isExcludedProcess,
  redactTitle,
  fingerprint,
};
