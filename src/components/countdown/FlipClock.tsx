'use client';

import { useEffect, useRef, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import type { TimeDigits } from '@/lib/countdown';
import { cn } from '@/lib/utils';

/** 与 CSS 里的动画时长保持一致 */
const FLIP_MS = 300;

interface FlipTileProps {
  char: string;
  accent?: boolean;
}

/**
 * 单格翻牌。
 *
 * 结构沿用 SplitFlapText 的视觉语言（上半 / 下半 / 两片翻转页），但驱动方式不同：
 * 那个组件只在 `words` 数组轮播时翻转，单文本模式下是直接跳变的，做不了秒级倒计时。
 * 这里由外部字符驱动，值一变就翻一次，所以时钟才是真的在"翻"。
 *
 * 导出是给番茄钟用的：它需要「分:秒」这种两段式布局，套不进 FlipClock 固定的
 * 天/时/分/秒四段结构，但翻牌本身必须完全一致，否则一个站点会出现两种翻法。
 */
export function FlipTile({ char, accent = false }: FlipTileProps) {
  const [current, setCurrent] = useState(char);
  const [previous, setPrevious] = useState(char);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (char === current) return;

    setPrevious(current);
    setCurrent(char);
    setFlipping(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlipping(false), FLIP_MS);
  }, [char, current]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <span className={cn('flip-tile', accent && 'flip-tile--accent')}>
      {/* 上半：静止时是当前值；翻转期间停在上一个值等翻页盖下来 */}
      <span className="flip-tile__half flip-tile__half--top">
        <span className="flip-tile__char">{flipping ? previous : current}</span>
      </span>

      {/* 下半：始终是目标值，翻页落下来时与它对齐 */}
      <span className="flip-tile__half flip-tile__half--bottom">
        <span className="flip-tile__char">{current}</span>
      </span>

      {flipping ? (
        <>
          {/* key 带上前后值，保证每次变化都重新挂载并重放动画 */}
          <span
            key={`front-${previous}-${current}`}
            className="flip-tile__flap flip-tile__flap--front"
          >
            <span className="flip-tile__char">{previous}</span>
          </span>
          <span
            key={`back-${previous}-${current}`}
            className="flip-tile__flap flip-tile__flap--back"
          >
            <span className="flip-tile__char">{current}</span>
          </span>
        </>
      ) : null}
    </span>
  );
}

interface FlipClockLabels {
  day: string;
  hour: string;
  minute: string;
  second: string;
}

export type FlipClockTone = 'hero' | 'card' | 'screen';

export interface FlipClockProps {
  digits: TimeDigits;
  labels: FlipClockLabels;
  showSeconds?: boolean;
  tone?: FlipClockTone;
  className?: string;
}

function Unit({
  value,
  width,
  unit,
  label,
  accent,
}: {
  value: number;
  width: number;
  unit: string;
  label: string;
  accent?: boolean;
}) {
  const text = String(Math.max(0, value)).padStart(width, '0');

  return (
    <div className="flip-clock__unit" data-unit={unit}>
      <div className="flip-clock__group">
        {text.split('').map((char, index) => (
          // 位数固定，索引做 key 是安全的
          <FlipTile key={index} char={char} accent={accent} />
        ))}
      </div>
      <span className="flip-clock__label">{label}</span>
    </div>
  );
}

/**
 * 数字倒计时。
 *
 * `useHydrated` 之前渲染占位符而不是 0：服务端与客户端首帧必须完全一致，
 * 否则 React 会因为数字对不上而报 hydration mismatch。
 */
export function FlipClock({
  digits,
  labels,
  showSeconds = true,
  tone = 'hero',
  className,
}: FlipClockProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className={cn('flip-clock', className)} data-tone={tone} aria-hidden="true">
        <div className="flip-clock__unit" data-unit="days">
          <div className="flip-clock__group">
            <span className="flip-tile flip-tile--ghost" />
            <span className="flip-tile flip-tile--ghost" />
          </div>
          <span className="flip-clock__label">{labels.day}</span>
        </div>
        <div className="flip-clock__unit" data-unit="hours">
          <div className="flip-clock__group">
            <span className="flip-tile flip-tile--ghost" />
            <span className="flip-tile flip-tile--ghost" />
          </div>
          <span className="flip-clock__label">{labels.hour}</span>
        </div>
        <div className="flip-clock__unit" data-unit="minutes">
          <div className="flip-clock__group">
            <span className="flip-tile flip-tile--ghost" />
            <span className="flip-tile flip-tile--ghost" />
          </div>
          <span className="flip-clock__label">{labels.minute}</span>
        </div>
        {showSeconds ? (
          <div className="flip-clock__unit" data-unit="seconds">
            <div className="flip-clock__group">
              <span className="flip-tile flip-tile--ghost" />
              <span className="flip-tile flip-tile--ghost" />
            </div>
            <span className="flip-clock__label">{labels.second}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn('flip-clock', className)}
      data-tone={tone}
      role="timer"
      aria-live="off"
    >
      {/* 天数不补零：0 天要显示成 "0"，不是 "00" */}
      <Unit
        value={digits.days}
        width={1}
        unit="days"
        label={labels.day}
        accent
      />
      <Unit value={digits.hours} width={2} unit="hours" label={labels.hour} />
      <Unit value={digits.minutes} width={2} unit="minutes" label={labels.minute} />
      {showSeconds ? (
        <Unit value={digits.seconds} width={2} unit="seconds" label={labels.second} />
      ) : null}
    </div>
  );
}
