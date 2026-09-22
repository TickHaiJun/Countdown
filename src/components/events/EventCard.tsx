'use client';

import { ImageDown, Pencil, Pin, Trash2 } from 'lucide-react';
import { FlipClock } from '@/components/countdown/FlipClock';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { useI18n } from '@/i18n';
import { formatDateRange, formatRelativeDay } from '@/i18n/format';
import { computeCountdown } from '@/lib/countdown';
import { BUILTIN_INDEX } from '@/lib/holidays';
import { eventDurationMs, nextOccurrenceMs } from '@/lib/occurrence';
import { describeRecurrence } from '@/lib/recurrence-label';
import { TAG_META } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';
import type { CountdownEvent } from '@/types';

export interface EventCardProps {
  event: CountdownEvent;
  nowMs: number;
  privacy?: boolean;
  showSeconds?: boolean;
  onEdit?: (id: string) => void;
  onExport?: (event: CountdownEvent) => void;
  onDelete?: (id: string) => void;
  focused?: boolean;
  className?: string;
}

export function EventCard({
  event,
  nowMs,
  privacy = false,
  showSeconds = true,
  onEdit,
  onExport,
  onDelete,
  focused = false,
  className,
}: EventCardProps) {
  const { t, locale } = useI18n();
  const togglePinned = useCountdownStore((state) => state.togglePinned);

  // 重复事件要算"下一次发生"，否则一个每周三的会议在周四就显示已结束了
  const occurrenceMs = nextOccurrenceMs(event, nowMs, BUILTIN_INDEX);
  const endMs = occurrenceMs + eventDurationMs(event);
  const view = computeCountdown(occurrenceMs, endMs, nowMs);

  const recurrenceLabel = describeRecurrence(event.recurrence, t, locale);
  const tag = TAG_META[event.tag];
  const hideTitle = privacy || event.hideTitle === true;

  const statusLabel =
    view.phase === 'ongoing'
      ? t('status.ongoing')
      : view.phase === 'ended'
        ? t('status.ended')
        : null;

  return (
    <SpotlightCard
      className={cn(
        'group h-full transition-colors',
        view.phase === 'ended' && 'opacity-55',
        focused && 'ring-1 ring-accent/50',
        className,
      )}
    >
      <div className="flex h-full flex-col p-5">
        {/* 头部：分类 + 操作 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] leading-none"
              style={{
                borderColor: `${tag.color}33`,
                color: tag.color,
                backgroundColor: `${tag.color}12`,
              }}
            >
              <tag.Icon size={11} strokeWidth={2} />
              {t(tag.labelKey)}
            </span>
            {statusLabel ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px]',
                  view.phase === 'ongoing' ? 'text-accent' : 'text-ink-3',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    view.phase === 'ongoing' ? 'bg-accent' : 'bg-ink-3',
                  )}
                />
                {statusLabel}
              </span>
            ) : null}
            {event.pinned ? <Pin size={11} className="text-ink-3" /> : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => togglePinned(event.id)}
              aria-label={event.pinned ? t('event.unpin') : t('event.pin')}
              title={event.pinned ? t('event.unpin') : t('event.pin')}
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.07] hover:text-ink"
            >
              <Pin size={12} strokeWidth={1.75} />
            </button>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(event.id)}
                aria-label={t('event.edit')}
                title={t('event.edit')}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.07] hover:text-ink"
              >
                <Pencil size={12} strokeWidth={1.75} />
              </button>
            ) : null}
            {onExport ? (
              <button
                type="button"
                onClick={() => onExport(event)}
                aria-label={t('event.export')}
                title={t('event.export')}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.07] hover:text-ink"
              >
                <ImageDown size={12} strokeWidth={1.75} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                aria-label={t('event.delete')}
                title={t('event.delete')}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-alert/12 hover:text-alert"
              >
                <Trash2 size={12} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>

        {/* 标题 */}
        <h3
          className={cn(
            'mt-3.5 font-display text-[18.5px] leading-snug tracking-tight',
            hideTitle && 'masked-title',
          )}
          title={hideTitle ? undefined : event.title}
        >
          {event.title}
        </h3>

        {/* 日期与重复 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-3">
          <span>{formatDateRange(occurrenceMs, endMs, locale)}</span>
          {recurrenceLabel ? (
            <>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <span>{recurrenceLabel}</span>
            </>
          ) : null}
        </div>

        {/* 倒计时：隐私模式只藏标题，数字照常显示 */}
        <div className="mt-5 flex-1">
          {view.phase === 'ended' ? (
            <p className="font-display text-[15px] text-ink-3">
              {t('event.finished', { n: Math.abs(view.daysLeft) })}
            </p>
          ) : (
            <FlipClock
              tone="card"
              digits={view.digits}
              showSeconds={showSeconds}
              labels={{
                day: t('unit.day'),
                hour: t('unit.hour'),
                minute: t('unit.minute'),
                second: t('unit.second'),
              }}
            />
          )}
          {view.phase !== 'ended' ? (
            <p className="mt-3 text-[12.5px] text-ink-3">
              {formatRelativeDay(occurrenceMs, nowMs, locale, t)}
            </p>
          ) : null}
        </div>

        {/* 进行中：进度条 */}
        {view.phase === 'ongoing' ? (
          <div className="mt-4">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.round(view.progress * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px] text-ink-3">
              {t('ongoing.elapsed', { n: Math.round(view.progress * 100) })}
            </p>
          </div>
        ) : null}
      </div>
    </SpotlightCard>
  );
}
