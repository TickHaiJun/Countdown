/**
 * 日期格式化 —— 全部基于北京时区的自然日。
 *
 * 刻意不使用 `Intl.DateTimeFormat`：Node 与浏览器对 `zh-CN` 的细节输出
 * （"周五" vs "星期五"、全角逗号）并不总是完全一致，静态导出下会变成
 * hydration mismatch。查表成本极低，且输出 100% 确定。
 */

import { cnParts, pad2 } from '@/lib/time';
import type { Locale, MessageKey, MessageVars } from './index';

type Translate = (key: MessageKey, vars?: MessageVars) => string;

export type { Translate };

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_ZH_LONG = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
];
const WEEKDAY_ZH_NARROW = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_EN_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_EN_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function weekdayName(weekday: number, locale: Locale, long = false): string {
  const index = ((weekday % 7) + 7) % 7;
  if (locale === 'en') {
    return (long ? WEEKDAY_EN_LONG : WEEKDAY_EN)[index] ?? '';
  }
  return (long ? WEEKDAY_ZH_LONG : WEEKDAY_ZH)[index] ?? '';
}

function monthName(month: number, short = true): string {
  const index = Math.min(Math.max(month, 1), 12) - 1;
  return (short ? MONTH_EN : MONTH_EN_LONG)[index] ?? '';
}

/** 2026年9月25日 周五 · Fri, Sep 25, 2026 */
export function formatDateFull(ms: number, locale: Locale): string {
  const p = cnParts(ms);
  if (locale === 'en') {
    return `${weekdayName(p.weekday, 'en')}, ${monthName(p.month)} ${p.day}, ${p.year}`;
  }
  return `${p.year}年${p.month}月${p.day}日 ${weekdayName(p.weekday, 'zh')}`;
}

/** 9月25日 周五 · Sep 25, Fri */
export function formatDateMedium(ms: number, locale: Locale): string {
  const p = cnParts(ms);
  if (locale === 'en') {
    return `${monthName(p.month)} ${p.day}, ${weekdayName(p.weekday, 'en')}`;
  }
  return `${p.month}月${p.day}日 ${weekdayName(p.weekday, 'zh')}`;
}

/** 9月25日 · Sep 25 */
export function formatDateShort(ms: number, locale: Locale): string {
  const p = cnParts(ms);
  if (locale === 'en') return `${monthName(p.month)} ${p.day}`;
  return `${p.month}月${p.day}日`;
}

/** 9/25 · 09/25 */
export function formatDateNumeric(ms: number, locale: Locale): string {
  const p = cnParts(ms);
  return locale === 'en' ? `${pad2(p.month)}/${pad2(p.day)}` : `${p.month}/${p.day}`;
}

/** 2026-09-25 —— 与语言无关，用于 <input type="date"> 与文件名 */
export function formatDateIso(ms: number): string {
  const p = cnParts(ms);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** 周五 · Fri / 星期五 · Friday */
export function formatWeekday(ms: number, locale: Locale, long = false): string {
  return weekdayName(cnParts(ms).weekday, locale, long);
}

/**
 * 按 0=周日 的索引取星期名。
 *
 * `narrow` 用于"每周X"这种已经带"每"字的场景：中文给单个"一/三"，
 * 英文仍然给 "Mon"，因为英文省略后会失去意义。
 */
export function formatWeekdayIndex(
  weekday: number,
  locale: Locale,
  narrow = false,
): string {
  const index = ((weekday % 7) + 7) % 7;
  if (locale === 'en') return WEEKDAY_EN[index] ?? '';
  return (narrow ? WEEKDAY_ZH_NARROW : WEEKDAY_ZH)[index] ?? '';
}

/** 07:08 / 07:08:12 */
export function formatClockShort(ms: number, withSeconds = false): string {
  const p = cnParts(ms);
  return withSeconds
    ? `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`
    : `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * 智能区间：
 *   同一天    1月1日                  Jan 1
 *   同月      9月25日 — 27日          Sep 25 — 27
 *   同年跨月  9月25日 — 10月7日       Sep 25 — Oct 7
 *   跨年      2026年12月30日 — 2027年1月2日   Dec 30, 2026 — Jan 2, 2027
 *
 * 单日必须单独处理：元旦是一天，`1月1日 — 1日` 读起来像笔误。
 */
export function formatDateRange(startMs: number, endMs: number, locale: Locale): string {
  const a = cnParts(startMs);
  const b = cnParts(endMs);

  if (a.year === b.year && a.month === b.month && a.day === b.day) {
    return locale === 'en' ? `${monthName(a.month)} ${a.day}` : `${a.month}月${a.day}日`;
  }

  if (locale === 'en') {
    if (a.year === b.year && a.month === b.month) {
      return `${monthName(a.month)} ${a.day} — ${b.day}`;
    }
    if (a.year === b.year) {
      return `${monthName(a.month)} ${a.day} — ${monthName(b.month)} ${b.day}`;
    }
    return `${monthName(a.month)} ${a.day}, ${a.year} — ${monthName(b.month)} ${b.day}, ${b.year}`;
  }

  if (a.year === b.year && a.month === b.month) {
    return `${a.month}月${a.day}日 — ${b.day}日`;
  }
  if (a.year === b.year) {
    return `${a.month}月${a.day}日 — ${b.month}月${b.day}日`;
  }
  return `${a.year}年${a.month}月${a.day}日 — ${b.year}年${b.month}月${b.day}日`;
}

/**
 * 带年份的日期区间——导出卡片用。
 *
 * 和 `formatDateRange` 的区别是起点永远写全年份，终点在同一年时省略，
 * 这样「2026年9月25日 — 10月7日」既短又没有跨年歧义。
 */
export function formatDateRangeFull(startMs: number, endMs: number, locale: Locale): string {
  const a = cnParts(startMs);
  const b = cnParts(endMs);
  const sameDay = a.year === b.year && a.month === b.month && a.day === b.day;

  if (locale === 'en') {
    if (sameDay) return `${monthName(a.month)} ${a.day}, ${a.year}`;
    if (a.year === b.year) {
      return `${monthName(a.month)} ${a.day} — ${monthName(b.month)} ${b.day}, ${a.year}`;
    }
    return `${monthName(a.month)} ${a.day}, ${a.year} — ${monthName(b.month)} ${b.day}, ${b.year}`;
  }

  if (sameDay) return `${a.year}年${a.month}月${a.day}日`;
  if (a.year === b.year) return `${a.year}年${a.month}月${a.day}日 — ${b.month}月${b.day}日`;
  return `${a.year}年${a.month}月${a.day}日 — ${b.year}年${b.month}月${b.day}日`;
}

/**
 * 相对日期：今天 / 明天 / 后天 / 9月28日
 *
 * 以北京时区的自然日为界比较，绝不按 24 小时差计算——
 * 今晚 23:00 看明早 08:00，两者只差 9 小时，但必须显示"明天"。
 */
export function formatRelativeDay(
  ms: number,
  nowMs: number,
  locale: Locale,
  t: Translate,
): string {
  const today = cnParts(nowMs);
  const target = cnParts(ms);

  const todayKey = today.year * 10000 + today.month * 100 + today.day;
  const targetKey = target.year * 10000 + target.month * 100 + target.day;
  const diff = targetKey - todayKey;

  if (diff === 0) return t('common.today');
  if (diff === 1) return t('common.tomorrow');
  if (diff === 2 && locale === 'zh') return t('common.dayAfter');
  return formatDateShort(ms, locale);
}

/** 用于 .ics 的 UTC 时间戳：20260925T000000Z */
export function formatIcsStamp(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}
