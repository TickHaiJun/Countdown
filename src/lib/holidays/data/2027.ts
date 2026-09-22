import type { HolidayPeriod } from '../types';

const SOURCE =
  '依《全国年节及纪念日放假办法》（2024年11月10日国务院令第795号第四次修订）确定的法定节假日日期';

/**
 * 2027 年法定节假日（共 13 天）。
 *
 * 口径说明：2027 年国务院办公厅的放假调休安排尚未公布，此处只列法条确定的
 * 法定节假日日期，不推断连休与补假。官方通知发布后替换本文件即可，逻辑无需改动。
 *
 * `lunarEn` 按约定用拼音，不做意译。
 */
export const HOLIDAYS_2027: HolidayPeriod[] = [
  {
    id: '2027-yuandan',
    name: '元旦',
    nameEn: "New Year's Day",
    kind: 'statutory',
    start: '2027-01-01T00:00:00+08:00',
    end: '2027-01-01T23:59:59+08:00',
    days: 1,
    makeupWorkdays: [],
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-chunjie',
    name: '春节',
    nameEn: 'Spring Festival',
    kind: 'statutory',
    // 除夕（2月5日）至正月初三（2月8日）
    start: '2027-02-05T00:00:00+08:00',
    end: '2027-02-08T23:59:59+08:00',
    days: 4,
    makeupWorkdays: [],
    lunar: '除夕至正月初三',
    lunarEn: 'Chúxī – Zhēngyuè Chūsān',
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-qingming',
    name: '清明节',
    nameEn: 'Qingming Festival',
    kind: 'statutory',
    start: '2027-04-05T00:00:00+08:00',
    end: '2027-04-05T23:59:59+08:00',
    days: 1,
    makeupWorkdays: [],
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-liaodongjie',
    name: '劳动节',
    nameEn: 'Labour Day',
    kind: 'statutory',
    start: '2027-05-01T00:00:00+08:00',
    end: '2027-05-02T23:59:59+08:00',
    days: 2,
    makeupWorkdays: [],
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-duanwujie',
    name: '端午节',
    nameEn: 'Dragon Boat Festival',
    kind: 'statutory',
    start: '2027-06-09T00:00:00+08:00',
    end: '2027-06-09T23:59:59+08:00',
    days: 1,
    makeupWorkdays: [],
    lunar: '五月初五',
    lunarEn: 'Wǔyuè Chūwǔ',
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-zhongqiujie',
    name: '中秋节',
    nameEn: 'Mid-Autumn Festival',
    kind: 'statutory',
    start: '2027-09-15T00:00:00+08:00',
    end: '2027-09-15T23:59:59+08:00',
    days: 1,
    makeupWorkdays: [],
    lunar: '八月十五',
    lunarEn: 'Bāyuè Shíwǔ',
    confidence: 'statutory',
    source: SOURCE,
  },
  {
    id: '2027-guoqingjie',
    name: '国庆节',
    nameEn: 'National Day',
    kind: 'statutory',
    start: '2027-10-01T00:00:00+08:00',
    end: '2027-10-03T23:59:59+08:00',
    days: 3,
    makeupWorkdays: [],
    confidence: 'statutory',
    source: SOURCE,
  },
];
