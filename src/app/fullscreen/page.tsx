'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, MoveHorizontal } from 'lucide-react';
import { FlipClock } from '@/components/countdown/FlipClock';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/i18n';
import { formatDateRange } from '@/i18n/format';
import { computeCountdown } from '@/lib/countdown';
import { BUILTIN_INDEX, holidayName } from '@/lib/holidays';
import { eventDurationMs, nextOccurrenceMs } from '@/lib/occurrence';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';

interface Target {
  id: string;
  name: string;
  startMs: number;
  endMs: number;
}

export default function FullscreenPage() {
  const now = useNow();
  const { t, locale } = useI18n();

  const events = useCountdownStore((state) => state.events);
  const showSeconds = useCountdownStore((state) => state.settings.showSeconds);

  const [entered, setEntered] = useState(false);
  const [index, setIndex] = useState(0);

  /*
   * 进全屏需要用户手势，所以首屏得给个按钮。但这里刻意**不用遮罩**：
   * 一层铺满的模糊遮罩会让倒计时完全读不出来，大屏上还挡掉顶栏。
   * 改成底部一个小胶囊，几秒后自动隐去，页面立刻变成干净的常驻展示。
   */
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    if (entered) return;
    const timer = window.setTimeout(() => setShowHint(false), 6000);
    return () => window.clearTimeout(timer);
  }, [entered]);

  /* 目标清单：进行中/未来的假期 + 未结束的事件，按时间排序 */
  const targets = useMemo<Target[]>(() => {
    if (now <= 0) return [];

    const holidayTargets: Target[] = BUILTIN_INDEX.periods
      .filter((period) => period.endMs >= now)
      .map((period) => ({
        id: period.id,
        name: holidayName(period, locale),
        startMs: period.startMs,
        endMs: period.endMs,
      }));

    const eventTargets: Target[] = events
      .map((event) => {
        const startMs = nextOccurrenceMs(event, now, BUILTIN_INDEX);
        return {
          id: event.id,
          name: event.title,
          startMs,
          endMs: startMs + eventDurationMs(event),
        };
      })
      .filter((target) => target.endMs >= now);

    return [...holidayTargets, ...eventTargets].sort((a, b) => a.startMs - b.startMs);
  }, [events, locale, now]);

  const safeIndex = targets.length > 0 ? index % targets.length : 0;
  const target = targets[safeIndex] ?? null;

  const view =
    target && now > 0 ? computeCountdown(target.startMs, target.endMs, now) : null;

  const go = useCallback(
    (delta: number) => {
      if (targets.length === 0) return;
      setIndex((prev) => (prev + delta + targets.length) % targets.length);
    },
    [targets.length],
  );

  /* 键盘：← → 切换，Esc 退出，F 切换全屏 */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  /* 进入页面即请求全屏；浏览器要求用户手势，所以首屏先给一个点击遮罩 */
  const enterFullscreen = async () => {
    setEntered(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* 用户或浏览器拒绝时也不影响计时显示 */
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* 忽略 */
    }
  };

  /* 投屏时鼠标不动就隐藏光标，避免一个大箭头压在数字上 */
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    reset();
    window.addEventListener('mousemove', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
    };
  }, []);

  const percent = view ? Math.round(view.progress * 100) : 0;

  return (
    <div
      className={cn(
        'relative flex min-h-[100svh] flex-col items-center justify-center px-6',
        idle && 'cursor-none',
      )}
    >
      {/* 顶栏：退出 + 切换 */}
      <div
        className={cn(
          'fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 transition-opacity duration-500',
          idle ? 'opacity-0' : 'opacity-100',
        )}
      >
        <span className="label-mono">
          {t('fullscreen.target')}
          {targets.length > 0 ? ` ${safeIndex + 1}/${targets.length}` : ''}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={exitFullscreen}
            aria-label={t('fullscreen.exit')}
            title={t('fullscreen.exit')}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <Minimize2 size={15} strokeWidth={1.75} />
          </button>
          <Link
            href="/"
            aria-label={t('nav.home')}
            title={t('nav.home')}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <MoveHorizontal size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      {/* 左右半区点击切换（提示隐去后接管） */}
      {targets.length > 1 && (entered || !showHint) ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('fullscreen.switchPrev')}
            className="absolute inset-y-0 left-0 z-30 w-1/5 cursor-pointer opacity-0"
          />
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('fullscreen.switchNext')}
            className="absolute inset-y-0 right-0 z-30 w-1/5 cursor-pointer opacity-0"
          />
        </>
      ) : null}

      {target && view ? (
        <div className="screen-shift flex w-full max-w-[1600px] flex-col items-center text-center">
          <p className="label-mono">
            {view.phase === 'ongoing' ? t('status.ongoing') : t('hero.eyebrow')}
          </p>

          <h1 className="mt-4 font-display text-[clamp(1.75rem,4.5vw,4rem)] leading-tight tracking-tight">
            {target.name}
          </h1>

          <p className="mt-3 text-[clamp(0.8rem,1.3vw,1.05rem)] text-ink-2">
            {formatDateRange(target.startMs, target.endMs, locale)}
          </p>

          <div className="mt-[clamp(2rem,6vh,4.5rem)]">
            <FlipClock
              tone="screen"
              digits={view.digits}
              showSeconds={showSeconds}
              labels={{
                day: t('unit.day'),
                hour: t('unit.hour'),
                minute: t('unit.minute'),
                second: t('unit.second'),
              }}
            />
          </div>

          {view.phase === 'ongoing' ? (
            <div className="mt-[clamp(1.5rem,4vh,3rem)] w-[min(720px,80vw)]">
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-3 text-[clamp(0.7rem,1.1vw,0.875rem)] text-ink-3">
                {t('ongoing.elapsed', { n: percent })}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-ink-2">{t('fullscreen.noTarget')}</p>
      )}

      {/* 切换箭头（鼠标可见时） */}
      {targets.length > 1 ? (
        <div
          className={cn(
            'fixed bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 transition-opacity duration-500',
            idle ? 'opacity-0' : 'opacity-60',
          )}
        >
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('fullscreen.switchPrev')}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
          </button>
          <span className="text-[11px] text-ink-3">{t('fullscreen.hint')}</span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('fullscreen.switchNext')}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <ChevronRight size={15} strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      {/*
        首次进入的进入全屏提示：requestFullscreen 必须有用户手势。
        提示隐去后左右半区才接管点击，避免和顶栏抢点击。
      */}
      {entered || !showHint ? null : (
        <div className="pointer-events-none fixed inset-x-0 bottom-9 z-50 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={enterFullscreen}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-elev/80 px-4 py-2 text-ink backdrop-blur-sm transition-colors hover:border-accent/45 hover:text-accent"
          >
            <Minimize2 size={15} strokeWidth={1.75} className="rotate-180" />
            <span className="font-display text-[13px]">{t('fullscreen.clickToStart')}</span>
          </button>
          <span className="text-[11.5px] text-ink-3">{t('fullscreen.clickHint')}</span>
        </div>
      )}
    </div>
  );
}
