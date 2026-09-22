import {
  Briefcase,
  CalendarHeart,
  Heart,
  Plane,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { MessageKey } from '@/i18n';
import type { EventTag } from '@/types';

export interface TagMeta {
  /** 字典键，文案由调用方用 `t()` 解析 */
  labelKey: MessageKey;
  color: string;
  Icon: LucideIcon;
}

/**
 * 标签视觉。
 *
 * Diamond Storm 下主强调色是蓝，五个标签各自拉开色相（蓝 / 绿 / 琥珀 / 紫 / 粉），
 * 统一压到中等明度——work 与强调色同系但不完全同色，避免整页只剩一种蓝。
 */
export const TAG_META: Record<EventTag, TagMeta> = {
  work: { labelKey: 'tag.work', color: '#60a5fa', Icon: Briefcase },
  life: { labelKey: 'tag.life', color: '#34d399', Icon: Heart },
  anniversary: { labelKey: 'tag.anniversary', color: '#fbbf24', Icon: CalendarHeart },
  payday: { labelKey: 'tag.payday', color: '#c084fc', Icon: Wallet },
  holiday: { labelKey: 'tag.holiday', color: '#f472b6', Icon: Plane },
};

export const EVENT_TAGS: EventTag[] = ['work', 'life', 'anniversary', 'payday', 'holiday'];

export function tagColor(tag: EventTag): string {
  return TAG_META[tag].color;
}

export function tagLabelKey(tag: EventTag): MessageKey {
  return TAG_META[tag].labelKey;
}
