import { describe, expect, it } from 'vitest';
import { buildIcs, eventToIcsInput, holidayToIcsInput } from '@/lib/export/ics';
import { buildHolidayIndex } from '@/lib/holidays';
import { findPeriodById } from '@/lib/holidays';
import { HOLIDAYS_2026 } from '@/lib/holidays/data/2026';
import { cnMs } from '@/lib/time';
import type { CountdownEvent } from '@/types';

const NOW = cnMs(2026, 9, 21, 16, 32, 0);
const INDEX = buildHolidayIndex(HOLIDAYS_2026);

function lines(ics: string): string[] {
  return ics.split('\r\n');
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

describe('ics', () => {
  it('全天事件用 VALUE=DATE，且 DTEND 为末日次日（RFC 5545 不含末日）', () => {
    const period = findPeriodById(INDEX, '2026-zhongqiu');
    expect(period).toBeDefined();
    if (!period) return;

    const ics = buildIcs([holidayToIcsInput(period)], { nowMs: NOW });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260925');
    // 2026 中秋放假到 9/27，因此 DTEND 是 9/28
    expect(ics).toContain('DTEND;VALUE=DATE:20260928');
    expect(ics).toContain('DTSTAMP:20260921T083200Z');
  });

  it('带时刻的事件统一用 UTC 时间戳', () => {
    const event: CountdownEvent = {
      id: 'e1',
      title: '早会',
      allDay: false,
      start: '2026-10-01T09:30:00+08:00',
      end: '2026-10-01T10:30:00+08:00',
      tag: 'work',
      pinned: false,
      recurrence: { kind: 'none' },
      createdAt: '2026-09-01T00:00:00+08:00',
      updatedAt: '2026-09-01T00:00:00+08:00',
    };

    const input = eventToIcsInput(event, Date.parse(event.start));
    const ics = buildIcs([input], { nowMs: NOW });

    // 09:30 +08:00 == 01:30Z
    expect(ics).toContain('DTSTART:20261001T013000Z');
    expect(ics).toContain('DTEND:20261001T023000Z');
    expect(ics).not.toContain('TZID');
  });

  it('重复事件使用传入的发生时刻而不是原始 start', () => {
    const event: CountdownEvent = {
      id: 'e2',
      title: '发薪日',
      allDay: true,
      start: '2026-01-15T00:00:00+08:00',
      end: '2026-01-15T23:59:59+08:00',
      tag: 'payday',
      pinned: false,
      recurrence: { kind: 'monthly', day: 15 },
      createdAt: '2026-01-01T00:00:00+08:00',
      updatedAt: '2026-01-01T00:00:00+08:00',
    };

    const occurrence = cnMs(2026, 10, 15, 0, 0, 0);
    const ics = buildIcs([eventToIcsInput(event, occurrence)], { nowMs: NOW });
    expect(ics).toContain('DTSTART;VALUE=DATE:20261015');
  });

  it('转义逗号、分号与换行，并折行到 75 个八位组以内', () => {
    const input = {
      uid: 'x@countdown',
      title: '备注里有逗号,分号;还有换行\n第二行',
      description: '中文字符会占 3 个八位组，'.repeat(12),
      startMs: cnMs(2026, 10, 1, 0, 0, 0),
      endMs: cnMs(2026, 10, 7, 23, 59, 59),
      allDay: true,
    };

    const ics = buildIcs([input], { nowMs: NOW });

    expect(ics).toContain('\\,');
    expect(ics).toContain('\\;');
    expect(ics).toContain('\\n');

    for (const line of lines(ics)) {
      expect(byteLength(line)).toBeLessThanOrEqual(75);
    }
    // 续行必须以单个空格开头
    const continuation = lines(ics).filter((line) => line.startsWith(' '));
    expect(continuation.length).toBeGreaterThan(0);
  });

  it('假期事件把调休与数据来源写进 DESCRIPTION', () => {
    const period = findPeriodById(INDEX, '2026-guoqing');
    expect(period).toBeDefined();
    if (!period) return;

    const ics = buildIcs([holidayToIcsInput(period)], { nowMs: NOW });
    expect(ics).toContain('共 7 天');
    expect(ics).toContain('2026-09-20');
    expect(ics).toContain('2026-10-10');
  });
});
