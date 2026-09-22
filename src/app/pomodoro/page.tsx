import type { Metadata } from 'next';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { TopBar } from '@/components/layout/TopBar';
import { PomodoroBoard } from '@/components/pomodoro/PomodoroBoard';
import { SettingsSheet } from '@/components/settings/SettingsSheet';

export const metadata: Metadata = {
  title: '番茄工作法 · Countdown',
  description:
    '可自定义时长的番茄钟：专注、短休息、长休息自动衔接，支持大屏与全屏显示，数据只保存在本机。',
};

/**
 * 番茄工作法页面。
 *
 * 除了设置抽屉，这里还挂上事件表单与导出弹窗——不是为了在本页用它们，
 * 而是因为全局快捷键 `n` / `e` 会打开这两个浮层。缺少它们的话，
 * `composerOpen` 会被置 true 却没有任何东西显示，而 `overlayOpen` 一旦为真，
 * 其余快捷键就全部失效了，只能靠按 Esc 解套。
 */
export default function PomodoroPage() {
  return (
    <>
      <TopBar />
      <main className="pb-16">
        <PomodoroBoard />
      </main>
      <SiteFooter />

      <EventFormDialog />
      <ExportDialog />
      <SettingsSheet />
    </>
  );
}
