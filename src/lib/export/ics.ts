/**
 * .ics 日历生成（纯前端、零依赖）。
 *
 * 口径：
 * - 全天事件用 `VALUE=DATE`，DTEND 为「末日次日」（RFC 5545 规定 DTEND 不包含在内）
 * - 带时刻的事件统一用 UTC（`...Z`），避免 TZID 没有配套 VTIMEZONE 时的歧义
 * - 每行按 75 个八位组折行，续行以单个空格开头
 */

import { cnDayKey, DAY_MS, pad2 } from '@/lib/time';
import type { CountdownEvent } from '@/types';
import type { ParsedHoliday } from '@/lib/holidays';

const CRLF = '\r\n';
const encoder = new TextEncoder();

export interface IcsEventInput {
  uid: string;
  title: string;
  description?: string;
  startMs: number;
  endMs: number;
  /** 全天事件（用日期值），否则用 UTC 时间戳 */
  allDay: boolean;
  url?: string;
  /** 起始值为独占结束值（用于已按 RFC 口径算好的场景），默认按 allDay 自动处理 */
  exclusiveEnd?: boolean;
}

export interface IcsOptions {
  calendarName?: string;
  /** 生成 DTSTAMP 用的「现在」，传参便于单测确定性 */
  nowMs?: number;
  prodId?: string;
}

function byteLength(value: string): number {
  return encoder.encode(value).length;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** RFC 5545 §3.1：内容行不超过 75 个八位组，续行以单个空格开头 */
function foldLine(line: string): string {
  if (byteLength(line) <= 75) return line;

  const chunks: string[] = [];
  let current = '';
  let limit = 75;

  for (const char of line) {
    if (byteLength(current) + byteLength(char) > limit) {
      chunks.push(current);
      current = char;
      limit = 74; // 续行前导空格占 1 个八位组
    } else {
      current += char;
    }
  }
  chunks.push(current);
  return chunks.join(`${CRLF} `);
}

function utcStamp(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

function dateStamp(ms: number): string {
  return cnDayKey(ms).replace(/-/g, '');
}

function eventLines(input: IcsEventInput, nowMs: number): string[] {
  const lines: string[] = ['BEGIN:VEVENT', `UID:${input.uid}`, `DTSTAMP:${utcStamp(nowMs)}`];

  if (input.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(input.startMs)}`);
    const endMs = input.exclusiveEnd ? input.endMs : input.endMs + DAY_MS;
    lines.push(`DTEND;VALUE=DATE:${dateStamp(endMs)}`);
  } else {
    lines.push(`DTSTART:${utcStamp(input.startMs)}`);
    lines.push(`DTEND:${utcStamp(input.endMs)}`);
  }

  lines.push(`SUMMARY:${escapeText(input.title)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  if (input.url) lines.push(`URL:${escapeText(input.url)}`);
  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  return lines;
}

export function buildIcs(inputs: IcsEventInput[], options: IcsOptions = {}): string {
  const {
    calendarName = '倒计时 · 中国节假日',
    nowMs = Date.now(),
    prodId = '-//Countdown//CN Holidays//CN',
  } = options;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const input of inputs) lines.push(...eventLines(input, nowMs));
  lines.push('END:VCALENDAR');

  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}

export function holidayToIcsInput(holiday: ParsedHoliday): IcsEventInput {
  const notes: string[] = [`共 ${holiday.days} 天`];
  if (holiday.lunar) notes.push(`农历${holiday.lunar}`);
  if (holiday.makeupWorkdays.length > 0) {
    notes.push(`调休上班：${holiday.makeupWorkdays.join('、')}`);
  }
  notes.push(
    holiday.confidence === 'official'
      ? '数据来源：国务院办公厅放假安排'
      : '数据来源：《全国年节及纪念日放假办法》法定节假日，未含调休',
  );

  return {
    uid: `holiday-${holiday.id}@countdown`,
    title: holiday.name,
    description: notes.join('；'),
    startMs: holiday.startMs,
    endMs: holiday.endMs,
    allDay: true,
  };
}

export function eventToIcsInput(event: CountdownEvent, occurrenceMs: number): IcsEventInput {
  const startMs = event.recurrence.kind === 'none' ? Date.parse(event.start) : occurrenceMs;
  const duration = Math.max(0, Date.parse(event.end) - Date.parse(event.start));

  return {
    uid: `${event.id}@countdown`,
    title: event.title,
    description: event.note,
    startMs,
    endMs: startMs + duration,
    allDay: event.allDay,
  };
}
