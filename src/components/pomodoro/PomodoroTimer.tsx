'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Brain,
  Coffee,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  type LucideIcon,
} from 'lucide-react';
import { PomodoroClock } from '@/components/pomodoro/PomodoroClock';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import BorderGlow from '@/components/reactbits/BorderGlow';
import Magnet from '@/components/reactbits/Magnet';
import StarBorder from '@/components/reactbits/StarBorder';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import { useNow } from '@/hooks/use-now';
import { useTodayStats } from '@/hooks/use-today-stats';
import { useI18n, type MessageKey } from '@/i18n';
import { playChime, unlockChime } from '@/lib/chime';
import { cyclePosition, phaseDurationMs, type PomodoroPhase } from '@/lib/pomodoro';
import { cn } from '@/lib/utils';
import { usePomodoroStore } from '@/store/pomodoro-store';
import { useUiStore } from '@/store/ui-store';

interface PhaseMeta {
  labelKey: MessageKey;
  /** 数字与进度条用的主色 */
  color: string;
  /** BorderGlow 的 `glowColor`，格式是空格分隔的 HSL 三元组 */
  glow: string;
  /** BorderGlow 的走边框渐变色序 */
  colors: [string, string, string];
  Icon: LucideIcon;
}

const PHASE_META: Record<PomodoroPhase, PhaseMeta> = {
  focus: {
    labelKey: 'pomodoro.phaseFocus',
    color: '#60a5fa',
    glow: '213 93 68',
    colors: ['#60a5fa', '#b3e5ff', '#2563eb'],
    Icon: Brain,
  },
  short: {
    labelKey: 'pomodoro.phaseShort',
    color: '#34d399',
    glow: '160 64 52',
    colors: ['#34d399', '#a7f3d0', '#059669'],
    Icon: Coffee,
  },
  long: {
    labelKey: 'pomodoro.phaseLong',
    color: '#2dd4bf',
    glow: '173 66 46',
    colors: ['#2dd4bf', '#99f6e4', '#0d9488'],
    Icon: Coffee,
  },
};

/**
 * 番茄钟主体的可交互部分。
 *
 * 两个设计要点：
 *
 * 1. **剩余时间永远由 `endsAt - now` 现算**，不自己每秒自减。标签页被浏览器
 *    节流、或者中途刷新页面时，自减式计时器一定会走偏，而时间戳不会。
 *    秒级刷新复用全站唯一的 `useNow()`，不额外起定时器。
 * 2. 大屏浮层用的是全局 ui-store 的 `immersiveOpen`，这样全局快捷键能知道
 *    "下面盖着浮层"从而让路，不会和站点的 F / ↑↓ 打起来。
 */
export function PomodoroTimer() {
  const hydrated = useHydrated();
  const now = useNow();
  const { t } = useI18n();

  const config = usePomodoroStore((state) => state.config);
  const phase = usePomodoroStore((state) => state.phase);
  const status = usePomodoroStore((state) => state.status);
  const endsAt = usePomodoroStore((state) => state.endsAt);
  const storedRemaining = usePomodoroStore((state) => state.remainingMs);
  const completedInCycle = usePomodoroStore((state) => state.completedInCycle);
  const toggle = usePomodoroStore((state) => state.toggle);
  const resetPhase = usePomodoroStore((state) => state.resetPhase);
  const advance = usePomodoroStore((state) => state.advance);

  const immersiveOpen = useUiStore((state) => state.immersiveOpen);
  const setImmersiveOpen = useUiStore((state) => state.setImmersiveOpen);

  const stats = useTodayStats();

  const meta = PHASE_META[phase];
  const running = status === 'running';

  const remainingMs =
    running && endsAt !== null && now > 0 ? Math.max(0, endsAt - now) : storedRemaining;

  const totalMs = phaseDurationMs(config, phase);
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;
  const percent = Math.round(progress * 100);

  const position = cyclePosition(completedInCycle, config.longEvery, phase);

  /* ---------------- 到点推进 ----------------
   *
   * 「到点」有两种，必须区别对待：
   *
   * 1. 页面开着、用户看着它走到 0 —— 正常使用，按配置自动接下一段。
   * 2. 页面根本没开，回来时才发现早就过点了 —— 这种要**停下来等人**：
   *    否则一进页面就看到计时器自己在跑，用户也不知道它跑多久了。
   *
   * 第二种在 hydrate 后结算一次；结算之后才允许第一种生效。
   * 否则同一次提交里两个分支会各推进一段，一下子跳两格。
   */
  const settled = useRef(false);

  useEffect(() => {
    if (!hydrated || settled.current) return;
    settled.current = true;

    const state = usePomodoroStore.getState();
    if (state.status === 'running' && state.endsAt !== null && Date.now() >= state.endsAt) {
      state.advance(true, false);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !settled.current || now <= 0) return;

    /*
     * 读 store 的实时值而不是组件 props：上一条 effect 里那次 set 之后，
     * 同一次提交内 props 仍是旧的，用旧值判断会把同一段推进两次。
     */
    const state = usePomodoroStore.getState();
    if (state.status !== 'running' || state.endsAt === null) return;
    if (Date.now() < state.endsAt) return;

    if (state.config.sound) playChime();
    state.advance(true);
  }, [hydrated, now]);

  /* ---------------- 阶段切换的读屏播报 ---------------- */
  const previousPhase = useRef<PomodoroPhase | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    const before = previousPhase.current;
    previousPhase.current = phase;
    if (before === null || before === phase) return;

    setAnnouncement(
      `${t('pomodoro.doneTitle', { phase: t(PHASE_META[before].labelKey) })} ${t('pomodoro.nextUp', {
        phase: t(PHASE_META[phase].labelKey),
      })}`,
    );
  }, [hydrated, phase, t]);

  /* ---------------- 全屏 ---------------- */
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen?.();
    } catch {
      /* 用户或浏览器拒绝时不影响计时本身 */
    }
  }, []);

  /* ---------------- 大屏浮层 ---------------- */
  const closeImmersive = useCallback(() => setImmersiveOpen(false), [setImmersiveOpen]);

  const openImmersive = useCallback(() => {
    unlockChime();
    setImmersiveOpen(true);
  }, [setImmersiveOpen]);

  const handleToggle = useCallback(() => {
    // 声音必须在用户手势里先解锁一次，否则到点时的自动播放会被浏览器挂起
    unlockChime();
    toggle();
  }, [toggle]);

  /* 浮层打开时锁掉页面滚动，关掉时还原 */
  useEffect(() => {
    if (!immersiveOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [immersiveOpen]);

  /* 大屏键盘：空格 / R / F / Esc。全局快捷键已被 immersiveOpen 拦下 */
  useEffect(() => {
    if (!immersiveOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        handleToggle();
        return;
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetPhase();
        return;
      }
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (event.key === 'Escape') closeImmersive();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [immersiveOpen, handleToggle, resetPhase, toggleFullscreen, closeImmersive]);

  /* 投屏时鼠标不动就藏起来，免得一个大箭头压在数字上 */
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!immersiveOpen) {
      setIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    reset();
    window.addEventListener('mousemove', reset);
    window.addEventListener('touchstart', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, [immersiveOpen]);

  const primaryLabel = running
    ? t('pomodoro.pause')
    : status === 'paused'
      ? t('pomodoro.resume')
      : t('pomodoro.start');

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <AnimatedContent distance={22} duration={0.7} threshold={0}>
        <BorderGlow
          className="w-full"
          edgeSensitivity={28}
          glowColor={meta.glow}
          backgroundColor="#17161d"
          borderRadius={22}
          glowRadius={36}
          glowIntensity={0.9}
          coneSpread={22}
          animated
          colors={meta.colors}
          fillOpacity={0.35}
        >
          <div className="px-6 py-9 md:px-10 md:py-11">
            {/* ---------------------------------------- 阶段 + 轮次 */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {(['focus', 'short', 'long'] as PomodoroPhase[]).map((item) => {
                const itemMeta = PHASE_META[item];
                const active = item === phase;
                return (
                  <span
                    key={item}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] leading-none transition-colors',
                      active ? 'border-transparent' : 'border-line text-ink-3',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${itemMeta.color}22`,
                            borderColor: `${itemMeta.color}66`,
                            color: itemMeta.color,
                          }
                        : undefined
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    <itemMeta.Icon size={12} strokeWidth={2} />
                    {t(itemMeta.labelKey)}
                  </span>
                );
              })}
            </div>

            {/* ---------------------------------------- 钟 */}
            <div className="mt-9 flex justify-center">
              <PomodoroClock
                remainingMs={remainingMs}
                phase={phase}
                phaseLabel={t(meta.labelKey)}
                tone="panel"
              />
            </div>

            {/* ---------------------------------------- 进度 + 轮次 */}
            <div className="mx-auto mt-8 w-full max-w-xl">
              <div className="h-[4px] w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${percent}%`, backgroundColor: meta.color }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
                <span>
                  {t('pomodoro.round', {
                    n: position,
                    total: config.longEvery,
                  })}
                </span>
                <span style={{ color: meta.color }}>{percent}%</span>
              </div>
            </div>

            {/* ---------------------------------------- 控制 */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Magnet padding={26} magnetStrength={5}>
                <StarBorder
                  as="button"
                  type="button"
                  onClick={handleToggle}
                  color={meta.color}
                  speed="5s"
                  thickness={1}
                  backgroundColor="rgba(96,165,250,0.10)"
                  textColor="#f4f4f5"
                  borderColor="rgba(96,165,250,0.35)"
                  className="cursor-pointer rounded-full [&>div:last-child]:rounded-full [&>div:last-child]:px-7 [&>div:last-child]:py-3 [&>div:last-child]:text-[13.5px]"
                >
                  <span className="flex items-center gap-2">
                    {running ? (
                      <Pause size={14} strokeWidth={2} />
                    ) : (
                      <Play size={14} strokeWidth={2} />
                    )}
                    {primaryLabel}
                  </span>
                </StarBorder>
              </Magnet>

              <Button variant="outline" size="lg" onClick={resetPhase} className="gap-1.5">
                <RotateCcw size={14} strokeWidth={1.75} />
                {t('pomodoro.reset')}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => advance(false, running)}
                className="gap-1.5"
              >
                <SkipForward size={14} strokeWidth={1.75} />
                {t('pomodoro.skip')}
              </Button>

              <Button variant="ghost" size="lg" onClick={openImmersive} className="gap-1.5">
                <Maximize2 size={14} strokeWidth={1.75} />
                {t('pomodoro.bigScreen')}
              </Button>
            </div>
          </div>
        </BorderGlow>
      </AnimatedContent>

      {/* ============================================ 大屏浮层 */}
      {immersiveOpen ? (
        <div
          className={cn(
            'fixed inset-0 z-[80] flex flex-col items-center justify-center bg-base/94 px-6 backdrop-blur-2xl',
            idle && 'cursor-none',
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t('pomodoro.bigScreen')}
        >
          {/* 顶栏：阶段 + 退出 */}
          <div
            className={cn(
              'fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 transition-opacity duration-500',
              idle ? 'opacity-0' : 'opacity-100',
            )}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] leading-none"
              style={{
                backgroundColor: `${meta.color}1f`,
                borderColor: `${meta.color}59`,
                color: meta.color,
              }}
            >
              <meta.Icon size={12} strokeWidth={2} />
              {t(meta.labelKey)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={
                  isFullscreen ? t('pomodoro.exitFullscreen') : t('pomodoro.enterFullscreen')
                }
                title={isFullscreen ? t('pomodoro.exitFullscreen') : t('pomodoro.enterFullscreen')}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                {isFullscreen ? (
                  <Minimize2 size={15} strokeWidth={1.75} />
                ) : (
                  <Maximize2 size={15} strokeWidth={1.75} />
                )}
              </button>
              <Button variant="ghost" size="sm" onClick={closeImmersive} className="gap-1.5">
                <Minimize2 size={13} strokeWidth={1.75} />
                {t('pomodoro.exitBigScreen')}
              </Button>
            </div>
          </div>

          <PomodoroClock
            remainingMs={remainingMs}
            phase={phase}
            phaseLabel={t(meta.labelKey)}
            tone="screen"
          />

          <div className="mt-[clamp(1.5rem,4vh,3rem)] w-[min(760px,84vw)]">
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${percent}%`, backgroundColor: meta.color }}
              />
            </div>
            <div className="mt-3.5 flex items-center justify-between text-[clamp(0.7rem,1.05vw,0.85rem)] text-ink-3">
              <span>{t('pomodoro.round', { n: position, total: config.longEvery })}</span>
              <span>
                {t('pomodoro.todayCount')} {stats.count}
                {t('pomodoro.unitCount')}
                <span className="mx-2 text-line-strong" aria-hidden="true">
                  ·
                </span>
                {percent}%
              </span>
            </div>
          </div>

          <div
            className={cn(
              'fixed inset-x-0 bottom-6 flex flex-col items-center gap-3 transition-opacity duration-500',
              idle ? 'opacity-0' : 'opacity-100',
            )}
          >
            <div className="flex items-center gap-3">
              <Button
                variant={running ? 'outline' : 'primary'}
                size="md"
                onClick={handleToggle}
                className="gap-1.5"
              >
                {running ? (
                  <Pause size={14} strokeWidth={2} />
                ) : (
                  <Play size={14} strokeWidth={2} />
                )}
                {primaryLabel}
              </Button>
              <Button variant="ghost" size="md" onClick={resetPhase} className="gap-1.5">
                <RotateCcw size={14} strokeWidth={1.75} />
                {t('pomodoro.reset')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => advance(false, running)}
                className="gap-1.5"
              >
                <SkipForward size={14} strokeWidth={1.75} />
                {t('pomodoro.skip')}
              </Button>
            </div>
            <p className="text-[11.5px] text-ink-3">{t('pomodoro.bigHint')}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
