'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

/** 微信号。放在模块顶层，避免每次渲染重新创建。 */
const WECHAT_ID = 'daxin261';

/**
 * 微信二维码。
 *
 * 用原生 <img> 而非 next/image：`output: 'export'` 下图片优化已关闭，
 * next/image 只会多包一层无用的 loader。外链图片加 no-referrer，
 * 避免图床按 Referer 做防盗链拦截。
 */
const QR_SRC =
  'https://img2024.cnblogs.com/blog/1654515/202602/1654515-20260224140842561-1851540179.jpg';

/**
 * 页脚的联系入口 + 二维码弹窗。
 *
 * 触发按钮自己就是文本链接样式，所以这里不用 Button，直接给 DialogTrigger 套类名，
 * 免得为了一个"看起来像链接"的东西再引入一层包装。
 */
export function ContactDialog({ className }: { className?: string }) {
  const { t } = useI18n();
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'failed'>('idle');

  /*
   * 不用 `navigator.clipboard` 直接调：局域网 IP 打开时它是 undefined，
   * 会静默失败。copyText 内部有 execCommand 兜底，并回报是否真的复制成功。
   */
  const handleCopy = async () => {
    const ok = await copyText(WECHAT_ID);
    setCopyState(ok ? 'done' : 'failed');
    window.setTimeout(() => setCopyState('idle'), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-[calc(12.5px*var(--fs-scale))] text-ink-2 transition-colors',
          'hover:border-line-strong hover:bg-surface-3 hover:text-ink',
          className,
        )}
      >
        <MessageCircle size={14} strokeWidth={1.75} className="text-accent" />
        {t('contact.label')}
        <span className="font-mono text-[calc(12.5px*var(--fs-scale))] text-ink group-hover:text-accent">
          {WECHAT_ID}
        </span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contact.name')}</DialogTitle>
          <DialogDescription>{t('contact.role')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          <div className="mx-auto w-[232px] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            {/* 二维码是浅底深码，底色必须留白，不能用主题色 */}
            <img
              src={QR_SRC}
              alt={t('contact.qrAlt')}
              width={216}
              height={216}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="block h-auto w-full rounded-lg"
            />
          </div>

          <p className="mt-4 text-center text-[calc(12.5px*var(--fs-scale))] text-ink-2">{t('contact.hint')}</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <code className="rounded-full border border-line bg-surface-2 px-3 py-1.5 font-mono text-[calc(12.5px*var(--fs-scale))] text-ink">
              {WECHAT_ID}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copyState === 'done' ? (
                <Check size={13} strokeWidth={2} className="text-accent" />
              ) : (
                <Copy size={13} strokeWidth={1.75} />
              )}
              {copyState === 'done'
                ? t('common.copied')
                : copyState === 'failed'
                  ? t('contact.copyFailed')
                  : t('contact.copy')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
