'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createDebouncedStorage } from '@/store/debounced-storage';
import { STORAGE_KEY } from '@/lib/storage-keys';
import type { CountdownEvent, Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

/*
 * 键名本体放在 @/lib/storage-keys（中性模块）——本模块带 'use client'，
 * 服务端组件跨这条边界读非组件导出会拿到 undefined。这里只做再导出，
 * 让既有引用方（含单测）保持不变。
 */
export { STORAGE_KEY };
export const SCHEMA_VERSION = 1;

export interface TrashItem {
  id: string;
  payload: CountdownEvent;
  deletedAt: string;
}

/**
 * 写盘做 300ms 防抖：拖动排序、连续改名时不会高频序列化整个 store。
 * 实现抽到 store/debounced-storage.ts，番茄钟那边共用同一份逻辑。
 */
const debouncedStorage = createDebouncedStorage();

interface CountdownState {
  events: CountdownEvent[];
  trashedEvents: TrashItem[];
  settings: Settings;
  hasSeenStorageWarning: boolean;

  addEvent: (event: CountdownEvent) => void;
  updateEvent: (id: string, patch: Partial<CountdownEvent>) => void;
  removeEvent: (id: string) => void;
  restoreEvent: (id: string) => void;
  purgeTrashedEvent: (id: string) => void;
  togglePinned: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setHasSeenStorageWarning: (seen: boolean) => void;
  /** 覆盖式导入；返回写入的事件条数，供调用方提示 */
  importState: (payload: {
    events?: CountdownEvent[];
    trashedEvents?: TrashItem[];
    settings?: Partial<Settings>;
  }) => number;
  /** 清空回收站（不可撤销） */
  emptyTrash: () => void;
  clearAll: () => void;
}

const initialState = {
  events: [] as CountdownEvent[],
  trashedEvents: [] as TrashItem[],
  settings: DEFAULT_SETTINGS,
  hasSeenStorageWarning: false,
};

export const useCountdownStore = create<CountdownState>()(
  persist(
    (set) => ({
      ...initialState,

      addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),

      updateEvent: (id, patch) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...patch, updatedAt: new Date().toISOString() }
              : event,
          ),
        })),

      removeEvent: (id) =>
        set((state) => {
          const target = state.events.find((event) => event.id === id);
          if (!target) return state;
          return {
            events: state.events.filter((event) => event.id !== id),
            trashedEvents: [
              { id, payload: target, deletedAt: new Date().toISOString() },
              ...state.trashedEvents,
            ],
          };
        }),

      restoreEvent: (id) =>
        set((state) => {
          const item = state.trashedEvents.find((entry) => entry.id === id);
          if (!item) return state;
          return {
            events: [item.payload, ...state.events],
            trashedEvents: state.trashedEvents.filter((entry) => entry.id !== id),
          };
        }),

      purgeTrashedEvent: (id) =>
        set((state) => ({
          trashedEvents: state.trashedEvents.filter((entry) => entry.id !== id),
        })),

      togglePinned: (id) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, pinned: !event.pinned } : event,
          ),
        })),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      setHasSeenStorageWarning: (seen) => set({ hasSeenStorageWarning: seen }),

      importState: (payload: {
        events?: CountdownEvent[];
        trashedEvents?: TrashItem[];
        settings?: Partial<Settings>;
      }) => {
        const events = Array.isArray(payload.events) ? payload.events : [];
        set((state) => ({
          events,
          trashedEvents: Array.isArray(payload.trashedEvents)
            ? payload.trashedEvents
            : state.trashedEvents,
          settings: { ...state.settings, ...(payload.settings ?? {}) },
        }));
        return events.length;
      },

      emptyTrash: () => set({ trashedEvents: [] }),

      clearAll: () => set({ ...initialState, settings: DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      // 交给客户端手动 rehydrate，避免 SSR/CSR 首屏不一致
      skipHydration: true,
      partialize: (state) => ({
        events: state.events,
        trashedEvents: state.trashedEvents,
        settings: state.settings,
        hasSeenStorageWarning: state.hasSeenStorageWarning,
      }),
      migrate: (persisted, version) => {
        // v1 为初始版本，后续版本升级在此逐级补数据
        if (version === SCHEMA_VERSION) return persisted as never;
        return persisted as never;
      },
      /*
       * 新增设置项不能靠 version 升级解决：老数据里根本没有这些键，
       * 直接展开会得到 undefined。统一用 DEFAULT_SETTINGS 兜底，
       * 以后再加设置项就不用碰迁移逻辑了。
       */
      merge: (persisted, current) => {
        const incoming = (persisted ?? {}) as Partial<
          Pick<
            CountdownState,
            'events' | 'trashedEvents' | 'settings' | 'hasSeenStorageWarning'
          >
        >;
        return {
          ...current,
          events: incoming.events ?? current.events,
          trashedEvents: incoming.trashedEvents ?? current.trashedEvents,
          hasSeenStorageWarning:
            incoming.hasSeenStorageWarning ?? current.hasSeenStorageWarning,
          settings: { ...DEFAULT_SETTINGS, ...(incoming.settings ?? {}) },
        };
      },
    },
  ),
);
