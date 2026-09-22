import { describe, expect, it } from 'vitest';
import { computeCountdown, getPhase, splitDuration } from '@/lib/countdown';
import { cnMs } from '@/lib/time';

const START = cnMs(2026, 9, 25, 0, 0, 0);
const END = cnMs(2026, 9, 27, 23, 59, 59);

describe('getPhase', () => {
  it('开始前为 upcoming', () => {
    expect(getPhase(START, END, cnMs(2026, 9, 24, 23, 59, 59))).toBe('upcoming');
  });

  it('开始瞬间进入 ongoing', () => {
    expect(getPhase(START, END, START)).toBe('ongoing');
  });

  it('结束瞬间仍为 ongoing', () => {
    expect(getPhase(START, END, END)).toBe('ongoing');
  });

  it('结束后为 ended', () => {
    expect(getPhase(START, END, END + 1000)).toBe('ended');
  });
});

describe('splitDuration', () => {
  it('按天时分秒拆分，全部为 floor 口径', () => {
    const ms = 3 * 86400000 + 7 * 3600000 + 8 * 60000 + 12 * 1000;
    expect(splitDuration(ms)).toEqual({
      days: 3,
      hours: 7,
      minutes: 8,
      seconds: 12,
    });
  });

  it('负数归零', () => {
    expect(splitDuration(-5000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});

describe('computeCountdown', () => {
  it('未开始：2026-09-21 16:52 距中秋还有 3 天 07 时 08 分', () => {
    const view = computeCountdown(START, END, cnMs(2026, 9, 21, 16, 52, 0));
    expect(view.phase).toBe('upcoming');
    expect(view.digits).toEqual({ days: 3, hours: 7, minutes: 8, seconds: 0 });
    expect(view.progress).toBe(0);
    expect(view.isFinalDay).toBe(false);
  });

  it('未开始且不足一天时进入最后 24 小时', () => {
    const view = computeCountdown(START, END, cnMs(2026, 9, 24, 12, 0, 0));
    expect(view.isFinalDay).toBe(true);
    expect(view.digits.days).toBe(0);
  });

  it('进行中：剩余按距结束计算', () => {
    const view = computeCountdown(START, END, cnMs(2026, 9, 25, 12, 0, 0));
    expect(view.phase).toBe('ongoing');
    expect(view.digits).toEqual({ days: 2, hours: 11, minutes: 59, seconds: 59 });
    expect(view.daysLeft).toBe(2);
    expect(view.daysElapsed).toBe(0);
    expect(view.progress).toBeCloseTo(0.1667, 3);
  });

  it('进行中最后一天：剩余不足 24 小时', () => {
    const view = computeCountdown(START, END, cnMs(2026, 9, 27, 12, 0, 0));
    expect(view.isFinalDay).toBe(true);
  });

  it('已结束：进度封顶为 1，数字归零', () => {
    const view = computeCountdown(START, END, cnMs(2026, 10, 8, 0, 0, 0));
    expect(view.phase).toBe('ended');
    expect(view.progress).toBe(1);
    expect(view.digits).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(view.daysLeft).toBe(0);
  });
});
