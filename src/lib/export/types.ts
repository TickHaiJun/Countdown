import type { CountdownPhase, TimeDigits } from '@/lib/countdown';

export type { CountdownPhase, TimeDigits };

/** 7 套导出模板 */
export type TemplateId =
  | 'minimal'
  | 'ambient'
  | 'grid'
  | 'ticket'
  | 'poster'
  | 'glass'
  | 'terminal';

export type SizePresetId = 'square' | 'story' | 'wide';

export interface CardPalette {
  /** 主色：标签、进度、强调线 */
  primary: string;
  /** 次强调色：光晕、装饰 */
  accent: string;
  /** 文字色 */
  ink: string;
  /** 背景基色 */
  base: string;
}

/** 可选元素开关（§8.8） */
export interface CardVisibility {
  title: boolean;
  target: boolean;
  days: boolean;
  progress: boolean;
  tag: boolean;
  qr: boolean;
}

export const DEFAULT_VISIBILITY: CardVisibility = {
  title: true,
  target: true,
  days: true,
  progress: false,
  tag: true,
  qr: false,
};

/** 模板渲染所需的全部数据，模板本身保持纯展示、无副作用 */
export interface CardModel {
  kind: 'holiday' | 'event';
  /** 顶部小标签：「下一个假期」「假期进行中」「工作」 */
  kicker: string;
  /** 标题（假期名 / 事件名） */
  title: string;
  /** 标题是否已被隐私模式遮蔽 */
  masked: boolean;
  /** 目标时间行：2026年9月25日 周五 */
  targetLabel: string;
  phase: CountdownPhase;
  digits: TimeDigits;
  /** 数字上方的一句话：「距离开始还有」 */
  headline: string;
  /** 天数单位：「天」/「days」，模板不自己判断语言 */
  dayUnit: string;
  /** 副券上的短标签：「剩余天数」/「DAYS LEFT」 */
  daysLeftLabel: string;
  progress: number;
  visible: CardVisibility;
  qrDataUrl: string | null;
  palette: CardPalette;
  /** 页脚水印 */
  watermark: string;
}

export interface TemplateProps {
  model: CardModel;
  /**
   * 设计坐标系（1080 宽）到 CSS 像素的换算。
   * 模板内所有尺寸都写成 `u(48)` 这类设计单位，保证任意导出倍率下构图一致。
   */
  u: (n: number) => number;
  /** 卡片 CSS 像素尺寸 */
  width: number;
  height: number;
  /** 卡片在 1080 基准下的设计尺寸 */
  design: { width: number; height: number };
  /** 设计坐标系是否横版（1920×1080） */
  landscape: boolean;
}

/**
 * 导出卡片的字体栈。
 *
 * `--font-grotesk` 由 next/font 挂在 <html> 上，卡片就渲染在同一个文档里，
 * 所以能直接引用；后面跟一串系统字体兜底——html-to-image 嵌入 webfont 偶尔会失败，
 * 那时至少还能落到一套干净的几何无衬线体，不会整块塌成衬线。
 */
export const FONT_DISPLAY =
  'var(--font-grotesk), ui-sans-serif, system-ui, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
export const FONT_SANS =
  'var(--font-grotesk), ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
export const FONT_MONO =
  'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace';

/** 隐私模式下的标题遮蔽：保留字数提示 */
export function maskTitle(title: string): string {
  const count = Math.min(8, Math.max(4, title.length));
  return '•'.repeat(count);
}

export function pad2(value: number): string {
  const n = Math.max(0, Math.floor(value));
  return n < 10 ? `0${n}` : String(n);
}
