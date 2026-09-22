import type { MessageKey } from '@/i18n';
import type { SizePresetId, TemplateId } from './types';

export interface TemplateMeta {
  id: TemplateId;
  /** 名称字典键，渲染时用 `t()` 解析 */
  nameKey: MessageKey;
  /** 悬浮说明字典键 */
  hintKey: MessageKey;
  /** 选择器里的缩略示意：两段渐变 */
  swatch: [string, string];
  /** 装饰用主色，仅供 UI 展示，与卡片内色板解耦 */
  tint: string;
}

/*
 * 七套版式共用 Diamond Storm 的底色 #100e0b，只在结构上做区分。
 * 这样无论用户挑哪一套，导出的图都还认得出是这个站点。
 */
const TEMPLATE_MAP: Record<TemplateId, TemplateMeta> = {
  minimal: {
    id: 'minimal',
    nameKey: 'export.templates.minimal',
    hintKey: 'export.templateHints.minimal',
    swatch: ['#100e0b', '#1c1c26'],
    tint: '#f4f4f5',
  },
  ambient: {
    id: 'ambient',
    nameKey: 'export.templates.ambient',
    hintKey: 'export.templateHints.ambient',
    swatch: ['#0d2244', '#60a5fa'],
    tint: '#60a5fa',
  },
  grid: {
    id: 'grid',
    nameKey: 'export.templates.grid',
    hintKey: 'export.templateHints.grid',
    swatch: ['#100e0b', '#16263f'],
    tint: '#60a5fa',
  },
  ticket: {
    id: 'ticket',
    nameKey: 'export.templates.ticket',
    hintKey: 'export.templateHints.ticket',
    swatch: ['#100e0b', '#1a2436'],
    tint: '#b3e5ff',
  },
  poster: {
    id: 'poster',
    nameKey: 'export.templates.poster',
    hintKey: 'export.templateHints.poster',
    swatch: ['#100e0b', '#1e3a8a'],
    tint: '#c084fc',
  },
  glass: {
    id: 'glass',
    nameKey: 'export.templates.glass',
    hintKey: 'export.templateHints.glass',
    swatch: ['#1a1c26', '#2c3145'],
    tint: '#e2e8f0',
  },
  terminal: {
    id: 'terminal',
    nameKey: 'export.templates.terminal',
    hintKey: 'export.templateHints.terminal',
    swatch: ['#05070d', '#0d1a2e'],
    tint: '#60a5fa',
  },
};

/** 展示顺序：先给最常用的两套，再按结构差异排 */
export const TEMPLATES: TemplateMeta[] = [
  TEMPLATE_MAP.ambient,
  TEMPLATE_MAP.minimal,
  TEMPLATE_MAP.grid,
  TEMPLATE_MAP.ticket,
  TEMPLATE_MAP.poster,
  TEMPLATE_MAP.glass,
  TEMPLATE_MAP.terminal,
];

export interface SizePreset {
  id: SizePresetId;
  /** 像素尺寸，与语言无关 */
  label: string;
  /** 用途说明的字典键 */
  hintKey: MessageKey;
  width: number;
  height: number;
}

const SIZE_MAP: Record<SizePresetId, SizePreset> = {
  square: {
    id: 'square',
    label: '1080×1080',
    hintKey: 'export.presets.square',
    width: 1080,
    height: 1080,
  },
  story: {
    id: 'story',
    label: '1080×1920',
    hintKey: 'export.presets.story',
    width: 1080,
    height: 1920,
  },
  wide: {
    id: 'wide',
    label: '1920×1080',
    hintKey: 'export.presets.wide',
    width: 1920,
    height: 1080,
  },
};

export const SIZE_PRESETS: SizePreset[] = [SIZE_MAP.square, SIZE_MAP.story, SIZE_MAP.wide];

export function getTemplate(id: TemplateId): TemplateMeta {
  return TEMPLATE_MAP[id];
}

export function getSizePreset(id: SizePresetId): SizePreset {
  return SIZE_MAP[id];
}
