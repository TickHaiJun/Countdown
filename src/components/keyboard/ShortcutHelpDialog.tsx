'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: '操作',
    items: [
      { keys: ['N'], label: '新建事件' },
      { keys: ['E'], label: '导出卡片（优先当前聚焦事件）' },
      { keys: ['F'], label: '进入 / 退出大屏模式' },
      { keys: ['/'], label: '聚焦搜索框' },
      { keys: ['P'], label: '切换隐私模式' },
    ],
  },
  {
    title: '列表导航',
    items: [
      { keys: ['↑', '↓'], label: '在事件卡片间移动焦点' },
      { keys: ['Enter'], label: '编辑选中事件' },
      { keys: ['Delete'], label: '删除选中事件（需二次确认）' },
    ],
  },
  {
    title: '其他',
    items: [
      { keys: ['?'], label: '打开这个帮助' },
      { keys: ['Esc'], label: '关闭浮层 / 取消输入' },
    ],
  },
];

export function ShortcutHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(520px,calc(100vw-24px))]">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
          <DialogDescription>
            在输入框中不会触发（Esc 与 / 除外）；移动端不启用。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2.5">
              <span className="label-mono">{group.title}</span>
              <dl className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <dt className="text-[calc(12px*var(--fs-scale))] text-[var(--color-ink-2)]">{item.label}</dt>
                    <dd className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="tnum rounded-[6px] border border-hairline-strong bg-surface-3 px-2 py-0.5 text-[calc(11px*var(--fs-scale))] text-[var(--color-ink)]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
