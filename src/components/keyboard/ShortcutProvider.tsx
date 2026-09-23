'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShortcutHelpDialog } from '@/components/keyboard/ShortcutHelpDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-media-query';
import { useI18n } from '@/i18n';
import { BUILTIN_INDEX, findCurrentOrNext } from '@/lib/holidays';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';

/** 输入类元素里不触发快捷键 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

/** 按 DOM 顺序取当前可见的事件卡片 id */
function visibleEventIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-event-id]'))
    .map((node) => node.dataset.eventId)
    .filter((id): id is string => Boolean(id));
}

/**
 * 全局快捷键。
 *
 * 挂在根布局上，因此首页 / 大屏 / 设置页都能用；`F` 依赖当前路由决定进出方向。
 * 事件列表用 DOM 顺序（`[data-event-id]`）而不是 store 顺序，
 * 这样排序 / 筛选 / 搜索变化后，↑↓ 走的一定是屏幕上看到的顺序。
 */
export function ShortcutProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { t } = useI18n();

  const composerOpen = useUiStore((state) => state.composerOpen);
  const exportTarget = useUiStore((state) => state.exportTarget);
  const shortcutHelpOpen = useUiStore((state) => state.shortcutHelpOpen);
  const setShortcutHelpOpen = useUiStore((state) => state.setShortcutHelpOpen);
  const immersiveOpen = useUiStore((state) => state.immersiveOpen);
  const openComposer = useUiStore((state) => state.openComposer);
  const openExport = useUiStore((state) => state.openExport);
  const focusedEventId = useUiStore((state) => state.focusedEventId);
  const moveFocus = useUiStore((state) => state.moveFocus);

  const privacyMode = useCountdownStore((state) => state.settings.privacyMode);
  const updateSettings = useCountdownStore((state) => state.updateSettings);
  const removeEvent = useCountdownStore((state) => state.removeEvent);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const overlayOpen =
    composerOpen ||
    exportTarget !== null ||
    shortcutHelpOpen ||
    pendingDelete !== null ||
    // 番茄钟的大屏浮层有自己的快捷键（空格 / R / F），全局的必须让路
    immersiveOpen;

  const focusSearch = useCallback(() => {
    const input = document.getElementById('event-search');
    if (!(input instanceof HTMLInputElement)) return;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => input.focus(), 320);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);

      // Esc 与 / 在输入框内也生效，其余全部让路
      if (typing && event.key !== 'Escape' && event.key !== '/') return;

      // 浮层打开时只保留 Esc（Radix 自己会处理），避免快捷键穿透到下层
      if (overlayOpen && event.key !== 'Escape') return;

      switch (event.key) {
        case 'n':
        case 'N': {
          event.preventDefault();
          openComposer();
          break;
        }
        case 'e':
        case 'E': {
          event.preventDefault();
          if (focusedEventId) {
            openExport({ kind: 'event', id: focusedEventId });
          } else {
            const holiday = findCurrentOrNext(BUILTIN_INDEX, Date.now());
            if (holiday) openExport({ kind: 'holiday', id: holiday.id });
          }
          break;
        }
        case 'f':
        case 'F': {
          event.preventDefault();
          router.push(pathname.startsWith('/fullscreen') ? '/' : '/fullscreen/');
          break;
        }
        case 'p':
        case 'P': {
          event.preventDefault();
          updateSettings({ privacyMode: !privacyMode });
          break;
        }
        case '/': {
          event.preventDefault();
          focusSearch();
          break;
        }
        case '?': {
          event.preventDefault();
          setShortcutHelpOpen(true);
          break;
        }
        case 'ArrowUp':
        case 'ArrowDown': {
          event.preventDefault();
          const ids = visibleEventIds();
          if (ids.length === 0) return;
          const current = focusedEventId ? ids.indexOf(focusedEventId) : -1;
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          const next =
            current === -1
              ? event.key === 'ArrowDown'
                ? 0
                : ids.length - 1
              : Math.min(ids.length - 1, Math.max(0, current + delta));
          moveFocus(ids[next] ?? null, true);
          break;
        }
        case 'Enter': {
          if (!focusedEventId) return;
          event.preventDefault();
          openComposer(focusedEventId);
          break;
        }
        case 'Delete': {
          if (!focusedEventId) return;
          event.preventDefault();
          setPendingDelete(focusedEventId);
          break;
        }
        case 'Escape': {
          // 没有浮层时，Esc 清掉列表焦点并把光标从输入框里放出来
          if (overlayOpen) return;
          if (typing && event.target instanceof HTMLElement) event.target.blur();
          moveFocus(null, false);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isMobile,
    overlayOpen,
    focusedEventId,
    pathname,
    privacyMode,
    router,
    openComposer,
    openExport,
    focusSearch,
    moveFocus,
    setShortcutHelpOpen,
    updateSettings,
  ]);

  // 鼠标操作时把「键盘焦点环」收起来，避免残留高亮
  useEffect(() => {
    const onPointerDown = () => moveFocus(useUiStore.getState().focusedEventId, false);
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [moveFocus]);

  return (
    <>
      <ShortcutHelpDialog open={shortcutHelpOpen} onOpenChange={setShortcutHelpOpen} />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="w-[min(400px,calc(100vw-24px))]">
          <DialogHeader>
            <DialogTitle>{t('event.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('event.deleteBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="md" onClick={() => setPendingDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                if (pendingDelete) removeEvent(pendingDelete);
                moveFocus(null, false);
                setPendingDelete(null);
              }}
            >
              {t('event.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
