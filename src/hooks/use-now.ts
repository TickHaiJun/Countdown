'use client';

import { useSyncExternalStore } from 'react';

/**
 * 全站唯一的秒级 ticker。
 *
 * 所有需要「当前时间」的组件都订阅这里，只存在一个定时器；
 * 定时器对齐到秒边界，避免长时间运行后出现跳秒。
 * 服务端快照固定返回 0，客户端首帧拿到真实时间——不会产生 hydration mismatch。
 */

const listeners = new Set<() => void>();
let currentMs = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function schedule(): void {
  if (timer) clearTimeout(timer);
  const delay = 1000 - (Date.now() % 1000) + 5;
  timer = setTimeout(() => {
    currentMs = Date.now();
    for (const notify of listeners) notify();
    schedule();
  }, delay);
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  if (listeners.size === 1) {
    currentMs = Date.now();
    schedule();
  }
  notify();
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return currentMs;
}

function getServerSnapshot(): number {
  return 0;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
