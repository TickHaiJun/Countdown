import type { Metadata } from 'next';
import { DeepLinkHandler } from '@/components/common/DeepLinkHandler';
import { CountdownsBoard } from '@/components/countdowns/CountdownsBoard';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { TopBar } from '@/components/layout/TopBar';
import { SettingsSheet } from '@/components/settings/SettingsSheet';

export const metadata: Metadata = {
  title: '全部倒计时 · Countdown',
  description:
    '法定节假日与自定义事件倒计时总览：进行中、即将到来、已结束，一处看完。',
};

export default function CountdownsPage() {
  return (
    <>
      <TopBar />
      <main className="pb-16">
        <CountdownsBoard />
      </main>
      <SiteFooter />

      <EventFormDialog />
      <ExportDialog />
      <SettingsSheet />
      <DeepLinkHandler />
    </>
  );
}
