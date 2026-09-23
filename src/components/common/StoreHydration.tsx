'use client';

import { useEffect } from 'react';
import { applyAppearance } from '@/lib/appearance';
import { useCountdownStore } from '@/store/countdown-store';
import { usePomodoroStore } from '@/store/pomodoro-store';
import { useUiStore } from '@/store/ui-store';

/**
 * store 使用 skipHydration，客户端挂载后手动 rehydrate，
 * 避免静态导出时服务端快照与本地数据不一致。
 *
 * 新增持久化 store 时记得在这里补一行，否则它永远是初始值。
 *
 * 外观（主题 / 字号 / 字色）也在这里落地，而且**必须等 rehydrate 完成**：
 * 内联脚本已经把 <html> 设好了，若在 rehydrate 之前用默认值写一次，
 * 浅色主题的用户会先闪一帧深色。所以下面用 then + subscribe 两条路径，
 * 没有"挂载即写"那一步。
 */
export function StoreHydration() {
  useEffect(() => {
    let active = true;

    void Promise.all([
      useCountdownStore.persist.rehydrate(),
      usePomodoroStore.persist.rehydrate(),
    ]).then(() => {
      if (!active) return;
      applyAppearance(useCountdownStore.getState().settings);
      /* 通知默认主题的 WebGL 背景：现在可以按真实主题决定挂不挂 */
      useUiStore.getState().setStoreHydrated(true);
    });

    /* 之后用户每次改外观，立即跟随（含数据导入覆盖设置的情况） */
    const unsubscribe = useCountdownStore.subscribe((state, previous) => {
      if (state.settings !== previous.settings) applyAppearance(state.settings);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return null;
}
