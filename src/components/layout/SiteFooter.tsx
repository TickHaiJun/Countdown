'use client';

import { ContactDialog } from '@/components/layout/ContactDialog';
import { useI18n } from '@/i18n';

/**
 * 页脚。
 *
 * 刻意保持极简：只说"这是什么"和"怎么找我"。
 * 之前那套"数据留在本机 / 源码链接 / 用 Next.js 构建"属于开发者自述，
 * 访客不关心，已全部移除。
 */
export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="page-x flex flex-col items-center gap-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-accent/30 bg-accent/10">
            <span className="h-2 w-2 rounded-full bg-accent" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-[calc(12px*var(--fs-scale))] tracking-[0.22em] text-ink-2">
              {t('brand.latin').toUpperCase()}
            </p>
            <p className="text-[calc(11.5px*var(--fs-scale))] text-ink-3">{t('footer.tagline')}</p>
          </div>
        </div>

        <ContactDialog />
      </div>
    </footer>
  );
}
