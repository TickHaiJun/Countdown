'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

function getServerSnapshot(): boolean {
  return false;
}

/**
 * 媒体查询订阅。服务端快照固定 false——首帧与 SSR 输出一致，
 * 客户端 mount 后再校正，避免 hydration mismatch。
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined') return noopSubscribe();
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    getServerSnapshot,
  );
}

/** < 640px 视为移动端（与 §4.7 的 sm 断点一致） */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/** 桌面宽屏（> 1024px）：键盘快捷键全量可用 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
