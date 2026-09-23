'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { HolidayCard } from '@/components/holiday/HolidayCard';
import CountUp from '@/components/reactbits/CountUp';
import FadeContent from '@/components/reactbits/FadeContent';
import GlareHover from '@/components/reactbits/GlareHover';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/input';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/i18n';
import { computeCountdown } from '@/lib/countdown';
import { BUILTIN_INDEX, type ParsedHoliday } from '@/lib/holidays';
import { eventDurationMs, nextOccurrenceMs } from '@/lib/occurrence';
import { EVENT_TAGS, TAG_META } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';
import type { CountdownEvent, EventTag, SortMode } from '@/types';

type Decoration = {
  event: CountdownEvent;
  occurrenceMs: number;
  endMs: number;
  view: ReturnType<typeof computeCountdown>;
};

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px]">
      <CountUp
        to={value}
        duration={1.4}
        className="font-display text-[calc(28px*var(--fs-scale))] leading-none text-ink"
      />
      <p className="label-mono mt-1.5">{label}</p>
    </div>
  );
}

function SectionHeading({
  title,
  hint,
  count,
}: {
  title: string;
  hint?: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="font-display text-[calc(19px*var(--fs-scale))] tracking-tight text-ink">{title}</h2>
      {typeof count === 'number' ? (
        <span className="font-mono text-[calc(11px*var(--fs-scale))] text-ink-3">{count}</span>
      ) : null}
      {hint ? <span className="ml-auto text-[calc(11.5px*var(--fs-scale))] text-ink-3">{hint}</span> : null}
    </div>
  );
}

export function CountdownsBoard() {
  const now = useNow();
  const { t } = useI18n();

  const events = useCountdownStore((state) => state.events);
  const settings = useCountdownStore((state) => state.settings);
  const updateSettings = useCountdownStore((state) => state.updateSettings);
  const openComposer = useUiStore((state) => state.openComposer);
  const openExport = useUiStore((state) => state.openExport);

  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<EventTag[]>([]);
  const [showEnded, setShowEnded] = useState(false);

  /* ---------------- 假期 ---------------- */
  const holidays = useMemo(() => {
    if (now <= 0) return { ongoing: [] as ParsedHoliday[], upcoming: [] as ParsedHoliday[], ended: [] as ParsedHoliday[] };
    const ongoing: ParsedHoliday[] = [];
    const upcoming: ParsedHoliday[] = [];
    const ended: ParsedHoliday[] = [];
    for (const period of BUILTIN_INDEX.periods) {
      const phase = computeCountdown(period.startMs, period.endMs, now).phase;
      if (phase === 'ongoing') ongoing.push(period);
      else if (phase === 'upcoming') upcoming.push(period);
      else ended.push(period);
    }
    return { ongoing, upcoming, ended };
  }, [now]);

  /* ---------------- 事件 ---------------- */
  const decorated = useMemo<Decoration[]>(() => {
    if (now <= 0) return [];
    return events.map((event) => {
      const occurrenceMs = nextOccurrenceMs(event, now, BUILTIN_INDEX);
      const endMs = occurrenceMs + eventDurationMs(event);
      return { event, occurrenceMs, endMs, view: computeCountdown(occurrenceMs, endMs, now) };
    });
  }, [events, now]);

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return decorated.filter((item) => {
      if (activeTags.length > 0 && !activeTags.includes(item.event.tag)) return false;
      if (!keyword) return true;
      return (
        item.event.title.toLowerCase().includes(keyword) ||
        (item.event.note ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [decorated, activeTags, query]);

  const sortItems = <T extends { event: CountdownEvent; occurrenceMs: number }>(list: T[]) => {
    const copy = [...list];
    copy.sort((a, b) => {
      if (a.event.pinned !== b.event.pinned) return a.event.pinned ? -1 : 1;
      if (settings.sortMode === 'title') {
        return a.event.title.localeCompare(b.event.title, 'zh-Hans-CN');
      }
      if (settings.sortMode === 'created') {
        return Date.parse(b.event.createdAt) - Date.parse(a.event.createdAt);
      }
      return a.occurrenceMs - b.occurrenceMs;
    });
    return copy;
  };

  const ongoingEvents = sortItems(filteredEvents.filter((item) => item.view.phase === 'ongoing'));
  const upcomingEvents = sortItems(filteredEvents.filter((item) => item.view.phase === 'upcoming'));
  const endedEvents = sortItems(filteredEvents.filter((item) => item.view.phase === 'ended'));

  const totalActive =
    holidays.ongoing.length + holidays.upcoming.length + upcomingEvents.length + ongoingEvents.length;
  const totalEnded = holidays.ended.length + endedEvents.length;
  const totalAll = totalActive + totalEnded;

  const toggleTag = (tag: EventTag) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );

  const exportHoliday = (period: ParsedHoliday) =>
    openExport({ kind: 'holiday', id: period.id });
  const exportEvent = (event: CountdownEvent) =>
    openExport({ kind: 'event', id: event.id });

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'nearest', label: t('countdowns.sortNearest') },
    { value: 'created', label: t('countdowns.sortCreated') },
    { value: 'title', label: t('countdowns.sortTitle') },
  ];

  const grid = 'mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      {/* 页头 */}
      <section className="page-x pt-10 md:pt-16">
        <h1 className="display-lg text-ink">{t('countdowns.title')}</h1>
        <p className="mt-3 max-w-xl text-[calc(13.5px*var(--fs-scale))] leading-relaxed text-ink-2">
          {t('countdowns.subtitle')}
        </p>

        <div className="mt-8 flex flex-wrap items-start gap-x-10 gap-y-6 border-y border-line py-6">
          <StatBlock label={t('countdowns.statTotal')} value={totalAll} />
          <StatBlock label={t('countdowns.statOngoing')} value={totalActive} />
          <StatBlock label={t('countdowns.statEnded')} value={totalEnded} />
          <div className="ml-auto self-center">
            <Button variant="primary" size="md" onClick={() => openComposer(null)} className="gap-1.5">
              <Plus size={14} strokeWidth={2} />
              {t('countdowns.newEvent')}
            </Button>
          </div>
        </div>
      </section>

      {/* 筛选条 */}
      <section className="page-x mt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search
              size={14}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('countdowns.searchPlaceholder')}
              aria-label={t('common.search')}
              className="h-10 w-full rounded-full border border-line bg-surface-2 pl-9 pr-9 text-[calc(13px*var(--fs-scale))] text-ink placeholder:text-ink-3 focus:border-accent/40 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('common.clear')}
                className="absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-surface-3 hover:text-ink"
              >
                <X size={11} strokeWidth={2} />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {EVENT_TAGS.map((tag) => {
              const meta = TAG_META[tag];
              const active = activeTags.includes(tag);
              return (
                <GlareHover
                  key={tag}
                  width="auto"
                  height="auto"
                  background="transparent"
                  borderColor="transparent"
                  borderRadius="9999px"
                  glareColor={meta.color}
                  glareOpacity={0.22}
                  glareAngle={-30}
                  glareSize={200}
                  transitionDuration={650}
                >
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[calc(12px*var(--fs-scale))] transition-colors',
                      active
                        ? 'border-transparent text-accent-ink'
                        : 'border-line text-ink-2 hover:text-ink',
                    )}
                    style={active ? { backgroundColor: meta.color } : undefined}
                  >
                    <meta.Icon size={11} strokeWidth={2} />
                    {t(meta.labelKey)}
                  </button>
                </GlareHover>
              );
            })}

            <SegmentedControl<SortMode>
              ariaLabel={t('countdowns.sortLabel')}
              value={settings.sortMode}
              onChange={(next) => updateSettings({ sortMode: next })}
              options={sortOptions}
            />

            <Button
              size="sm"
              variant={showEnded ? 'subtle' : 'ghost'}
              onClick={() => setShowEnded((prev) => !prev)}
            >
              {showEnded ? t('countdowns.hideEnded') : t('countdowns.showEnded')}
            </Button>
          </div>
        </div>
      </section>

      {/* 进行中 */}
      {ongoingEvents.length > 0 ? (
        <section className="page-x mt-12">
          <SectionHeading title={t('countdowns.sectionOngoing')} count={ongoingEvents.length} />
          <div className={grid}>
            {ongoingEvents.map((item, index) => (
              <FadeContent key={item.event.id} blur duration={480} delay={index * 50}>
                <EventCard
                  event={item.event}
                  nowMs={now}
                  privacy={settings.privacyMode}
                  showSeconds={settings.showSeconds}
                  onEdit={openComposer}
                  onExport={exportEvent}
                />
              </FadeContent>
            ))}
          </div>
        </section>
      ) : null}

      {/* 法定节假日 */}
      {holidays.ongoing.length + holidays.upcoming.length > 0 ? (
        <section className="page-x mt-14">
          <SectionHeading
            title={t('countdowns.sectionHolidays')}
            count={holidays.ongoing.length + holidays.upcoming.length}
            hint={t('countdowns.holidayHint')}
          />
          <div className={grid}>
            {[...holidays.ongoing, ...holidays.upcoming].map((period, index) => (
              <FadeContent key={period.id} blur duration={480} delay={index * 50}>
                <HolidayCard
                  period={period}
                  nowMs={now}
                  showSeconds={settings.showSeconds}
                  onExport={exportHoliday}
                />
              </FadeContent>
            ))}
          </div>
        </section>
      ) : null}

      {/* 我的事件 */}
      <section className="page-x mt-14">
        <SectionHeading title={t('countdowns.sectionMine')} count={upcomingEvents.length} />
        {upcomingEvents.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-surface-1 px-6 py-12 text-center">
            <p className="text-[calc(13px*var(--fs-scale))] text-ink-2">
              {query || activeTags.length > 0 ? t('countdowns.searchEmpty') : t('countdowns.emptyAll')}
            </p>
            <p className="mt-1.5 text-[calc(12px*var(--fs-scale))] text-ink-3">
              {query || activeTags.length > 0
                ? t('countdowns.searchEmptyHint')
                : t('countdowns.emptyAllHint')}
            </p>
          </div>
        ) : (
          <div className={grid}>
            {upcomingEvents.map((item, index) => (
              <FadeContent key={item.event.id} blur duration={480} delay={index * 50}>
                <EventCard
                  event={item.event}
                  nowMs={now}
                  privacy={settings.privacyMode}
                  showSeconds={settings.showSeconds}
                  onEdit={openComposer}
                  onExport={exportEvent}
                />
              </FadeContent>
            ))}
          </div>
        )}
      </section>

      {/* 已结束 */}
      {showEnded && totalEnded > 0 ? (
        <section className="page-x mt-14">
          <SectionHeading title={t('countdowns.sectionEnded')} count={totalEnded} />
          <div className={grid}>
            {holidays.ended.map((period) => (
              <HolidayCard
                key={period.id}
                period={period}
                nowMs={now}
                showSeconds={settings.showSeconds}
                onExport={exportHoliday}
              />
            ))}
            {endedEvents.map((item) => (
              <EventCard
                key={item.event.id}
                event={item.event}
                nowMs={now}
                privacy={settings.privacyMode}
                showSeconds={settings.showSeconds}
                onEdit={openComposer}
                onExport={exportEvent}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
