import type { HolidayPeriod } from '../types';

const SOURCE = '国务院办公厅关于2026年部分节假日安排的通知（国办发明电〔2025〕7号）';

/**
 * 2026 年官方放假安排。
 *
 * 需求约定：2026 只内置中秋与国庆——截至 2026-09-21，其余法定假期的放假日期均已过去。
 * 完整全年数据来源同上，如需「今年已休多少天」的精确统计再补入。
 */
export const HOLIDAYS_2026: HolidayPeriod[] = [
  {
    id: '2026-zhongqiu',
    name: '中秋节',
    nameEn: 'Mid-Autumn Festival',
    kind: 'statutory',
    start: '2026-09-25T00:00:00+08:00',
    end: '2026-09-27T23:59:59+08:00',
    days: 3,
    makeupWorkdays: [],
    lunar: '八月十五',
    lunarEn: 'Bāyuè Shíwǔ',
    confidence: 'official',
    source: SOURCE,
  },
  {
    id: '2026-guoqing',
    name: '国庆节',
    nameEn: 'National Day',
    kind: 'statutory',
    start: '2026-10-01T00:00:00+08:00',
    end: '2026-10-07T23:59:59+08:00',
    days: 7,
    // 9月20日（周日）、10月10日（周六）上班
    makeupWorkdays: ['2026-09-20', '2026-10-10'],
    confidence: 'official',
    source: SOURCE,
  },
];
