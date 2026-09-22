'use client';

import { DeepLinkHandler } from '@/components/common/DeepLinkHandler';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { ClosingSection } from '@/components/home/ClosingSection';
import { FeatureSection } from '@/components/home/FeatureSection';
import { HolidayHero } from '@/components/holiday/HolidayHero';
import { OngoingSection } from '@/components/holiday/OngoingSection';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { TopBar } from '@/components/layout/TopBar';
import { SettingsSheet } from '@/components/settings/SettingsSheet';

/**
 * 首页 = 落地页。
 *
 * 分区顺序：Hero（只放一个最近日期）→ 正在进行（仅在真的放假时出现）
 * → 功能区 → 收尾 CTA。
 *
 * 这里**不再挂「我的倒计时」列表**——首页只负责讲清楚"这是什么"，
 * 所有列表（假期 + 我的事件，含已结束）统一收敛到 /countdowns/。
 */
export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <HolidayHero />
        <OngoingSection />
        <FeatureSection />
        <ClosingSection />
      </main>
      <SiteFooter />

      {/* 全局浮层：表单 / 导出 / 设置 / 深链 */}
      <EventFormDialog />
      <ExportDialog />
      <SettingsSheet />
      <DeepLinkHandler />
    </>
  );
}
