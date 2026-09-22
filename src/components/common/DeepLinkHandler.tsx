'use client';

import { useEffect, useRef } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { BUILTIN_INDEX, findPeriodById } from '@/lib/holidays';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';

/**
 * `?id=<holidayId|eventId>` 深链。
 *
 * 刻意不用 `useSearchParams()`：静态导出下它要求页面套一层 Suspense 边界，
 * 否则构建期直接报错。这里改成在 effect 里读 `location.search`，
 * 反正本来也只在客户端跑一次。
 */
export function DeepLinkHandler() {
  const hydrated = useHydrated();
  const handled = useRef(false);

  useEffect(() => {
    if (!hydrated || handled.current) return;
    handled.current = true;

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    const { openExport } = useUiStore.getState();
    if (findPeriodById(BUILTIN_INDEX, id)) {
      openExport({ kind: 'holiday', id });
      return;
    }
    if (useCountdownStore.getState().events.some((event) => event.id === id)) {
      openExport({ kind: 'event', id });
    }
  }, [hydrated]);

  return null;
}
