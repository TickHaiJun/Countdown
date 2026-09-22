import { describe, expect, it } from 'vitest';
import {
  clampConfigNumber,
  clockParts,
  cyclePosition,
  DEFAULT_POMODORO_CONFIG,
  displaySeconds,
  localDayKey,
  nextPhase,
  phaseDurationMs,
  type PomodoroConfig,
} from '@/lib/pomodoro';

const config: PomodoroConfig = { ...DEFAULT_POMODORO_CONFIG, longEvery: 4 };

describe('nextPhase', () => {
  it('第 1–3 个番茄后进短休息', () => {
    expect(nextPhase(config, 'focus', 0, true)).toEqual({
      phase: 'short',
      completedInCycle: 1,
      countedPomodoro: true,
    });
    expect(nextPhase(config, 'focus', 2, true).phase).toBe('short');
  });

  it('第 4 个番茄后进长休息', () => {
    expect(nextPhase(config, 'focus', 3, true)).toEqual({
      phase: 'long',
      completedInCycle: 4,
      countedPomodoro: true,
    });
  });

  it('短休息结束回专注，且不清零循环计数', () => {
    expect(nextPhase(config, 'short', 2, false)).toEqual({
      phase: 'focus',
      completedInCycle: 2,
      countedPomodoro: false,
    });
  });

  it('长休息结束回专注，并把循环计数清零', () => {
    expect(nextPhase(config, 'long', 4, false)).toEqual({
      phase: 'focus',
      completedInCycle: 0,
      countedPomodoro: false,
    });
  });

  it('手动跳过不计入完成数，因此不会提前攒到长休息', () => {
    // 已经做完 3 个，跳过第 4 个专注 —— 计数停在 3，且只能进短休息
    expect(nextPhase(config, 'focus', 3, false)).toEqual({
      phase: 'short',
      completedInCycle: 3,
      countedPomodoro: false,
    });
  });

  it('longEvery 被写坏成 0 时回落到默认值，不会除零或永远不进长休息', () => {
    const broken: PomodoroConfig = { ...config, longEvery: 0 };
    expect(nextPhase(broken, 'focus', 3, true).phase).toBe('long');
  });
});

describe('cyclePosition', () => {
  it('专注中显示"正在做第几个"', () => {
    expect(cyclePosition(0, 4, 'focus')).toBe(1);
    expect(cyclePosition(2, 4, 'focus')).toBe(3);
  });

  it('短休息中显示"刚做完第几个"', () => {
    expect(cyclePosition(1, 4, 'short')).toBe(1);
    expect(cyclePosition(3, 4, 'short')).toBe(3);
  });

  it('长休息必然是第 total 个', () => {
    expect(cyclePosition(4, 4, 'long')).toBe(4);
    expect(cyclePosition(0, 4, 'long')).toBe(4);
  });

  it('一整轮走下来，序号是 1,2,3,4 而不是跳到 5', () => {
    const seen: number[] = [];
    let completed = 0;
    let phase: 'focus' | 'short' | 'long' = 'focus';

    for (let step = 0; step < 8; step += 1) {
      if (phase === 'focus') seen.push(cyclePosition(completed, 4, phase));
      const next = nextPhase(config, phase, completed, phase === 'focus');
      completed = next.completedInCycle;
      phase = next.phase;
    }

    expect(seen).toEqual([1, 2, 3, 4]);
  });
});

describe('displaySeconds / clockParts', () => {
  it('向上取整，最后一个数字不会提前消失', () => {
    expect(displaySeconds(400)).toBe(1);
    expect(displaySeconds(1)).toBe(1);
    expect(displaySeconds(0)).toBe(0);
    expect(displaySeconds(-500)).toBe(0);
  });

  it('25 分钟显示成 25:00', () => {
    expect(clockParts(25 * 60_000)).toEqual({ minutes: 25, seconds: 0 });
  });

  it('支持三位数分钟（专注上限 180）', () => {
    expect(clockParts(180 * 60_000)).toEqual({ minutes: 180, seconds: 0 });
  });

  it('剩 59.6 秒仍是 1 分 0 秒，不跨段抖动', () => {
    expect(clockParts(59_600)).toEqual({ minutes: 1, seconds: 0 });
  });
});

describe('clampConfigNumber', () => {
  it('夹进范围并取整', () => {
    expect(clampConfigNumber('focusMin', 0, 25)).toBe(1);
    expect(clampConfigNumber('focusMin', 999, 25)).toBe(180);
    expect(clampConfigNumber('longEvery', 4.6, 4)).toBe(5);
  });

  it('非数字回落到传入的兜底值', () => {
    expect(clampConfigNumber('shortMin', Number.NaN, 5)).toBe(5);
  });
});

describe('phaseDurationMs', () => {
  it('按阶段取对应时长', () => {
    expect(phaseDurationMs(config, 'focus')).toBe(25 * 60_000);
    expect(phaseDurationMs(config, 'short')).toBe(5 * 60_000);
    expect(phaseDurationMs(config, 'long')).toBe(15 * 60_000);
  });
});

describe('localDayKey', () => {
  it('输出本地日期并补零', () => {
    const key = localDayKey(new Date(2026, 8, 5, 23, 30).getTime());
    expect(key).toBe('2026-09-05');
  });
});
