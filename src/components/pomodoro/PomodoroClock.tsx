'use client';

import { FlipTile } from '@/components/countdown/FlipClock';
import { useHydrated } from '@/hooks/use-hydrated';
import { clockParts, pad2, type PomodoroPhase } from '@/lib/pomodoro';
import { cn } from '@/lib/utils';

export type PomodoroClockTone = 'panel' | 'screen';

export interface PomodoroClockProps {
  /** 剩余毫秒。running 时由调用方用 `endsAt - now` 现算，保证后台回来也是准的 */
  remainingMs: number;
  phase: PomodoroPhase;
  /** 读屏用，比如「专注」。视觉上不显示 */
  phaseLabel: string;
  tone?: PomodoroClockTone;
  className?: string;
}

/** 未 hydrate 时的占位格，与服务端首帧完全一致，避免 hydration mismatch */
function GhostGroup({ count }: { count: number }) {
  return (
    <div className="tomato-clock__group">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="flip-tile flip-tile--ghost" />
      ))}
    </div>
  );
}

/**
 * 番茄钟数字（分:秒）。
 *
 * 复用 FlipClock 里的 `FlipTile` 与同一套 `.flip-tile` 样式：翻牌的机械感是
 * 全站统一的视觉语言，如果番茄钟另做一套，站内就会出现两种"翻法"。
 * 但 FlipClock 的骨架固定是 天/时/分/秒 四段带标签，套不进「分:秒」两段式，
 * 所以这里只借翻牌，自己排布与定尺寸。
 *
 * 分钟不做固定宽度截断：专注时长最大 180 分钟，会出现三位数，
 * `padStart(2)` 在两三位数时都不补零，正好是想要的行为（25 → `25`，180 → `180`）。
 */
export function PomodoroClock({
  remainingMs,
  phase,
  phaseLabel,
  tone = 'panel',
  className,
}: PomodoroClockProps) {
  const hydrated = useHydrated();
  const { minutes, seconds } = clockParts(remainingMs);

  const minuteText = pad2(minutes);
  const secondText = pad2(seconds);

  if (!hydrated) {
    return (
      <div
        className={cn('tomato-clock', className)}
        data-tone={tone}
        data-phase={phase}
        aria-hidden="true"
      >
        <GhostGroup count={2} />
        <span className="tomato-clock__colon">:</span>
        <GhostGroup count={2} />
      </div>
    );
  }

  return (
    <div
      className={cn('tomato-clock', className)}
      data-tone={tone}
      data-phase={phase}
      role="timer"
      aria-live="off"
    >
      <div className="tomato-clock__group">
        {minuteText.split('').map((char, index) => (
          // 位数固定，索引做 key 是安全的
          <FlipTile key={`m${index}`} char={char} accent />
        ))}
      </div>

      <span className="tomato-clock__colon" aria-hidden="true">
        :
      </span>

      <div className="tomato-clock__group">
        {secondText.split('').map((char, index) => (
          <FlipTile key={`s${index}`} char={char} />
        ))}
      </div>

      {/* 数字每秒都在变，不能进 live region；这里只给读屏一个静态文本 */}
      <span className="sr-only">
        {phaseLabel} {minutes}:{secondText}
      </span>
    </div>
  );
}
