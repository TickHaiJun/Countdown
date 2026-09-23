'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Maximize2 } from 'lucide-react';
import { FlipClock } from '@/components/countdown/FlipClock';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import ClickSpark from '@/components/reactbits/ClickSpark';
import ShinyText from '@/components/reactbits/ShinyText';
import SplitText from '@/components/reactbits/SplitText';
import StarBorder from '@/components/reactbits/StarBorder';
import { Button } from '@/components/ui/button';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/i18n';
import { formatDateMedium, formatDateRange } from '@/i18n/format';
import { computeCountdown } from '@/lib/countdown';
import {
  BUILTIN_INDEX,
  findCurrentOrNext,
  holidayLunar,
  holidayName,
} from '@/lib/holidays';
import { workdaysUntil } from '@/lib/workdays';
import { useCountdownStore } from '@/store/countdown-store';

/** Diamond Storm 的强调色，React Bits 的 props 只吃字面量色值 */
const ACCENT = '#60a5fa';

/** 逐字入场的起始/结束状态，两行标题共用，避免三次渲染各写一份 */
const CHAR_FROM = { opacity: 0, y: 30, filter: 'blur(8px)' };
const CHAR_TO = { opacity: 1, y: 0, filter: 'blur(0px)' };

/**
 * 首页 Hero —— 落地页的第一屏。
 *
 * 结构照搬国外产品落地页的骨架：药丸徽章 → 超大标题（含强调词）→ 一句说明
 * → 核心展示（这里放"下一个假期"唯一一个倒计时）→ 双药丸按钮。
 *
 * 关键约束：**只展示一个最近日期**。所有"下一个之后还有什么"都交给
 * /countdowns/ 页，首页不做列表。
 *
 * 纵向节奏是压过的：pt-8 / 卡片 mt-9 / 卡内 py-7 / FlipClock mt-6，
 * 目标是让双按钮在 1440×900 的首屏里就能露出来。改这些数之前先量一次首屏。
 */
export function HolidayHero() {
  const now = useNow();
  const ready = now > 0;
  const { t, locale } = useI18n();

  const showSeconds = useCountdownStore((state) => state.settings.showSeconds);

  const holiday = ready ? findCurrentOrNext(BUILTIN_INDEX, now) : null;
  const view = holiday ? computeCountdown(holiday.startMs, holiday.endMs, now) : null;
  const ongoing = view?.phase === 'ongoing';

  const name = holiday ? holidayName(holiday, locale) : '';
  const lunar = holiday ? holidayLunar(holiday, locale) : null;

  const workdays =
    holiday && view && !ongoing ? workdaysUntil(now, holiday.startMs, BUILTIN_INDEX) : 0;

  const makeupDays = holiday?.makeupWorkdays ?? [];

  return (
    <ClickSpark sparkColor={ACCENT} sparkSize={9} sparkRadius={20} sparkCount={8} duration={520}>
      <section className="hero-screen page-x relative flex flex-col items-center justify-center pb-14 pt-8 text-center md:pt-12">
        {/* ---------------------------------------------- 药丸徽章 */}
        <AnimatedContent distance={14} duration={0.7} threshold={0}>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface-2 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <ShinyText
              text={t('landing.badge')}
              speed={5}
              color="var(--color-ink-3)"
              shineColor="var(--color-accent)"
              spread={120}
              className="text-[calc(12px*var(--fs-scale))]"
            />
          </span>
        </AnimatedContent>

        {/* ---------------------------------------------- 大标题 */}
        <h1 className="display-hero mt-6 text-ink">
          <span className="block">
            <SplitText
              text={t('landing.titleLead')}
              tag="span"
              splitType="chars"
              delay={34}
              duration={0.85}
              from={CHAR_FROM}
              to={CHAR_TO}
              rootMargin="0px"
              threshold={0}
            />
          </span>
          {/*
           * 强调行用纯色 + 外发光，**不用** bg-clip-text 渐变：
           * SplitText 会把文字拆成子 span，而 background-clip:text 只裁剪
           * 元素自身的文字区域，父级的渐变背景不会透到子 span 上——
           * 结果是整行文字直接消失。
           */}
          <span className="block text-accent [text-shadow:0_0_70px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
            <SplitText
              text={t('landing.titleAccent')}
              tag="span"
              splitType="chars"
              delay={34}
              duration={0.85}
              from={CHAR_FROM}
              to={CHAR_TO}
              rootMargin="0px"
              threshold={0}
            />
          </span>
        </h1>

        {/* ---------------------------------------------- 说明 */}
        <AnimatedContent distance={18} duration={0.7} delay={0.12} threshold={0}>
          <p className="mx-auto mt-5 max-w-[46ch] text-[calc(14px*var(--fs-scale))] leading-relaxed text-ink-2 md:text-[calc(15px*var(--fs-scale))]">
            {t('landing.subtitle')}
          </p>
        </AnimatedContent>

        {/* ---------------------------------------------- 唯一的那个日期 */}
        <AnimatedContent
          distance={26}
          duration={0.8}
          delay={0.22}
          threshold={0}
          className="mt-9 w-full"
        >
          <div className="surface hairline-top corner-glow relative mx-auto max-w-2xl overflow-hidden rounded-panel px-6 py-7 md:px-10 md:py-8">
            <p className="label-mono">
              {ongoing ? t('landing.ongoingLabel') : t('landing.nextLabel')}
            </p>

            <h2 className="mt-2.5 font-display text-[clamp(1.5rem,3.6vw,2.2rem)] font-medium tracking-tight text-ink">
              {ready && holiday ? name : '· · ·'}
            </h2>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[calc(12.5px*var(--fs-scale))] text-ink-2">
              {lunar ? (
                <>
                  <span>{lunar}</span>
                  <span aria-hidden="true" className="text-ink-3">
                    ·
                  </span>
                </>
              ) : null}
              <span>
                {ready && holiday
                  ? formatDateRange(holiday.startMs, holiday.endMs, locale)
                  : '—'}
              </span>
              {holiday ? (
                <>
                  <span aria-hidden="true" className="text-ink-3">
                    ·
                  </span>
                  <span className="text-accent">{t('hero.length', { n: holiday.days })}</span>
                </>
              ) : null}
            </div>

            <div className="mt-6 flex justify-center md:mt-7">
              <FlipClock
                tone="hero"
                digits={view?.digits ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }}
                showSeconds={showSeconds}
                labels={{
                  day: t('unit.day'),
                  hour: t('unit.hour'),
                  minute: t('unit.minute'),
                  second: t('unit.second'),
                }}
              />
            </div>

            {ready && holiday && !ongoing && workdays > 0 ? (
              <p className="mt-5 text-[calc(12.5px*var(--fs-scale))] text-ink-2">
                {workdays === 1
                  ? t('hero.workdaysToGoOne')
                  : t('hero.workdaysToGo', { n: workdays })}
              </p>
            ) : null}

            {ongoing && view ? (
              <p className="mt-5 text-[calc(12.5px*var(--fs-scale))] text-ink-2">
                {view.isFinalDay
                  ? t('hero.todayIsLastDay')
                  : t('hero.daysLeft', { n: view.daysLeft })}
              </p>
            ) : null}

            {ready && makeupDays.length > 0 ? (
              <p className="mt-2.5 text-[calc(12px*var(--fs-scale))] text-warn">
                {makeupDays.length === 1
                  ? t('hero.makeupOn', {
                      date: formatDateMedium(Date.parse(`${makeupDays[0]}T12:00:00+08:00`), locale),
                    })
                  : t('hero.makeupOnMultiple', {
                      dates: makeupDays
                        .map(
                          (day) =>
                            formatDateMedium(Date.parse(`${day}T12:00:00+08:00`), locale) || day,
                        )
                        .join(locale === 'zh' ? '、' : ', '),
                    })}
              </p>
            ) : null}
          </div>
        </AnimatedContent>

        {/* ---------------------------------------------- 双药丸按钮 */}
        <AnimatedContent distance={16} duration={0.7} delay={0.32} threshold={0} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StarBorder
              as={Link}
              href="/countdowns/"
              /* 配色全部走 token：浅色主题下 10% 蓝底 + 近白文字是不可读的 */
              color="var(--color-accent)"
              speed="5s"
              thickness={1}
              backgroundColor="color-mix(in srgb, var(--color-accent) 12%, transparent)"
              textColor="var(--color-ink)"
              borderColor="color-mix(in srgb, var(--color-accent) 35%, transparent)"
              className="rounded-full [&>div:last-child]:rounded-full [&>div:last-child]:px-7 [&>div:last-child]:py-3 [&>div:last-child]:text-[calc(13.5px*var(--fs-scale))]"
            >
              <span className="flex items-center gap-2">
                {t('landing.ctaPrimary')}
                <ArrowRight size={14} strokeWidth={2} />
              </span>
            </StarBorder>

            <Button asChild variant="outline" size="lg">
              <Link href="/fullscreen/">
                <Maximize2 size={14} strokeWidth={1.75} />
                {t('landing.ctaSecondary')}
              </Link>
            </Button>
          </div>
        </AnimatedContent>

        {/* ---------------------------------------------- 滚动提示 */}
        <a
          href="#features"
          className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[calc(11px*var(--fs-scale))] text-ink-3 transition-colors hover:text-ink-2"
        >
          {t('landing.featEyebrow')}
          <ChevronDown size={14} strokeWidth={1.75} className="animate-bounce" />
        </a>
      </section>
    </ClickSpark>
  );
}
