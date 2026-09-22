import { DAY_MS, HOUR_MS, MINUTE_MS, SECOND_MS } from './time';

export type CountdownPhase = 'upcoming' | 'ongoing' | 'ended';

/** 时间分解，全部为 floor 口径——与屏幕上展示的数字一致 */
export interface TimeDigits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownView {
  phase: CountdownPhase;
  /** 展示用：upcoming 拆距开始，ongoing 拆距结束 */
  digits: TimeDigits;
  /** 距开始还有几天（展示口径，floor） */
  daysToStart: number;
  /** 进行中：距结束还有几天 */
  daysLeft: number;
  /** 已经过去几天 */
  daysElapsed: number;
  /** 0–1，基于 [start, end] */
  progress: number;
  /** 目标时刻落在 24 小时以内 */
  isFinalDay: boolean;
  msToStart: number;
  msToEnd: number;
}

export function getPhase(startMs: number, endMs: number, nowMs: number): CountdownPhase {
  if (nowMs < startMs) return 'upcoming';
  if (nowMs <= endMs) return 'ongoing';
  return 'ended';
}

export function splitDuration(ms: number): TimeDigits {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor(clamped / HOUR_MS) % 24,
    minutes: Math.floor(clamped / MINUTE_MS) % 60,
    seconds: Math.floor(clamped / SECOND_MS) % 60,
  };
}

export function computeCountdown(
  startMs: number,
  endMs: number,
  nowMs: number,
): CountdownView {
  const phase = getPhase(startMs, endMs, nowMs);
  const msToStart = startMs - nowMs;
  const msToEnd = endMs - nowMs;
  const span = Math.max(1, endMs - startMs);

  let progress: number;
  if (phase === 'upcoming') progress = 0;
  else if (phase === 'ended') progress = 1;
  else progress = Math.min(1, Math.max(0, (nowMs - startMs) / span));

  const target = phase === 'upcoming' ? msToStart : phase === 'ended' ? 0 : msToEnd;

  return {
    phase,
    digits: splitDuration(target),
    daysToStart: Math.max(0, Math.floor(msToStart / DAY_MS)),
    daysLeft: phase === 'ended' ? 0 : Math.max(0, Math.floor(msToEnd / DAY_MS)),
    daysElapsed: phase === 'ongoing' || phase === 'ended'
      ? Math.max(0, Math.floor((nowMs - startMs) / DAY_MS))
      : 0,
    progress,
    isFinalDay: target > 0 && target <= DAY_MS,
    msToStart,
    msToEnd,
  };
}

/**
 * 事件进度：以创建时间为基准（假期没有「创建时间」，用 start）。
 * 未开始时为 0，结束后为 1。
 */
export function progressFrom(
  createdMs: number,
  endMs: number,
  nowMs: number,
): number {
  if (nowMs <= createdMs) return 0;
  if (nowMs >= endMs) return 1;
  const span = Math.max(1, endMs - createdMs);
  return (nowMs - createdMs) / span;
}

/** 正计时：已经过去多久 */
export function elapsedSince(createdMs: number, nowMs: number): TimeDigits {
  return splitDuration(nowMs - createdMs);
}
