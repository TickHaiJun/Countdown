/**
 * 时间工具 —— 全部锚定 Asia/Shanghai (UTC+8)。
 *
 * 中国不实行夏令时，UTC+8 是恒定偏移，因此直接用固定偏移换算即可，
 * 不需要引入时区数据库。所有「自然日」都指北京时区的自然日。
 */

export const CN_OFFSET_MS = 8 * 60 * 60 * 1000;
export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export interface CnParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = 周日 */
  weekday: number;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function cnParts(ms: number): CnParts {
  const d = new Date(ms + CN_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  };
}

/** 北京时区自然日主键，形如 2026-09-25 */
export function cnDayKey(ms: number): string {
  const p = cnParts(ms);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** 北京时区当日 00:00:00 的绝对毫秒 */
export function cnStartOfDayMs(ms: number): number {
  const p = cnParts(ms);
  return Date.UTC(p.year, p.month - 1, p.day) - CN_OFFSET_MS;
}

/** 构造北京时区某一刻的绝对毫秒 */
export function cnMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  return Date.UTC(year, month - 1, day, hour, minute, second) - CN_OFFSET_MS;
}

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'] as const;

export function cnWeekdayLabel(weekday: number): string {
  return `周${WEEKDAY_CN[weekday] ?? ''}`;
}

/** 2026年9月25日 周五 */
export function formatCnDate(ms: number): string {
  const p = cnParts(ms);
  return `${p.year}年${p.month}月${p.day}日 ${cnWeekdayLabel(p.weekday)}`;
}

/** 9月25日 */
export function formatCnDateShort(ms: number): string {
  const p = cnParts(ms);
  return `${p.month}月${p.day}日`;
}

/** 2026-09-25 */
export function formatIsoDay(ms: number): string {
  return cnDayKey(ms);
}

/** 07:08:12 */
export function formatClock(ms: number): string {
  const p = cnParts(ms);
  return `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
}

/** 09-25 */
export function formatMonthDaySlash(ms: number): string {
  const p = cnParts(ms);
  return `${pad2(p.month)}-${pad2(p.day)}`;
}

/** 序列化为带北京时区偏移的 ISO 字符串：2026-09-25T00:00:00+08:00 */
export function toCnIso(ms: number): string {
  const p = cnParts(ms);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(
    p.minute,
  )}:${pad2(p.second)}+08:00`;
}

/** 从 <input type="date"> 的 YYYY-MM-DD 解析出 { year, month, day } */
export function parseDateInput(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/** 从 <input type="time"> 的 HH:mm 解析出 { hour, minute } */
export function parseTimeInput(value: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 0, minute: 0 };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}
