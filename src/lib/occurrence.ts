import type { CountdownEvent } from '@/types';
import type { HolidayIndex } from './holidays';
import { resolveNextOccurrence } from './recurrence';
import { HOUR_MS, MINUTE_MS, cnParts, DAY_MS, SECOND_MS } from './time';

/**
 * 事件的下一次发生时刻。
 *
 * 不重复的事件直接返回自身开始时间；重复事件先解析出下一次的「自然日」，
 * 再补回事件原始的时刻偏移（否则每天 09:00 的会议会退化到 00:00）。
 */
export function nextOccurrenceMs(
  event: CountdownEvent,
  nowMs: number,
  index: HolidayIndex,
): number {
  const startMs = Date.parse(event.start);
  if (event.recurrence.kind === 'none') return startMs;

  const parts = cnParts(startMs);
  const offset =
    parts.hour * HOUR_MS + parts.minute * MINUTE_MS + parts.second * SECOND_MS;

  const firstDay = resolveNextOccurrence(event.recurrence, startMs, nowMs, index);
  if (firstDay === null) return startMs;

  let occurrence = firstDay + offset;
  if (occurrence < nowMs) {
    const nextDay = resolveNextOccurrence(
      event.recurrence,
      startMs,
      firstDay + DAY_MS,
      index,
    );
    if (nextDay !== null) occurrence = nextDay + offset;
  }
  return occurrence;
}

export function eventDurationMs(event: CountdownEvent): number {
  const duration = Date.parse(event.end) - Date.parse(event.start);
  return duration > 0 ? duration : 0;
}
