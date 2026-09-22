'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import BlurText from '@/components/reactbits/BlurText';
import StarBorder from '@/components/reactbits/StarBorder';
import { useI18n } from '@/i18n';

/**
 * 首页收尾。
 *
 * 刻意不加卡片外壳——前面已经有两块带描边的面板，这里留白收住，
 * 视觉上给页面一个"说完了"的句号。
 */
export function ClosingSection() {
  const { t } = useI18n();

  return (
    <section className="page-x mt-28 md:mt-36">
      <AnimatedContent distance={30} duration={0.85} threshold={0.2}>
        <div className="mx-auto max-w-2xl text-center">
          <BlurText
            text={t('landing.closingTitle')}
            animateBy="letters"
            delay={30}
            stepDuration={0.3}
            className="display-md justify-center text-ink"
          />
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
            {t('landing.closingDesc')}
          </p>

          <div className="mt-8 flex justify-center">
            <StarBorder
              as={Link}
              href="/countdowns/"
              color="#60a5fa"
              speed="5s"
              thickness={1}
              backgroundColor="rgba(96,165,250,0.10)"
              textColor="#dbeafe"
              borderColor="rgba(96,165,250,0.35)"
              className="rounded-full [&>div:last-child]:rounded-full [&>div:last-child]:px-7 [&>div:last-child]:py-3 [&>div:last-child]:text-[13.5px]"
            >
              <span className="flex items-center gap-2">
                {t('landing.closingCta')}
                <ArrowRight size={14} strokeWidth={2} />
              </span>
            </StarBorder>
          </div>
        </div>
      </AnimatedContent>
    </section>
  );
}
