import type { Recurrence } from '@/types';
import type { HolidayIndex } from './holidays';
import { cnMs, cnParts, cnStartOfDayMs, DAY_MS } from './time';
import { isWorkdayMs } from './workdays';

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** 每月第 n 个周 X；nth = -1 表示最后一个 */
export function nthWeekdayOfMonth(
  year: number,
  month: number,
  nth: number,
  weekday: number,
): number | null {
  const total = daysInMonth(year, month);

  if (nth === -1) {
    for (let day = total; day >= 1; day -= 1) {
      if (weekdayOf(year, month, day) === weekday) return day;
    }
    return null;
  }

  let seen = 0;
  for (let day = 1; day <= total; day += 1) {
    if (weekdayOf(year, month, day) === weekday) {
      seen += 1;
      if (seen === nth) return day;
    }
  }
  return null;
}

/** 某月最后一个工作日（排除周末与法定假日，计入补班日） */
export function lastWorkdayOfMonth(
  year: number,
  month: number,
  index: HolidayIndex,
): number {
  for (let day = daysInMonth(year, month); day >= 1; day -= 1) {
    if (isWorkdayMs(cnMs(year, month, day), index)) return day;
  }
  return 1;
}

/** 从 fromDay 所在月起，逐月产生 { year, month }，最多 count 个 */
function* monthCursor(
  fromMs: number,
  count: number,
): Generator<{ year: number; month: number }> {
  const start = cnParts(fromMs);
  for (let i = 0; i < count; i += 1) {
    const shifted = start.month - 1 + i;
    yield {
      year: start.year + Math.floor(shifted / 12),
      month: (shifted % 12) + 1,
    };
  }
}

/**
 * 计算下一次发生时刻（绝对毫秒）。返回 null 表示该规则无后续。
 *
 * `anchorMs` 仅用于「每 N 天」这类需要起算点的规则。
 * 返回值一律是北京时区当日 00:00。
 */
export function resolveNextOccurrence(
  rule: Recurrence,
  anchorMs: number,
  fromMs: number,
  index: HolidayIndex,
): number | null {
  const fromDay = cnStartOfDayMs(fromMs);

  switch (rule.kind) {
    case 'none':
      return null;

    case 'daily': {
      const interval = Math.max(1, rule.interval ?? 1);
      const anchorDay = cnStartOfDayMs(anchorMs);
      const diffDays = Math.floor((fromDay - anchorDay) / DAY_MS);
      let step = Math.max(0, Math.ceil(diffDays / interval));
      let candidate = anchorDay + step * interval * DAY_MS;
      while (candidate < fromDay) {
        step += 1;
        candidate = anchorDay + step * interval * DAY_MS;
      }
      return candidate;
    }

    case 'weekly': {
      const weekdays =
        rule.weekdays && rule.weekdays.length > 0
          ? rule.weekdays
          : [cnParts(fromDay).weekday];
      for (let i = 0; i < 14; i += 1) {
        const day = fromDay + i * DAY_MS;
        if (weekdays.includes(cnParts(day).weekday)) return day;
      }
      return null;
    }

    case 'monthly': {
      const target = rule.day ?? 1;
      for (const { year, month } of monthCursor(fromDay, 60)) {
        const day = Math.min(target, daysInMonth(year, month));
        const candidate = cnMs(year, month, day);
        if (candidate >= fromDay) return candidate;
      }
      return null;
    }

    case 'yearly': {
      const month = rule.month ?? 1;
      const target = rule.day ?? 1;
      const baseYear = cnParts(fromDay).year;
      for (let i = 0; i < 5; i += 1) {
        const year = baseYear + i;
        const day = Math.min(target, daysInMonth(year, month));
        const candidate = cnMs(year, month, day);
        if (candidate >= fromDay) return candidate;
      }
      return null;
    }

    case 'monthlyNthWeekday': {
      const nth = rule.nth ?? 1;
      const weekday = rule.weekday ?? 1;
      for (const { year, month } of monthCursor(fromDay, 60)) {
        const day = nthWeekdayOfMonth(year, month, nth, weekday);
        if (day === null) continue;
        const candidate = cnMs(year, month, day);
        if (candidate >= fromDay) return candidate;
      }
      return null;
    }

    case 'monthlyLastWorkday': {
      for (const { year, month } of monthCursor(fromDay, 60)) {
        const day = lastWorkdayOfMonth(year, month, index);
        const candidate = cnMs(year, month, day);
        if (candidate >= fromDay) return candidate;
      }
      return null;
    }

    case 'payday': {
      const target = rule.day ?? 15;
      const adjust = rule.adjust ?? 'backward';
      for (const { year, month } of monthCursor(fromDay, 60)) {
        const dim = daysInMonth(year, month);
        let candidate = cnMs(year, month, Math.min(target, dim));
        if (adjust !== 'none') {
          const direction = adjust === 'backward' ? -DAY_MS : DAY_MS;
          let guard = 0;
          while (!isWorkdayMs(candidate, index) && guard < 40) {
            candidate += direction;
            guard += 1;
          }
        }
        if (candidate >= fromDay) return candidate;
      }
      return null;
    }

    default:
      return null;
  }
}
