import { cnDayKey, cnStartOfDayMs, DAY_MS } from '@/lib/time';
import type { Locale } from '@/types';
import { HOLIDAYS_2026 } from './data/2026';
import { HOLIDAYS_2027 } from './data/2027';
import type { HolidayIndex, HolidayPeriod, ParsedHoliday } from './types';

export * from './types';
export * from './accents';

export const BUILTIN_HOLIDAYS: HolidayPeriod[] = [...HOLIDAYS_2026, ...HOLIDAYS_2027];

/** 按语言取假期名。法定节日用通行译名，不是拼音。 */
export function holidayName(
  period: Pick<HolidayPeriod, 'name' | 'nameEn'>,
  locale: Locale,
): string {
  return locale === 'en' ? period.nameEn : period.name;
}

/**
 * 按语言取农历描述。
 * 按约定农历日期不做意译，英文侧给的是拼音；缺哪一侧就回落到另一侧，
 * 至少不会出现空白。
 */
export function holidayLunar(
  period: Pick<HolidayPeriod, 'lunar' | 'lunarEn'>,
  locale: Locale,
): string | null {
  if (locale === 'en') return period.lunarEn ?? period.lunar ?? null;
  return period.lunar ?? period.lunarEn ?? null;
}

function parsePeriod(period: HolidayPeriod): ParsedHoliday {
  const startMs = Date.parse(period.start);
  const endMs = Date.parse(period.end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new Error(`节假日数据日期非法：${period.id}`);
  }
  return { ...period, startMs, endMs };
}

/**
 * 建立查询索引。
 * `userPeriods` 中出现的年份会整体覆盖内置数据（优先级：用户导入 > 内置）。
 */
export function buildHolidayIndex(
  periods: HolidayPeriod[] = BUILTIN_HOLIDAYS,
): HolidayIndex {
  const parsed = periods
    .map(parsePeriod)
    .sort((a, b) => a.startMs - b.startMs);

  const offDays = new Set<string>();
  for (const p of parsed) {
    for (let ms = cnStartOfDayMs(p.startMs); ms <= p.endMs; ms += DAY_MS) {
      offDays.add(cnDayKey(ms));
    }
  }

  const makeupWorkdays = new Set<string>();
  for (const p of parsed) {
    for (const day of p.makeupWorkdays) makeupWorkdays.add(day);
  }

  return { periods: parsed, offDays, makeupWorkdays };
}

/**
 * 找出「最近一个假期」：
 * 1. 正在放假的假期优先（假期余额优先）
 * 2. 否则取尚未开始且开始时间最早的一个
 * 3. 全部已结束则返回 null
 */
export function findCurrentOrNext(
  index: HolidayIndex,
  nowMs: number,
): ParsedHoliday | null {
  for (const period of index.periods) {
    if (nowMs >= period.startMs && nowMs <= period.endMs) return period;
  }
  for (const period of index.periods) {
    if (period.startMs > nowMs) return period;
  }
  return null;
}

export function findPeriodById(
  index: HolidayIndex,
  id: string,
): ParsedHoliday | undefined {
  return index.periods.find((p) => p.id === id);
}

/** 内置数据构建的索引，可直接复用（纯计算，构建期与运行期结果一致） */
export const BUILTIN_INDEX: HolidayIndex = buildHolidayIndex();
