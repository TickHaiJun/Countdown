'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_POMODORO_CONFIG,
  localDayKey,
  nextPhase,
  phaseDurationMs,
  type PomodoroConfig,
  type PomodoroPhase,
  type PomodoroStatus,
} from '@/lib/pomodoro';
import { createDebouncedStorage } from '@/store/debounced-storage';

export const POMODORO_STORAGE_KEY = 'countdown:pomodoro:v1';
export const POMODORO_SCHEMA_VERSION = 1;

interface PomodoroState {
  config: PomodoroConfig;
  phase: PomodoroPhase;
  status: PomodoroStatus;

  /**
   * running 时这一段的结束时间戳。
   * 存"结束时刻"而不是每秒自减，是为了让后台标签页被节流、或者中途刷新页面
   * 之后，剩余时间依然准确——自减式的计时器在这两种情况下一定会走偏。
   * 它只是 Date.now() 口径，与站点锁定的 UTC+8 显示无关。
   */
  endsAt: number | null;
  /** idle / paused 时的剩余毫秒 */
  remainingMs: number;
  /** 当前循环内已完成的番茄数，用来判断什么时候进长休息 */
  completedInCycle: number;

  /** 今日统计。日期对不上就自动归零，不需要额外的清理任务 */
  statsDay: string;
  statsCount: number;
  statsFocusMs: number;

  updateConfig: (patch: Partial<PomodoroConfig>) => void;
  /** 开始 / 暂停 / 继续，一个按钮搞定 */
  toggle: () => void;
  /** 把当前这一段重新计时 */
  resetPhase: () => void;
  /**
   * 跳到下一段。
   * @param counted 刚结束的这一段算不算一个完成的番茄（手动跳过传 false）
   * @param autoStart 下一段要不要自动开跑。默认跟随配置里的 `autoNext`；
   *   传 false 用于「人不在、时间却到了」的情况——那时应该停下来等人回来，
   *   而不是打开页面就发现它已经在跑了。
   */
  advance: (counted: boolean, autoStart?: boolean) => void;
  /** 清理过期的持久化统计（显示层不依赖它，见实现处的说明） */
  sync: () => void;
  clearStats: () => void;
}

const initialState = {
  config: DEFAULT_POMODORO_CONFIG,
  phase: 'focus' as PomodoroPhase,
  status: 'idle' as PomodoroStatus,
  endsAt: null as number | null,
  remainingMs: DEFAULT_POMODORO_CONFIG.focusMin * 60_000,
  completedInCycle: 0,
  statsDay: '',
  statsCount: 0,
  statsFocusMs: 0,
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateConfig: (patch) =>
        set((state) => {
          const config = { ...state.config, ...patch };
          return {
            config,
            /*
             * 只有空闲时才把新时长写回钟面。
             * 正在跑或已暂停时不碰 remainingMs —— 否则用户改一下"短休息"，
             * 正在进行的专注段会被顺手重置掉。
             */
            remainingMs:
              state.status === 'idle' ? phaseDurationMs(config, state.phase) : state.remainingMs,
          };
        }),

      toggle: () =>
        set((state) => {
          const now = Date.now();

          if (state.status === 'running') {
            const remaining =
              state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
            return { status: 'paused', endsAt: null, remainingMs: remaining };
          }

          const remaining =
            state.remainingMs > 0 ? state.remainingMs : phaseDurationMs(state.config, state.phase);
          return { status: 'running', endsAt: now + remaining, remainingMs: remaining };
        }),

      resetPhase: () =>
        set((state) => ({
          status: 'idle',
          endsAt: null,
          remainingMs: phaseDurationMs(state.config, state.phase),
        })),

      advance: (counted, autoStart) =>
        set((state) => {
          const now = Date.now();
          const step = nextPhase(state.config, state.phase, state.completedInCycle, counted);
          const duration = phaseDurationMs(state.config, step.phase);
          const shouldRun = autoStart ?? state.config.autoNext;

          const dayKey = localDayKey(now);
          const sameDay = state.statsDay === dayKey;
          const gainedFocusMs = step.countedPomodoro ? state.config.focusMin * 60_000 : 0;

          return {
            phase: step.phase,
            completedInCycle: step.completedInCycle,
            status: shouldRun ? 'running' : 'idle',
            endsAt: shouldRun ? now + duration : null,
            remainingMs: duration,
            statsDay: dayKey,
            statsCount: (sameDay ? state.statsCount : 0) + (step.countedPomodoro ? 1 : 0),
            statsFocusMs: (sameDay ? state.statsFocusMs : 0) + gainedFocusMs,
          };
        }),

      /*
       * 只负责"把过期的持久化统计清掉"，显示层不依赖它：
       * 界面上会实时比较 statsDay 与今天，所以即便这个方法一直没被调用，
       * 用户也绝不会看到昨天的数字。它只是让 localStorage 里不留脏数据。
       */
      sync: () => {
        const dayKey = localDayKey(Date.now());
        if (get().statsDay === dayKey) return;
        set({ statsDay: dayKey, statsCount: 0, statsFocusMs: 0 });
      },

      clearStats: () =>
        set({ statsDay: localDayKey(Date.now()), statsCount: 0, statsFocusMs: 0 }),
    }),
    {
      name: POMODORO_STORAGE_KEY,
      version: POMODORO_SCHEMA_VERSION,
      storage: createJSONStorage(() => createDebouncedStorage()),
      // 与事件 store 一致：交给客户端手动 rehydrate，避免静态导出的首屏不一致
      skipHydration: true,
      partialize: (state) => ({
        config: state.config,
        phase: state.phase,
        status: state.status,
        endsAt: state.endsAt,
        remainingMs: state.remainingMs,
        completedInCycle: state.completedInCycle,
        statsDay: state.statsDay,
        statsCount: state.statsCount,
        statsFocusMs: state.statsFocusMs,
      }),
      /*
       * 新增配置项不能靠 version 升级解决：老数据里根本没有这些键，
       * 直接展开会得到 undefined。统一用 DEFAULT_POMODORO_CONFIG 兜底。
       */
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<PomodoroState>;
        const config: PomodoroConfig = {
          ...DEFAULT_POMODORO_CONFIG,
          ...(incoming.config ?? {}),
        };
        const phase = incoming.phase ?? current.phase;

        // running 但没有 endsAt 是坏数据（比如手改过 localStorage）：
        // 降级成 paused，至少不会显示一个永远不动的钟
        const status: PomodoroStatus =
          incoming.status === 'running' && (incoming.endsAt ?? null) === null
            ? 'paused'
            : (incoming.status ?? current.status);

        return {
          ...current,
          config,
          phase,
          status,
          endsAt: incoming.endsAt ?? null,
          remainingMs: incoming.remainingMs ?? phaseDurationMs(config, phase),
          completedInCycle: incoming.completedInCycle ?? 0,
          statsDay: incoming.statsDay ?? localDayKey(Date.now()),
          statsCount: incoming.statsCount ?? 0,
          statsFocusMs: incoming.statsFocusMs ?? 0,
        };
      },
    },
  ),
);
