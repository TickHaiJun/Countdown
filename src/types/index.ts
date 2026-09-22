export type EventTag = 'work' | 'life' | 'anniversary' | 'payday' | 'holiday';

/**
 * 界面语言。
 *
 * 定义在这里而不是 i18n 目录，是为了让依赖方向保持单向：
 * types ← i18n ← store ← components。
 */
export type Locale = 'zh' | 'en';

export type RecurrenceKind =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'monthlyNthWeekday'
  | 'monthlyLastWorkday'
  | 'payday';

export interface Recurrence {
  kind: RecurrenceKind;
  /** daily：每 N 天，默认 1 */
  interval?: number;
  /** weekly：0=周日 */
  weekdays?: number[];
  /** monthly / yearly / payday：几号；超过当月天数时取月末 */
  day?: number;
  /** yearly：1-12 */
  month?: number;
  /** monthlyNthWeekday：1-4 或 -1（最后一个） */
  nth?: 1 | 2 | 3 | 4 | -1;
  /** monthlyNthWeekday：0=周日 */
  weekday?: number;
  /** payday：遇非工作日提前 / 延后 / 不变 */
  adjust?: 'none' | 'forward' | 'backward';
}

export interface CountdownEvent {
  id: string;
  title: string;
  allDay: boolean;
  /** 显式开始时刻（重复事件为首次发生时刻），ISO 带 +08:00 */
  start: string;
  end: string;
  tag: EventTag;
  note?: string;
  pinned: boolean;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
  /** 隐私模式下是否隐藏标题，默认跟随全局设置 */
  hideTitle?: boolean;
}

export type SortMode = 'nearest' | 'created' | 'title';

export interface Settings {
  /** 隐私模式：隐藏标题，只显示倒计时 */
  privacyMode: boolean;
  /** 默认只看未来 */
  hideEnded: boolean;
  sortMode: SortMode;
  showSeconds: boolean;
  /** 界面语言 */
  locale: Locale;
  /**
   * 用户是否手动选过语言。
   *
   * 为 false 时跟随 `navigator.language`；一旦用户点过语言切换就置 true，
   * 之后不再被浏览器语言覆盖。
   */
  localeExplicit: boolean;
  /** 减弱动效：关闭 WebGL 背景动画与入场过渡 */
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  privacyMode: false,
  hideEnded: true,
  sortMode: 'nearest',
  showSeconds: true,
  locale: 'zh',
  localeExplicit: false,
  reduceMotion: false,
};
