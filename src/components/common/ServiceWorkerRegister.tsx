'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useI18n } from '@/i18n';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * 注册 Service Worker，并在检测到新版本时给出「点击刷新」提示。
 *
 * 只在生产构建下注册：开发环境的 HMR 资源会被 SW 缓存住，
 * 结果是改了代码刷新没变化，排查成本远高于收益。
 *
 * 与 `crypto.randomUUID` 同理，Service Worker 也要求安全上下文——
 * 局域网 http 打开时 `navigator.serviceWorker` 根本不存在，直接跳过即可。
 */
export function ServiceWorkerRegister() {
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;

    const track = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setWaiting(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // 已有控制器 = 这是「更新」而不是「首次安装」
          if (installing.state === 'installed' && navigator.serviceWorker.controller && !cancelled) {
            setWaiting(installing);
          }
        });
      });
    };

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, {
          scope: `${BASE_PATH}/`,
        });
        if (cancelled) return;
        track(registration);
      } catch {
        /* 注册失败（如 file:// 或隐私模式）不应影响页面本身 */
      }
    })();

    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const reload = useCallback(() => {
    waiting?.postMessage({ type: 'SKIP_WAITING' });
    // 拿不到 waiting 时（例如已被接管）直接刷新
    window.setTimeout(() => window.location.reload(), 400);
  }, [waiting]);

  if (!waiting || dismissed) return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-elev/95 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      role="status"
    >
      <span className="text-[12px] text-ink-2">{t('common.updateAvailable')}</span>
      <button
        type="button"
        onClick={reload}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[12px] font-medium text-accent-ink transition-colors hover:brightness-110"
      >
        <RefreshCw size={13} strokeWidth={2} />
        {t('common.refresh')}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('common.later')}
        title={t('common.later')}
        className="rounded-full p-1 text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink"
      >
        <X size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}
