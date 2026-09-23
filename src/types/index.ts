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

/**
 * 背景主题。
 *
 * `grain` 是默认主题，走 WebGL（`@paper-design/shaders-react` 的 GrainGradient）；
 * 其余三套是纯 CSS 的 Aura 叠层，零运行时开销。
 * 四套都只改 CSS 变量与背景层，组件层不需要知道当前是哪一套。
 */
export type ThemeName = 'grain' | 'golden' | 'blueprint' | 'aurora';

export const THEME_NAMES: readonly ThemeName[] = [
  'grain',
  'golden',
  'blueprint',
  'aurora',
];

/** 每套主题的底色，供 `<meta name="theme-color">` 与首屏内联脚本使用 */
export const THEME_COLORS: Record<ThemeName, string> = {
  grain: '#000000',
  golden: '#faf8f2',
  blueprint: '#100e0b',
  aurora: '#100e0b',
};

/**
 * 字号档位。
 *
 * 只缩放字号，不动间距——项目里 100+ 处字号是写死 px 的，
 * 而 Tailwind 的间距类全是 rem。直接改 `html{font-size}` 会让间距一起变大、
 * 文字不变，布局直接坏掉（也会和 Hero 的 `100svh - 68px` 首屏预算打架）。
 * 所以走 `--fs-scale`，只作用在字号上。
 */
export type FontScale = 'compact' | 'normal' | 'wide';

export const FONT_SCALE_VALUE: Record<FontScale, number> = {
  compact: 0.94,
  normal: 1,
  wide: 1.08,
};

/** 标题色：默认 / 用强调色 / 拉到该主题下的最高对比 */
export type HeadingTone = 'default' | 'accent' | 'max';

/** 正文色：默认 / 更强 / 更淡 */
export type BodyTone = 'default' | 'strong' | 'soft';

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
  /** 背景主题 */
  theme: ThemeName;
  /** 全局字号档位 */
  fontScale: FontScale;
  /** 标题颜色档位 */
  headingTone: HeadingTone;
  /** 正文颜色档位 */
  bodyTone: BodyTone;
}

export const DEFAULT_SETTINGS: Settings = {
  privacyMode: false,
  hideEnded: true,
  sortMode: 'nearest',
  showSeconds: true,
  locale: 'zh',
  localeExplicit: false,
  reduceMotion: false,
  theme: 'grain',
  fontScale: 'normal',
  headingTone: 'default',
  bodyTone: 'default',
};
