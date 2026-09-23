'use client';

import { FlipClock } from '@/components/countdown/FlipClock';
import BorderGlow from '@/components/reactbits/BorderGlow';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/i18n';
import { formatDateFull } from '@/i18n/format';
import { computeCountdown } from '@/lib/countdown';
import { BUILTIN_INDEX, findCurrentOrNext, holidayName } from '@/lib/holidays';
import { useCountdownStore } from '@/store/countdown-store';

/**
 * 「正在进行」区块。
 *
 * 只在真的有假期在放假时出现——没有就是 null，不留空壳。
 * 用 BorderGlow 而不是 SpotlightCard：这块是页面里唯一的"实时进行中"信息，
 * 边框呼吸的光晕能把它跟静态卡片区分开。
 */
export function OngoingSection() {
  const now = useNow();
  const { t, locale } = useI18n();
  const showSeconds = useCountdownStore((state) => state.settings.showSeconds);

  if (now <= 0) return null;

  const holiday = findCurrentOrNext(BUILTIN_INDEX, now);
  if (!holiday) return null;

  const view = computeCountdown(holiday.startMs, holiday.endMs, now);
  if (view.phase !== 'ongoing') return null;

  const percent = Math.round(view.progress * 100);

  return (
    <section className="page-x mt-8 md:mt-16">
      <BorderGlow
        className="mx-auto max-w-4xl"
        edgeSensitivity={28}
        glowColor="96 165 250"
        backgroundColor="#17161d"
        borderRadius={22}
        glowRadius={36}
        glowIntensity={0.9}
        coneSpread={22}
        animated
        colors={['#60a5fa', '#b3e5ff', '#2563eb']}
        fillOpacity={0.35}
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="label-mono">{t('ongoing.title')}</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight md:text-3xl">
                {holidayName(holiday, locale)}
              </h2>
            </div>
            <p className="text-[calc(12px*var(--fs-scale))] text-ink-2">
              {t('ongoing.finishedAt', {
                date: formatDateFull(holiday.endMs, locale),
              })}
            </p>
          </div>

          <div className="mt-6">
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
          </div>

          <div className="mt-6">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-surface-4">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[calc(11.5px*var(--fs-scale))] text-ink-3">
              <span>{t('ongoing.elapsed', { n: percent })}</span>
              <span>{t('ongoing.remaining')}</span>
            </div>
          </div>
        </div>
      </BorderGlow>
    </section>
  );
}
