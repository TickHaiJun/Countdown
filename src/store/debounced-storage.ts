'use client';

import type { StateStorage } from 'zustand/middleware';

/**
 * 写盘做 300ms 防抖的 localStorage 适配器。
 *
 * 拖动排序、连续点数字输入、改名这类操作会连着触发 set，
 * 直接落盘等于高频序列化整个 store。
 *
 * 做成工厂函数而不是单例：每个 store 各自持有一张定时器表。
 * 共用一张表的话，A store 的写入会把 B store 还没落盘的写入顶掉。
 */
export function createDebouncedStorage(delayMs = 300): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    getItem: (name) => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    },
    setItem: (name, value) => {
      if (typeof window === 'undefined') return;
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.set(
        name,
        setTimeout(() => {
          timers.delete(name);
          window.localStorage.setItem(name, value);
        }, delayMs),
      );
    },
    removeItem: (name) => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(name);
    },
  };
}
