import { describe, expect, it } from 'vitest';
import { BUILTIN_INDEX, findCurrentOrNext } from '@/lib/holidays';
import { cnDayKey, cnMs } from '@/lib/time';
import {
  countWorkdaysBetween,
  isWorkdayMs,
  leaveStatsThisYear,
  workdaysUntil,
} from '@/lib/workdays';

const ZHONGQIU_START = cnMs(2026, 9, 25, 0, 0, 0);

describe('isWorkdayMs', () => {
  it('普通工作日', () => {
    expect(isWorkdayMs(cnMs(2026, 9, 21), BUILTIN_INDEX)).toBe(true);
  });

  it('普通周末不算工作日', () => {
    // 2026-09-19 是周六
    expect(isWorkdayMs(cnMs(2026, 9, 19), BUILTIN_INDEX)).toBe(false);
  });

  it('补班日算工作日（2026-09-20 周日上班）', () => {
    expect(isWorkdayMs(cnMs(2026, 9, 20), BUILTIN_INDEX)).toBe(true);
  });

  it('法定放假日不算工作日', () => {
    expect(isWorkdayMs(cnMs(2026, 10, 1), BUILTIN_INDEX)).toBe(false);
    expect(isWorkdayMs(cnMs(2026, 9, 25), BUILTIN_INDEX)).toBe(false);
  });

  it('补班日优先于放假日判定（2026-10-10 周六上班）', () => {
    expect(isWorkdayMs(cnMs(2026, 10, 10), BUILTIN_INDEX)).toBe(true);
  });
});

describe('countWorkdaysBetween', () => {
  it('2026-09-21 到中秋开始还有 4 个工作日', () => {
    expect(
      workdaysUntil(cnMs(2026, 9, 21, 16, 52, 0), ZHONGQIU_START, BUILTIN_INDEX),
    ).toBe(4);
  });

  it('起点本身是放假日时不计入', () => {
    expect(
      countWorkdaysBetween(ZHONGQIU_START, cnMs(2026, 10, 1), BUILTIN_INDEX),
    ).toBe(3);
  });

  it('同一天区间为 0', () => {
    expect(
      countWorkdaysBetween(cnMs(2026, 9, 21), cnMs(2026, 9, 21), BUILTIN_INDEX),
    ).toBe(0);
  });
});

describe('leaveStatsThisYear', () => {
  it('2026 年内置数据只含中秋与国庆，共 10 天', () => {
    const stats = leaveStatsThisYear(cnMs(2026, 9, 21, 12, 0, 0), BUILTIN_INDEX);
    expect(stats.total).toBe(10);
    expect(stats.used).toBe(0);
    expect(stats.remaining).toBe(10);
  });

  it('国庆结束后全部计入已休', () => {
    const stats = leaveStatsThisYear(cnMs(2026, 12, 1, 12, 0, 0), BUILTIN_INDEX);
    expect(stats.used).toBe(10);
    expect(stats.remaining).toBe(0);
  });
});

describe('节假日数据', () => {
  it('2026-09-21 的最近假期是中秋', () => {
    const holiday = findCurrentOrNext(BUILTIN_INDEX, cnMs(2026, 9, 21, 12, 0, 0));
    expect(holiday?.name).toBe('中秋节');
  });

  it('中秋期间返回中秋本身，而不是国庆', () => {
    const holiday = findCurrentOrNext(BUILTIN_INDEX, cnMs(2026, 9, 26, 12, 0, 0));
    expect(holiday?.name).toBe('中秋节');
  });

  it('国庆期间返回国庆', () => {
    const holiday = findCurrentOrNext(BUILTIN_INDEX, cnMs(2026, 10, 3, 12, 0, 0));
    expect(holiday?.name).toBe('国庆节');
  });

  it('2027 法定节假日共 13 天', () => {
    const total = BUILTIN_INDEX.periods
      .filter((period) => period.confidence === 'statutory')
      .reduce((sum, period) => sum + period.days, 0);
    expect(total).toBe(13);
  });

  it('放假日期集合覆盖中秋三天', () => {
    for (const day of ['2026-09-25', '2026-09-26', '2026-09-27']) {
      expect(BUILTIN_INDEX.offDays.has(day)).toBe(true);
    }
    expect(cnDayKey(ZHONGQIU_START)).toBe('2026-09-25');
  });
});
