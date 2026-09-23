'use client';

import { ImageDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import { FlipClock } from '@/components/countdown/FlipClock';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { useI18n } from '@/i18n';
import { formatDateRange, formatRelativeDay } from '@/i18n/format';
import { computeCountdown } from '@/lib/countdown';
import {
  holidayAccent,
  holidayLunar,
  holidayName,
  type ParsedHoliday,
} from '@/lib/holidays';
import { cn } from '@/lib/utils';

export interface HolidayCardProps {
  period: ParsedHoliday;
  nowMs: number;
  showSeconds?: boolean;
  onExport?: (period: ParsedHoliday) => void;
  className?: string;
}

export function HolidayCard({
  period,
  nowMs,
  showSeconds = true,
  onExport,
  className,
}: HolidayCardProps) {
  const { t, locale } = useI18n();

  const view = computeCountdown(period.startMs, period.endMs, nowMs);
  const lunar = holidayLunar(period, locale);
  const name = holidayName(period, locale);
  const accent = holidayAccent(period.id);

  const statusLabel =
    view.phase === 'ongoing'
      ? t('status.ongoing')
      : view.phase === 'ended'
        ? t('status.ended')
        : null;

  const badgeLabel =
    period.confidence === 'official' ? t('hero.badgeOfficial') : t('hero.badgeStatutory');

  return (
    /* 聚光色跟着节日走，扫读时一屏卡片不至于全是一个颜色 */
    <SpotlightCard
      spotlightColor="rgba(96, 165, 250, 0.14)"
      className={cn(
        'group h-full transition-colors',
        view.phase === 'ended' && 'opacity-55',
        className,
      )}
    >
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/*
              节日名做成彩色的标签，色相取自 lib/holidays/accents.ts。
              放在最前面是为了扫读顺序：先知道是哪个节，再看状态。

              色相以 `--ha` 传进 CSS，而不是在这里直接写内联颜色：
              这套色相是按深色底选的，放到奶油底上几乎读不出来，
              需要 CSS 层用 color-mix 往近黑压一档。见 globals.css 的 .holiday-pill。
            */}
            <span
              className="holiday-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[calc(11px*var(--fs-scale))] leading-none"
              style={{ '--ha': accent } as CSSProperties}
            >
              <span
                className="holiday-pill__dot h-1.5 w-1.5 rounded-full"
                aria-hidden="true"
              />
              {name}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-tag-holiday/30 bg-tag-holiday/10 px-2.5 py-1 text-[calc(11px*var(--fs-scale))] leading-none text-tag-holiday">
              {t('tag.holiday')}
            </span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[calc(10px*var(--fs-scale))] leading-none text-ink-3">
              {badgeLabel}
            </span>
            {statusLabel ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[calc(11px*var(--fs-scale))]',
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
          </div>

          {onExport ? (
            <button
              type="button"
              onClick={() => onExport(period)}
              aria-label={t('event.export')}
              title={t('event.export')}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-3 opacity-0 transition-all hover:bg-surface-3 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ImageDown size={12} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        <h3 className="mt-3.5 font-display text-[calc(18.5px*var(--fs-scale))] leading-snug tracking-tight">
          {name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[calc(12px*var(--fs-scale))] text-ink-3">
          {lunar ? (
            <>
              <span>{lunar}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>{formatDateRange(period.startMs, period.endMs, locale)}</span>
          <span aria-hidden="true">·</span>
          <span className="text-accent">{t('hero.length', { n: period.days })}</span>
        </div>

        <div className="mt-5 flex-1">
          {view.phase === 'ended' ? (
            <p className="font-display text-[calc(15px*var(--fs-scale))] text-ink-3">{t('status.ended')}</p>
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
            <p className="mt-3 text-[calc(12.5px*var(--fs-scale))] text-ink-3">
              {formatRelativeDay(period.startMs, nowMs, locale, t)}
            </p>
          ) : null}
        </div>

        {period.makeupWorkdays.length > 0 && view.phase !== 'ended' ? (
          <p className="mt-3.5 border-t border-line pt-3 text-[calc(11px*var(--fs-scale))] text-warn">
            {t('hero.makeupTitle')} ·{' '}
            {period.makeupWorkdays.join(locale === 'zh' ? '、' : ', ')}
          </p>
        ) : null}
      </div>
    </SpotlightCard>
  );
}
