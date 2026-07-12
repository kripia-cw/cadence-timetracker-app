'use strict';

/**
 * Windows foreground window + idle time via koffi (no electron-rebuild).
 * Windows-only by design for this feature.
 */

const koffi = require('koffi');
const path = require('path');

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const LastInputInfo = koffi.struct('LASTINPUTINFO', {
  cbSize: 'uint32',
  dwTime: 'uint32',
});

const GetForegroundWindow = user32.func('GetForegroundWindow', 'void *', []);
const GetWindowTextW = user32.func('int __stdcall GetWindowTextW(void *hWnd, uint16 *lpString, int nMaxCount)');
const GetWindowThreadProcessId = user32.func('uint32 __stdcall GetWindowThreadProcessId(void *hWnd, _Out_ uint32 *lpdwProcessId)');
const GetLastInputInfo = user32.func('bool __stdcall GetLastInputInfo(_Inout_ LASTINPUTINFO *plii)');

const OpenProcess = kernel32.func('void * __stdcall OpenProcess(uint32 dwDesiredAccess, bool bInheritHandle, uint32 dwProcessId)');
const CloseHandle = kernel32.func('bool __stdcall CloseHandle(void *hObject)');
const QueryFullProcessImageNameW = kernel32.func(
  'bool __stdcall QueryFullProcessImageNameW(void *hProcess, uint32 dwFlags, uint16 *lpExeName, _Inout_ uint32 *lpdwSize)'
);
const GetTickCount = kernel32.func('uint32 __stdcall GetTickCount()');

const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
const TITLE_BUF_CHARS = 512;
const PATH_BUF_CHARS = 1024;

function readWideString(buf, maxChars) {
  const chars = [];
  for (let i = 0; i < maxChars; i++) {
    const code = buf[i];
    if (code === 0) break;
    chars.push(String.fromCharCode(code));
  }
  return chars.join('');
}

function getIdleMs() {
  try {
    const info = { cbSize: koffi.sizeof(LastInputInfo), dwTime: 0 };
    const ok = GetLastInputInfo(info);
    if (!ok) return 0;
    const tick = GetTickCount();
    // TickCount wraps ~49 days; unsigned subtract
    return (tick - info.dwTime) >>> 0;
  } catch {
    return 0;
  }
}

function processNameFromPid(pid) {
  if (!pid) return '';
  let handle = null;
  try {
    handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    if (!handle || handle === 0 || handle === null) return '';
    const buf = new Uint16Array(PATH_BUF_CHARS);
    const size = [PATH_BUF_CHARS];
    const ok = QueryFullProcessImageNameW(handle, 0, buf, size);
    if (!ok) return '';
    const full = readWideString(buf, PATH_BUF_CHARS);
    return path.basename(full);
  } catch {
    return '';
  } finally {
    if (handle) {
      try { CloseHandle(handle); } catch { /* ignore */ }
    }
  }
}

function getForegroundSnapshot() {
  try {
    const hwnd = GetForegroundWindow();
    if (!hwnd || hwnd === 0 || hwnd === null) {
      return { ok: false, reason: 'no-window', idleMs: getIdleMs() };
    }

    const titleBuf = new Uint16Array(TITLE_BUF_CHARS);
    GetWindowTextW(hwnd, titleBuf, TITLE_BUF_CHARS);
    const title = readWideString(titleBuf, TITLE_BUF_CHARS);

    const pidOut = [0];
    GetWindowThreadProcessId(hwnd, pidOut);
    const pid = pidOut[0] || 0;
    const processName = processNameFromPid(pid);

    return {
      ok: true,
      hwnd: String(hwnd),
      pid,
      app: processName || 'unknown',
      title,
      idleMs: getIdleMs(),
      ts: Date.now(),
    };
  } catch (err) {
    return { ok: false, reason: err.message || 'capture-error', idleMs: getIdleMs(), ts: Date.now() };
  }
}

module.exports = { getForegroundSnapshot, getIdleMs };
