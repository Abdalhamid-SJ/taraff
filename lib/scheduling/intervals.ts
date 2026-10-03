import type { Interval } from "./types";

/**
 * Removes every `occupied` interval from `base`, returning the remaining
 * free sub-intervals in chronological order. Occupied intervals that only
 * touch a boundary (end === start) do not remove anything — back-to-back
 * is allowed.
 */
export function subtractIntervals(base: Interval, occupied: Interval[]): Interval[] {
  const overlapping = occupied
    .filter((o) => o.end > base.start && o.start < base.end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: Interval[] = [];
  for (const o of overlapping) {
    const clampedStart = o.start < base.start ? base.start : o.start;
    const clampedEnd = o.end > base.end ? base.end : o.end;
    const last = merged[merged.length - 1];
    if (last && clampedStart <= last.end) {
      if (clampedEnd > last.end) last.end = clampedEnd;
    } else {
      merged.push({ start: clampedStart, end: clampedEnd });
    }
  }

  const result: Interval[] = [];
  let cursor = base.start;
  for (const block of merged) {
    if (block.start > cursor) {
      result.push({ start: cursor, end: block.start });
    }
    if (block.end > cursor) {
      cursor = block.end;
    }
  }
  if (cursor < base.end) {
    result.push({ start: cursor, end: base.end });
  }
  return result;
}
