'use client';

import { useNow } from '@/hooks/use-now';
import { localDayKey } from '@/lib/pomodoro';
import { usePomodoroStore } from '@/store/pomodoro-store';

export interface TodayStats {
  /** 今天完成的番茄数 */
  count: number;
  /** 今天累计专注毫秒 */
  focusMs: number;
}

/**
 * 今日统计。
 *
 * 跨天判断刻意放在**显示层**（比一次日期），而不是"挂载时清零"的副作用：
 * 副作用要和持久化 store 的 rehydrate 抢执行顺序，抢错了会闪一下昨天的数字。
 * 这里无论如何都只可能读到今天的数据。
 */
export function useTodayStats(): TodayStats {
  const now = useNow();
  const statsDay = usePomodoroStore((state) => state.statsDay);
  const statsCount = usePomodoroStore((state) => state.statsCount);
  const statsFocusMs = usePomodoroStore((state) => state.statsFocusMs);

  // now <= 0 表示还没 hydrate，此时一律按 0 处理，与服务端首帧保持一致
  const sameDay = now > 0 && localDayKey(now) === statsDay;

  return { count: sameDay ? statsCount : 0, focusMs: sameDay ? statsFocusMs : 0 };
}
