/**
 * 把手里的「假期」或「事件」归一化成模板能吃的 CardModel。
 *
 * 这一层是模板的输入边界：所有文案在这里就按当前语言定稿，模板本身保持纯展示、
 * 不做任何语言判断，也不用再碰 store。
 * 隐私模式同样在这里生效：标题被遮蔽。
 */

import type { CountdownView } from '@/lib/countdown';
import type { ParsedHoliday } from '@/lib/holidays';
import { holidayName } from '@/lib/holidays';
import { TAG_META } from '@/lib/tags';
import { formatClock } from '@/lib/time';
import type { MessageKey, MessageVars, Locale } from '@/i18n';
import { formatDateFull, formatDateRangeFull } from '@/i18n/format';
import type { CountdownEvent, EventTag } from '@/types';
import type { CardModel, CardPalette, CardVisibility, CountdownPhase } from './types';
import { maskTitle } from './types';

type Translate = (key: MessageKey, vars?: MessageVars) => string;

/** 模板渲染需要的语言上下文 */
export interface CardContext {
  locale: Locale;
  t: Translate;
}

/* ---------------------------------- 色板 ---------------------------------- */

/*
 * 全部落在 Diamond Storm 里：底色是站点的 #100e0b，文字 #f4f4f5。
 * 假期用主强调色（蓝 #60a5fa）配冰蓝 #b3e5ff——正好是背景渐变里的两个色阶；
 * 自定义事件用各自的标签色，这样一张图里"官方假期"和"我自己的事"一眼能分开。
 */
const BASE = '#100e0b';
const INK = '#f4f4f5';
const ACCENT = '#60a5fa';

const HOLIDAY_PALETTE: CardPalette = {
  base: BASE,
  ink: INK,
  primary: ACCENT,
  accent: '#b3e5ff',
};

export function paletteFor(tag: EventTag): CardPalette {
  return {
    base: BASE,
    ink: INK,
    primary: TAG_META[tag]?.color ?? ACCENT,
    accent: ACCENT,
  };
}

/* ---------------------------------- 文案 ---------------------------------- */

const KICKER_KEY: Record<CountdownPhase, MessageKey> = {
  upcoming: 'card.kickerUpcoming',
  ongoing: 'card.kickerOngoing',
  ended: 'card.kickerEnded',
};

const HEADLINE_KEY: Record<CountdownPhase, MessageKey> = {
  upcoming: 'card.headlineUpcoming',
  ongoing: 'card.headlineOngoing',
  ended: 'card.headlineEnded',
};

/** HH:mm:ss → HH:mm */
function trimSeconds(label: string): string {
  return label.replace(/:\d{2}$/, '');
}

/* -------------------------------- 模型工厂 -------------------------------- */

export function holidayCardModel(
  holiday: ParsedHoliday,
  view: CountdownView,
  visibility: CardVisibility,
  ctx: CardContext,
  options: { qrDataUrl?: string | null } = {},
): CardModel {
  const { locale, t } = ctx;

  return {
    kind: 'holiday',
    kicker: t(KICKER_KEY[view.phase]),
    title: holidayName(holiday, locale),
    masked: false,
    targetLabel: `${formatDateRangeFull(holiday.startMs, holiday.endMs, locale)} · ${t(
      'card.daysTotal',
      { n: holiday.days },
    )}`,
    phase: view.phase,
    digits: view.digits,
    headline: t(HEADLINE_KEY[view.phase]),
    dayUnit: t('card.dayUnit'),
    daysLeftLabel: t('card.daysLeftLabel'),
    progress: view.progress,
    visible: visibility,
    qrDataUrl: options.qrDataUrl ?? null,
    palette: HOLIDAY_PALETTE,
    watermark: t('card.watermark'),
  };
}

export function eventCardModel(
  event: CountdownEvent,
  view: CountdownView,
  occurrenceMs: number,
  visibility: CardVisibility,
  ctx: CardContext,
  options: { privacy?: boolean; qrDataUrl?: string | null } = {},
): CardModel {
  const { locale, t } = ctx;
  const masked = options.privacy === true || event.hideTitle === true;
  const meta = TAG_META[event.tag];

  const clock = trimSeconds(formatClock(occurrenceMs));
  const dateText = formatDateFull(occurrenceMs, locale);

  return {
    kind: 'event',
    kicker: t(meta.labelKey),
    title: masked ? maskTitle(event.title) : event.title,
    masked,
    targetLabel: event.allDay ? dateText : `${dateText} ${clock}`,
    phase: view.phase,
    digits: view.digits,
    headline: t(HEADLINE_KEY[view.phase]),
    dayUnit: t('card.dayUnit'),
    daysLeftLabel: t('card.daysLeftLabel'),
    progress: view.progress,
    visible: visibility,
    qrDataUrl: options.qrDataUrl ?? null,
    palette: paletteFor(event.tag),
    watermark: t('card.watermark'),
  };
}

/** 时间尚未就绪时的占位模型，避免模板里到处判空 */
export function emptyCardModel(visibility: CardVisibility, ctx: CardContext): CardModel {
  const { t } = ctx;
  return {
    kind: 'holiday',
    kicker: t('card.computing'),
    title: '—',
    masked: false,
    targetLabel: '—',
    phase: 'upcoming',
    digits: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    headline: t('card.headlineUpcoming'),
    dayUnit: t('card.dayUnit'),
    daysLeftLabel: t('card.daysLeftLabel'),
    progress: 0,
    visible: visibility,
    qrDataUrl: null,
    palette: HOLIDAY_PALETTE,
    watermark: t('card.watermark'),
  };
}
