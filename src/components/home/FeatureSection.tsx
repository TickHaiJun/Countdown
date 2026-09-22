'use client';

import { CalendarDays, ImageDown, Maximize2, Sparkles } from 'lucide-react';
import BlurText from '@/components/reactbits/BlurText';
import CountUp from '@/components/reactbits/CountUp';
import FadeContent from '@/components/reactbits/FadeContent';
import GlareHover from '@/components/reactbits/GlareHover';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { useI18n, type MessageKey } from '@/i18n';

/** 数字全部来自实际实现：法定 13 天 / 内置 9 条假期 / 7 套模板 / 8 种重复规则 */
const STATS: { labelKey: MessageKey; to: number }[] = [
  { labelKey: 'landing.statHolidays', to: 13 },
  { labelKey: 'landing.statBuiltin', to: 9 },
  { labelKey: 'landing.statTemplates', to: 7 },
  { labelKey: 'landing.statRules', to: 8 },
];

type Feature = {
  Icon: typeof CalendarDays;
  titleKey: MessageKey;
  descKey: MessageKey;
  /** 前两张用聚光跟随，后两张用光泽扫过，避免四张卡一个手感 */
  effect: 'spotlight' | 'glare';
};

const FEATURES: Feature[] = [
  {
    Icon: CalendarDays,
    titleKey: 'landing.f1Title',
    descKey: 'landing.f1Desc',
    effect: 'spotlight',
  },
  {
    Icon: Sparkles,
    titleKey: 'landing.f2Title',
    descKey: 'landing.f2Desc',
    effect: 'spotlight',
  },
  {
    Icon: ImageDown,
    titleKey: 'landing.f3Title',
    descKey: 'landing.f3Desc',
    effect: 'glare',
  },
  {
    Icon: Maximize2,
    titleKey: 'landing.f4Title',
    descKey: 'landing.f4Desc',
    effect: 'glare',
  },
];

/** 卡片内层内容，两种特效外壳共用，保证视觉完全一致 */
function FeatureBody({ feature }: { feature: Feature }) {
  const { t } = useI18n();
  const { Icon } = feature;

  return (
    /* flex-1 + 顶对齐：说明文字折成几行都不影响图标与标题的起点 */
    <div className="flex h-full flex-col p-6">
      <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-accent/25 bg-accent/10 text-accent">
        <Icon size={17} strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-display text-[17px] tracking-tight text-ink">
        {t(feature.titleKey)}
      </h3>
      <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-ink-2">
        {t(feature.descKey)}
      </p>
    </div>
  );
}

/**
 * 首页功能区。
 *
 * 目的不是"把功能列全"，而是让第一次来的人在滚动一屏之内明白这东西能干什么，
 * 所以文案压到一行标题 + 两行说明，视觉全部让给动效。
 */
export function FeatureSection() {
  const { t } = useI18n();

  return (
    <section id="features" className="page-x mt-24 md:mt-32">
      {/* ---------------- 标题 ---------------- */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-mono">{t('landing.featEyebrow')}</p>
        <BlurText
          text={t('landing.featTitle')}
          animateBy="letters"
          delay={34}
          stepDuration={0.3}
          className="display-lg mt-3 justify-center text-ink"
        />
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
          {t('landing.featSubtitle')}
        </p>
      </div>

      {/* ---------------- 数字 ---------------- */}
      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-9 border-y border-line py-9 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.labelKey} className="text-center">
            <CountUp
              to={stat.to}
              duration={1.6}
              className="font-display text-[clamp(2rem,4.2vw,2.9rem)] leading-none text-ink"
            />
            <p className="label-mono mt-2.5">{t(stat.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* ---------------- 功能卡 ---------------- */}
      {/*
        四张卡要"对齐"靠的是两层，缺一层就会散：
        1. FadeContent 的根节点本身就是网格项，必须 h-full，内层的 100% 高度才有依据；
        2. GlareHover 上游写死 `grid place-items-center`，是"把内容居中"而不是"让内容铺满"。
           中文说明文字比英文更容易折成两行，内容一变高，居中出来的起点就和上一张差开——
           这正是"英文正常、中文不对齐"的原因。
           这里用内联 style 覆盖成 stretch（内联样式优先级高于 class），不去改上游生成物。
      */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature, index) => (
          <FadeContent
            key={feature.titleKey}
            blur
            duration={560}
            delay={index * 70}
            className="h-full"
          >
            {feature.effect === 'spotlight' ? (
              <SpotlightCard className="h-full" spotlightColor="rgba(96, 165, 250, 0.16)">
                <FeatureBody feature={feature} />
              </SpotlightCard>
            ) : (
              <GlareHover
                width="100%"
                height="100%"
                background="rgba(255, 255, 255, 0.02)"
                borderColor="rgba(255, 255, 255, 0.08)"
                borderRadius="16px"
                glareColor="#b3e5ff"
                glareOpacity={0.18}
                glareAngle={-32}
                glareSize={260}
                transitionDuration={700}
                className="h-full"
                style={{ placeItems: 'stretch', cursor: 'default' }}
              >
                <FeatureBody feature={feature} />
              </GlareHover>
            )}
          </FadeContent>
        ))}
      </div>
    </section>
  );
}
