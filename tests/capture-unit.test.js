'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createSpanMerger } = require('../src/capture/merge');
const { fingerprint } = require('../src/capture/exclusions');
const {
  mergeIntervals,
  attributedMinutes,
  presenceMinutes,
  gapsBetweenMerged,
} = require('../src/capture/presence');
const { isExcludedProcess, redactTitle } = require('../src/capture/exclusions');
const { parseTasklistCsv } = require('../src/capture/background');

describe('span merger debounce', () => {
  it('merges continuous same-fingerprint samples into one open span', () => {
    const m = createSpanMerger({ debounceMs: 8000 });
    const fp = fingerprint('Cursor', 'spec.md');
    m.push({ ts: 1000, app: 'cursor', title: 'spec.md', fingerprint: fp, idleMs: 0, excluded: false });
    m.push({ ts: 3000, app: 'cursor', title: 'spec.md', fingerprint: fp, idleMs: 0, excluded: false });
    m.push({ ts: 5000, app: 'cursor', title: 'spec.md', fingerprint: fp, idleMs: 0, excluded: false });
    assert.equal(m.drainClosed().length, 0);
    const open = m.getOpen();
    assert.ok(open);
    assert.equal(open.startTs, 1000);
    assert.equal(open.lastTs, 5000);
  });

  it('ignores brief focus flicker shorter than debounce', () => {
    const m = createSpanMerger({ debounceMs: 8000 });
    const a = fingerprint('Cursor', 'a');
    const b = fingerprint('Slack', 'b');
    m.push({ ts: 0, app: 'cursor', title: 'a', fingerprint: a, idleMs: 0, excluded: false });
    m.push({ ts: 1000, app: 'slack', title: 'b', fingerprint: b, idleMs: 0, excluded: false });
    m.push({ ts: 2000, app: 'cursor', title: 'a', fingerprint: a, idleMs: 0, excluded: false });
    assert.equal(m.drainClosed().length, 0);
    assert.equal(m.getOpen().fingerprint, a);
  });

  it('commits switch after debounce window', () => {
    const m = createSpanMerger({ debounceMs: 8000 });
    const a = fingerprint('Cursor', 'a');
    const b = fingerprint('Slack', 'b');
    m.push({ ts: 0, app: 'cursor', title: 'a', fingerprint: a, idleMs: 0, excluded: false });
    m.push({ ts: 1000, app: 'slack', title: 'b', fingerprint: b, idleMs: 0, excluded: false });
    m.push({ ts: 9000, app: 'slack', title: 'b', fingerprint: b, idleMs: 0, excluded: false });
    const closed = m.drainClosed();
    assert.equal(closed.length, 1);
    assert.equal(closed[0].sourceKey, a);
    assert.equal(closed[0].endTs, 1000);
    assert.equal(m.getOpen().fingerprint, b);
    assert.equal(m.getOpen().startTs, 1000);
  });

  it('closes on idle timeout', () => {
    const m = createSpanMerger({ debounceMs: 8000, idleCloseMs: 10 * 60 * 1000 });
    const a = fingerprint('Cursor', 'a');
    m.push({ ts: 0, app: 'cursor', title: 'a', fingerprint: a, idleMs: 0, excluded: false });
    m.push({ ts: 11 * 60 * 1000, app: 'cursor', title: 'a', fingerprint: a, idleMs: 11 * 60 * 1000, excluded: false });
    const closed = m.drainClosed();
    assert.equal(closed.length, 1);
    assert.equal(closed[0].state, 'idle');
    assert.equal(m.getOpen(), null);
  });

  it('closes when sample is excluded', () => {
    const m = createSpanMerger({ debounceMs: 1000 });
    const a = fingerprint('Cursor', 'a');
    m.push({ ts: 0, app: 'cursor', title: 'a', fingerprint: a, idleMs: 0, excluded: false });
    m.push({ ts: 5000, app: '1password', title: 'vault', fingerprint: '', idleMs: 0, excluded: true });
    const closed = m.drainClosed();
    assert.equal(closed.length, 1);
    assert.equal(closed[0].closeReason, 'excluded');
    assert.equal(m.getOpen(), null);
  });
});

describe('presence vs attributed', () => {
  it('attributes overlapping intervals as sum, presence as union', () => {
    const intervals = [
      [0, 60],
      [30, 90],
      [80, 100],
    ];
    assert.equal(attributedMinutes(intervals), 140);
    assert.equal(presenceMinutes(intervals), 100);
    assert.deepEqual(mergeIntervals(intervals), [[0, 100]]);
  });

  it('finds gaps between merged blocks only', () => {
    const intervals = [
      [0, 30],
      [20, 40], // overlaps first
      [60, 80], // 20 min gap after merged [0,40]
    ];
    assert.deepEqual(gapsBetweenMerged(intervals, 5), [[40, 60]]);
    assert.deepEqual(gapsBetweenMerged([[0, 10], [12, 20]], 5), []); // 2 min < threshold
  });
});

describe('exclusions', () => {
  it('excludes password managers and Cadence', () => {
    assert.equal(isExcludedProcess('1Password.exe'), true);
    assert.equal(isExcludedProcess('Bitwarden'), true);
    assert.equal(isExcludedProcess('electron', { title: 'Cadence' }), true);
    assert.equal(isExcludedProcess('Cursor.exe', { title: 'main.ts' }), false);
  });

  it('redacts sensitive titles', () => {
    assert.equal(redactTitle('Enter password for vault'), '[redacted]');
    assert.equal(redactTitle('spec draft — CA Phase 2'), 'spec draft — CA Phase 2');
  });
});

describe('tasklist parse', () => {
  it('parses csv rows', () => {
    const rows = parseTasklistCsv('"Cursor.exe","1234","Console","1","100 K"\r\n"chrome.exe","9","Console","1","1 K"');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'cursor');
    assert.equal(rows[0].pid, 1234);
  });
});
