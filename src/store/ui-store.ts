'use client';

import { create } from 'zustand';

export type ExportTargetKind = 'holiday' | 'event';

export interface ExportTarget {
  kind: ExportTargetKind;
  /** holiday id 或 event id */
  id: string;
}

interface UiState {
  /** 事件表单是否打开 */
  composerOpen: boolean;
  /** 正在编辑的事件 id，null 表示新建 */
  editingId: string | null;
  openComposer: (editingId?: string | null) => void;
  closeComposer: () => void;

  /** 导出弹窗的目标 */
  exportTarget: ExportTarget | null;
  openExport: (target: ExportTarget) => void;
  closeExport: () => void;

  /** 键盘导航当前聚焦的事件 */
  focusedEventId: string | null;
  setFocusedEvent: (id: string | null) => void;
  /** ↑↓ 移动焦点时置 true，让卡片短暂显示焦点环（鼠标用户不受影响） */
  keyboardNav: boolean;
  moveFocus: (id: string | null, viaKeyboard: boolean) => void;

  shortcutHelpOpen: boolean;
  setShortcutHelpOpen: (open: boolean) => void;

  /*
   * 设置面板。
   * 「三个页面」的约定下设置不能再占一个路由，收进顶栏齿轮打开的抽屉里。
   */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  setSettingsOpen: (open: boolean) => void;

  /*
   * 沉浸式大屏浮层（番茄钟在用）。
   * 之所以放进全局 store 而不是组件内部 state：全局快捷键需要知道
   * "下面盖着浮层，让路"——否则大屏里按 F / 空格 / R 会同时触发
   * 站点的 F 跳大屏页、↑↓ 选卡片，两套快捷键会打起来。
   */
  immersiveOpen: boolean;
  setImmersiveOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  composerOpen: false,
  editingId: null,
  openComposer: (editingId = null) => set({ composerOpen: true, editingId }),
  closeComposer: () => set({ composerOpen: false, editingId: null }),

  exportTarget: null,
  openExport: (target) => set({ exportTarget: target }),
  closeExport: () => set({ exportTarget: null }),

  focusedEventId: null,
  setFocusedEvent: (id) => set({ focusedEventId: id }),
  keyboardNav: false,
  moveFocus: (id, viaKeyboard) => set({ focusedEventId: id, keyboardNav: viaKeyboard }),

  shortcutHelpOpen: false,
  setShortcutHelpOpen: (open) => set({ shortcutHelpOpen: open }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  immersiveOpen: false,
  setImmersiveOpen: (open) => set({ immersiveOpen: open }),
}));
