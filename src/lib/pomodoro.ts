/**
 * 番茄工作法的纯逻辑。
 *
 * 刻意与 zustand store 分开：这些函数不碰 window / localStorage，可以在
 * node 环境下直接单测。番茄钟最容易错的地方就是「长休息该在第几个番茄之后」，
 * 差一个数整个节奏就废了，所以那部分必须是可测的纯函数。
 */

export type PomodoroPhase = 'focus' | 'short' | 'long';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroConfig {
  /** 专注时长（分钟） */
  focusMin: number;
  /** 短休息（分钟） */
  shortMin: number;
  /** 长休息（分钟） */
  longMin: number;
  /** 每完成几个番茄进一次长休息 */
  longEvery: number;
  /** 一段结束后自动开始下一段 */
  autoNext: boolean;
  /** 结束时响一声 */
  sound: boolean;
}

/** 经典 25 / 5 / 15，每 4 个番茄长休息 */
export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoNext: true,
  sound: true,
};

/**
 * 输入范围。
 * 专注上限取 180：这样「分」最多三位数，翻牌布局不用为更长的时长再改一版。
 */
export const POMODORO_LIMITS = {
  focusMin: { min: 1, max: 180 },
  shortMin: { min: 1, max: 60 },
  longMin: { min: 1, max: 120 },
  longEvery: { min: 2, max: 12 },
} as const;

export type PomodoroNumberField = keyof typeof POMODORO_LIMITS;

/** 把手输/粘贴进来的值夹进范围；非数字回落到兜底值 */
export function clampConfigNumber(
  field: PomodoroNumberField,
  value: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  const { min, max } = POMODORO_LIMITS[field];
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function phaseMinutes(config: PomodoroConfig, phase: PomodoroPhase): number {
  if (phase === 'focus') return config.focusMin;
  if (phase === 'short') return config.shortMin;
  return config.longMin;
}

export function phaseDurationMs(config: PomodoroConfig, phase: PomodoroPhase): number {
  return phaseMinutes(config, phase) * 60_000;
}

export interface PhaseStep {
  /** 下一段 */
  phase: PomodoroPhase;
  /** 下一段开始时，当前循环里已完成的番茄数 */
  completedInCycle: number;
  /** 刚结束的这一段是否算一个完成的番茄 */
  countedPomodoro: boolean;
}

/**
 * 由「当前段 + 已完成数」推出下一段。
 *
 * 规则：
 * - 专注结束 → 每满 longEvery 个进长休息，否则短休息
 * - 休息结束 → 回专注；长休息结束时把循环计数清零
 * - `counted = false`（手动跳过）不计入完成数，也就不会提前攒到长休息
 */
export function nextPhase(
  config: PomodoroConfig,
  phase: PomodoroPhase,
  completedInCycle: number,
  counted: boolean,
): PhaseStep {
  if (phase !== 'focus') {
    return {
      phase: 'focus',
      // 长休息是一次循环的收尾，回来后重新从 1 数起
      completedInCycle: phase === 'long' ? 0 : completedInCycle,
      countedPomodoro: false,
    };
  }

  const done = counted ? completedInCycle + 1 : completedInCycle;
  // longEvery 兜底成 4：配置被外部写坏时只影响节奏，不会除零或永远不进长休息
  const every = config.longEvery > 0 ? config.longEvery : DEFAULT_POMODORO_CONFIG.longEvery;

  return {
    phase: done > 0 && done % every === 0 ? 'long' : 'short',
    completedInCycle: done,
    countedPomodoro: counted,
  };
}

/**
 * 当前循环里的第几个番茄（1 起），用于「第 n / total 个」。
 *
 * 语义定为「正在做的那一个，或者是刚做完的那一个」，所以要看阶段：
 * - 专注中：已完成数 + 1（正在做第几个）
 * - 短休息中：已完成数本身（刚做完第几个）
 * - 长休息中：必然是第 total 个
 *
 * 长休息结束时 completedInCycle 已被清零，所以「专注中取模 + 1」不会溢出。
 */
export function cyclePosition(
  completedInCycle: number,
  longEvery: number,
  phase: PomodoroPhase,
): number {
  const every = longEvery > 0 ? longEvery : DEFAULT_POMODORO_CONFIG.longEvery;

  if (phase === 'long') return every;

  if (phase === 'short') {
    const remainder = completedInCycle % every;
    return remainder === 0 ? every : remainder;
  }

  return (completedInCycle % every) + 1;
}

/**
 * 显示用秒数：**向上**取整。
 * 用 floor 的话剩 0.4 秒就会提前跳到 0，最后一个数字几乎看不见。
 */
export function displaySeconds(remainingMs: number): number {
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export interface ClockParts {
  minutes: number;
  seconds: number;
}

export function clockParts(remainingMs: number): ClockParts {
  const total = displaySeconds(remainingMs);
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}

/** 一位数补零。手写而不用 Intl：Node 与浏览器对 `zh-CN` 的补零输出并不一致 */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 本地日期键 `YYYY-MM-DD`，让「今日统计」跨天自动归零 */
export function localDayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
