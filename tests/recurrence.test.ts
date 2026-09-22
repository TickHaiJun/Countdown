import { describe, expect, it } from 'vitest';
import { BUILTIN_INDEX } from '@/lib/holidays';
import {
  daysInMonth,
  lastWorkdayOfMonth,
  nthWeekdayOfMonth,
  resolveNextOccurrence,
} from '@/lib/recurrence';
import { cnDayKey, cnMs } from '@/lib/time';

const anchor = cnMs(2026, 1, 1);

describe('daysInMonth / nthWeekdayOfMonth', () => {
  it('闰年二月为 29 天', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
  });

  it('每月最后一个周五', () => {
    // 2026-09-25 是周五，且是 9 月最后一个周五
    expect(nthWeekdayOfMonth(2026, 9, -1, 5)).toBe(25);
  });

  it('每月第 2 个周三', () => {
    expect(nthWeekdayOfMonth(2026, 9, 2, 3)).toBe(9);
  });
});

describe('lastWorkdayOfMonth', () => {
  it('2026 年 10 月最后一个工作日是 10 月 30 日（31 日是周六）', () => {
    expect(lastWorkdayOfMonth(2026, 10, BUILTIN_INDEX)).toBe(30);
  });

  it('2026 年 9 月最后一个工作日是 9 月 30 日', () => {
    expect(lastWorkdayOfMonth(2026, 9, BUILTIN_INDEX)).toBe(30);
  });
});

describe('resolveNextOccurrence', () => {
  it('不重复返回 null', () => {
    expect(
      resolveNextOccurrence({ kind: 'none' }, anchor, cnMs(2026, 9, 21), BUILTIN_INDEX),
    ).toBeNull();
  });

  it('每周：命中本周还未到的周日（0 = 周日）', () => {
    // 2026-09-21 是周一，下一个周日是 9-27
    const next = resolveNextOccurrence(
      { kind: 'weekly', weekdays: [0] },
      anchor,
      cnMs(2026, 9, 21),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-09-27');
  });

  it('每月 31 日在小月自动落到月末', () => {
    const next = resolveNextOccurrence(
      { kind: 'monthly', day: 31 },
      anchor,
      cnMs(2027, 2, 1),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2027-02-28');
  });

  it('每年：跨年后取到下一年的同一日期', () => {
    const next = resolveNextOccurrence(
      { kind: 'yearly', month: 10, day: 1 },
      anchor,
      cnMs(2026, 12, 20),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2027-10-01');
  });

  it('每月最后一个工作日：10 月落到 10-30', () => {
    const next = resolveNextOccurrence(
      { kind: 'monthlyLastWorkday' },
      anchor,
      cnMs(2026, 10, 5),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-10-30');
  });

  it('发薪日遇周末提前：2026-11-15 是周日，提前到 11-13 周五', () => {
    const next = resolveNextOccurrence(
      { kind: 'payday', day: 15, adjust: 'backward' },
      anchor,
      cnMs(2026, 11, 1),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-11-13');
  });

  it('发薪日遇周末延后：同一月份延后到 11-16 周一', () => {
    const next = resolveNextOccurrence(
      { kind: 'payday', day: 15, adjust: 'forward' },
      anchor,
      cnMs(2026, 11, 1),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-11-16');
  });

  it('发薪日遇法定节假日同样调整：10-01 提前到 09-30', () => {
    const next = resolveNextOccurrence(
      { kind: 'payday', day: 1, adjust: 'backward' },
      anchor,
      cnMs(2026, 9, 20),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-09-30');
  });

  it('每 N 天：当天正好是发生日时返回当天本身', () => {
    const start = cnMs(2026, 9, 21);
    const next = resolveNextOccurrence(
      { kind: 'daily', interval: 3 },
      start,
      cnMs(2026, 9, 27),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-09-27');
  });

  it('每 N 天：错过发生日后顺延到下一个周期（9-21 + 9 = 9-30）', () => {
    const start = cnMs(2026, 9, 21);
    const next = resolveNextOccurrence(
      { kind: 'daily', interval: 3 },
      start,
      cnMs(2026, 9, 28),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-09-30');
  });

  it('每月第几个周几：每月第 2 个周三', () => {
    const next = resolveNextOccurrence(
      { kind: 'monthlyNthWeekday', nth: 2, weekday: 3 },
      anchor,
      cnMs(2026, 9, 1),
      BUILTIN_INDEX,
    );
    expect(cnDayKey(next as number)).toBe('2026-09-09');
  });
});
