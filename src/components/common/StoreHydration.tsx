'use client';

import { useEffect } from 'react';
import { useCountdownStore } from '@/store/countdown-store';
import { usePomodoroStore } from '@/store/pomodoro-store';

/**
 * store 使用 skipHydration，客户端挂载后手动 rehydrate，
 * 避免静态导出时服务端快照与本地数据不一致。
 *
 * 新增持久化 store 时记得在这里补一行，否则它永远是初始值。
 */
export function StoreHydration() {
  useEffect(() => {
    void useCountdownStore.persist.rehydrate();
    void usePomodoroStore.persist.rehydrate();
  }, []);
  return null;
}
