import { describe, expect, it } from 'vitest';
import {
  formatDateFull,
  formatDateMedium,
  formatDateRange,
  formatDateRangeFull,
  formatRelativeDay,
  formatWeekdayIndex,
} from '@/i18n/format';
import { cnMs } from '@/lib/time';

/**
 * 这些格式化函数刻意不走 Intl（Node 与浏览器的 zh-CN 输出不完全一致，
 * 静态导出下会 hydration mismatch），所以更需要测试钉住输出。
 */

const D = (y: number, m: number, d: number, h = 0, min = 0) => cnMs(y, m, d, h, min, 0);

/** 只关心日期比较时用的 t()，实际文案与本测试无关 */
const t = (key: string) => `‹${key}›`;

describe('formatDateRange', () => {
  it('单日不画成区间', () => {
    // 元旦就是一天；曾经输出「1月1日 — 1日」，读起来像笔误
    expect(formatDateRange(D(2027, 1, 1), D(2027, 1, 1), 'zh')).toBe('1月1日');
    expect(formatDateRange(D(2027, 1, 1), D(2027, 1, 1), 'en')).toBe('Jan 1');
  });

  it('同月区间省略重复的月份', () => {
    expect(formatDateRange(D(2026, 9, 25), D(2026, 9, 27), 'zh')).toBe('9月25日 — 27日');
    expect(formatDateRange(D(2026, 9, 25), D(2026, 9, 27), 'en')).toBe('Sep 25 — 27');
  });

  it('同年跨月时两端都写月份', () => {
    expect(formatDateRange(D(2026, 9, 25), D(2026, 10, 7), 'zh')).toBe('9月25日 — 10月7日');
    expect(formatDateRange(D(2026, 9, 25), D(2026, 10, 7), 'en')).toBe('Sep 25 — Oct 7');
  });

  it('跨年时两端都写年份', () => {
    expect(formatDateRange(D(2026, 12, 30), D(2027, 1, 2), 'zh')).toBe(
      '2026年12月30日 — 2027年1月2日',
    );
    expect(formatDateRange(D(2026, 12, 30), D(2027, 1, 2), 'en')).toBe(
      'Dec 30, 2026 — Jan 2, 2027',
    );
  });
});

describe('formatDateRangeFull', () => {
  it('终点同年时省略年份，单日只写一天', () => {
    expect(formatDateRangeFull(D(2027, 1, 1), D(2027, 1, 1), 'zh')).toBe('2027年1月1日');
    expect(formatDateRangeFull(D(2026, 9, 25), D(2026, 10, 7), 'zh')).toBe(
      '2026年9月25日 — 10月7日',
    );
    expect(formatDateRangeFull(D(2026, 9, 25), D(2026, 10, 7), 'en')).toBe('Sep 25 — Oct 7, 2026');
  });
});

describe('formatDateFull / formatDateMedium', () => {
  it('中文带年与周几，英文用逗号分隔', () => {
    // 2026-09-25 是周五
    expect(formatDateFull(D(2026, 9, 25), 'zh')).toBe('2026年9月25日 周五');
    expect(formatDateFull(D(2026, 9, 25), 'en')).toBe('Fri, Sep 25, 2026');
    expect(formatDateMedium(D(2026, 9, 25), 'zh')).toBe('9月25日 周五');
    expect(formatDateMedium(D(2026, 9, 25), 'en')).toBe('Sep 25, Fri');
  });
});

describe('formatRelativeDay', () => {
  const now = D(2026, 9, 21, 23, 0);

  it('按北京时区自然日比较，而不是按 24 小时差', () => {
    // 今晚 23:00 看明早 08:00 只差 9 小时，但必须说「明天」
    expect(formatRelativeDay(D(2026, 9, 22, 8, 0), now, 'zh', t)).toBe('‹common.tomorrow›');
    expect(formatRelativeDay(D(2026, 9, 21, 23, 30), now, 'zh', t)).toBe('‹common.today›');
  });

  it('后天只对中文生效，英文回落到具体日期', () => {
    expect(formatRelativeDay(D(2026, 9, 23), now, 'zh', t)).toBe('‹common.dayAfter›');
    expect(formatRelativeDay(D(2026, 9, 23), now, 'en', t)).toBe('Sep 23');
    // 更远的日子一律给日期
    expect(formatRelativeDay(D(2026, 9, 24), now, 'zh', t)).toBe('9月24日');
  });
});

describe('formatWeekdayIndex', () => {
  it('narrow 只对中文生效——英文省略后就没意义了', () => {
    expect(formatWeekdayIndex(1, 'zh', true)).toBe('一');
    expect(formatWeekdayIndex(1, 'zh', false)).toBe('周一');
    expect(formatWeekdayIndex(1, 'en', true)).toBe('Mon');
  });
});
