import type { HolidayIndex } from './holidays';
import { cnDayKey, cnParts, cnStartOfDayMs, DAY_MS } from './time';

export function isWeekendMs(ms: number): boolean {
  const weekday = cnParts(ms).weekday;
  return weekday === 0 || weekday === 6;
}

/**
 * 判断某一天是否为工作日。
 * 顺序很重要：补班日优先于法定放假日与周末。
 */
export function isWorkdayMs(ms: number, index: HolidayIndex): boolean {
  const key = cnDayKey(ms);
  if (index.makeupWorkdays.has(key)) return true;
  if (index.offDays.has(key)) return false;
  return !isWeekendMs(ms);
}

/**
 * 统计 [fromMs, toMs) 之间的工作日数量。
 * 两端都按北京时区的自然日对齐：含起始日，不含结束日。
 */
export function countWorkdaysBetween(
  fromMs: number,
  toMs: number,
  index: HolidayIndex,
): number {
  const end = cnStartOfDayMs(toMs);
  let cursor = cnStartOfDayMs(fromMs);
  let count = 0;
  let guard = 0;

  while (cursor < end && guard < 4000) {
    if (isWorkdayMs(cursor, index)) count += 1;
    cursor += DAY_MS;
    guard += 1;
  }

  return count;
}

/** 距目标时刻还有几个工作日（今天的剩余时间不计入判断，按自然日整算） */
export function workdaysUntil(
  nowMs: number,
  targetMs: number,
  index: HolidayIndex,
): number {
  return countWorkdaysBetween(nowMs, targetMs, index);
}

export interface LeaveStats {
  /** 今年尚未休完的法定假日天数 */
  remaining: number;
  /** 今年已经休掉的法定假日天数 */
  used: number;
  /** 今年法定假日总天数 */
  total: number;
}

/** 按自然日区间统计「今年还剩 / 已休」多少天假期 */
export function leaveStatsThisYear(nowMs: number, index: HolidayIndex): LeaveStats {
  const year = cnParts(nowMs).year;
  const today = cnStartOfDayMs(nowMs);

  let used = 0;
  let remaining = 0;
  let total = 0;

  for (const period of index.periods) {
    for (let ms = cnStartOfDayMs(period.startMs); ms <= period.endMs; ms += DAY_MS) {
      if (cnParts(ms).year !== year) continue;
      total += 1;
      if (ms < today) used += 1;
      else remaining += 1;
    }
  }

  return { remaining, used, total };
}
