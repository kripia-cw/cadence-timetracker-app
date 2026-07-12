'use strict';

/**
 * Presence (union of intervals) vs attributed (sum of durations).
 * Intervals are [startMin, endMin) in minutes from midnight, or absolute ms pairs.
 */

function mergeIntervals(intervals) {
  const cleaned = intervals
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);

  if (!cleaned.length) return [];

  const out = [cleaned[0].slice()];
  for (let i = 1; i < cleaned.length; i++) {
    const cur = cleaned[i];
    const last = out[out.length - 1];
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      out.push(cur.slice());
    }
  }
  return out;
}

function attributedMinutes(intervals) {
  return intervals.reduce((sum, [a, b]) => sum + Math.max(0, b - a), 0);
}

function presenceMinutes(intervals) {
  return mergeIntervals(intervals).reduce((sum, [a, b]) => sum + (b - a), 0);
}

/**
 * Gaps between merged coverage blocks. Does not invent gaps before the first
 * or after the last entry — matches Cadence's existing day-list behaviour,
 * but correctly handles overlapping entries.
 */
function gapsBetweenMerged(intervals, minGapMinutes = 5) {
  const merged = mergeIntervals(intervals);
  const gaps = [];
  for (let i = 0; i < merged.length - 1; i++) {
    const start = merged[i][1];
    const end = merged[i + 1][0];
    if (end - start > minGapMinutes) gaps.push([start, end]);
  }
  return gaps;
}

/** Convert HH:MM + duration-style entry fields into [startMin, endMin]. */
function entryToMinutes(entry, minsFn) {
  const sm = minsFn(entry.start);
  const em = minsFn(entry.end);
  if (sm < 0 || em < 0 || em <= sm) return null;
  return [sm, em];
}

function fmtMins(total) {
  if (total <= 0) return '0m';
  const h = Math.floor(total / 60);
  const n = total % 60;
  return h > 0 ? `${h}h ${n}m` : `${n}m`;
}

function minsToHHMM(m) {
  const h = Math.floor(m / 60);
  const n = m % 60;
  return `${String(h).padStart(2, '0')}:${String(n).padStart(2, '0')}`;
}

module.exports = {
  mergeIntervals,
  attributedMinutes,
  presenceMinutes,
  gapsBetweenMerged,
  entryToMinutes,
  fmtMins,
  minsToHHMM,
};
