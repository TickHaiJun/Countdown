'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarDays, Eye, EyeOff, Maximize2, Settings, Sparkles, Timer } from 'lucide-react';
import ShinyText from '@/components/reactbits/ShinyText';
import Magnet from '@/components/reactbits/Magnet';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { useCountdownStore } from '@/store/countdown-store';
import { useUiStore } from '@/store/ui-store';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 顶栏高度，Hero 的 100svh 计算依赖它 */
export const TOPBAR_HEIGHT = 68;

function normalizePath(pathname: string | null): string {
  const raw = pathname ?? '/';
  const stripped = BASE_PATH && raw.startsWith(BASE_PATH) ? raw.slice(BASE_PATH.length) : raw;
  return stripped === '' ? '/' : stripped;
}

export function TopBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  const privacyMode = useCountdownStore((state) => state.settings.privacyMode);
  const updateSettings = useCountdownStore((state) => state.updateSettings);
  const openSettings = useUiStore((state) => state.openSettings);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const current = normalizePath(pathname);

  const navItems = [
    { href: '/', label: t('nav.home'), Icon: Sparkles, match: (p: string) => p === '/' },
    {
      href: '/countdowns/',
      label: t('nav.countdowns'),
      Icon: CalendarDays,
      match: (p: string) => p.startsWith('/countdowns'),
    },
    {
      href: '/pomodoro/',
      label: t('nav.pomodoro'),
      Icon: Timer,
      match: (p: string) => p.startsWith('/pomodoro'),
    },
    {
      href: '/fullscreen/',
      label: t('nav.fullscreen'),
      Icon: Maximize2,
      match: (p: string) => p.startsWith('/fullscreen'),
    },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        scrolled ? 'border-b border-line bg-base/70 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="page-x flex h-[68px] items-center justify-between gap-4">
        {/* 品牌 */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={t('brand.name')}
        >
          <span className="relative grid h-7 w-7 place-items-center rounded-[9px] border border-accent/30 bg-accent/10">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="absolute inset-0 rounded-[9px] ring-1 ring-inset ring-white/5" />
          </span>
          <ShinyText
            text="COUNTDOWN"
            speed={4.5}
            color="#a1a1aa"
            shineColor="#f4f4f5"
            spread={110}
            className="font-display text-[13px] font-medium tracking-[0.22em]"
          />
        </Link>

        {/* 主导航 */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label={t('nav.menu')}>
          {navItems.map((item) => {
            const active = item.match(current);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors',
                  active
                    ? 'bg-white/[0.07] text-ink'
                    : 'text-ink-2 hover:bg-white/[0.04] hover:text-ink',
                )}
              >
                <item.Icon size={14} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 右侧操作 */}
        <div className="flex shrink-0 items-center gap-1">
          <Magnet padding={28} magnetStrength={5}>
            <button
              type="button"
              onClick={() => updateSettings({ privacyMode: !privacyMode })}
              aria-pressed={privacyMode}
              aria-label={t('settings.privacy')}
              title={t('settings.privacy')}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full border transition-colors',
                privacyMode
                  ? 'border-accent/40 bg-accent/12 text-accent'
                  : 'border-transparent text-ink-2 hover:bg-white/[0.05] hover:text-ink',
              )}
            >
              {privacyMode ? (
                <EyeOff size={15} strokeWidth={1.75} />
              ) : (
                <Eye size={15} strokeWidth={1.75} />
              )}
            </button>
          </Magnet>

          <Magnet padding={28} magnetStrength={5}>
            <button
              type="button"
              onClick={openSettings}
              aria-label={t('nav.settings')}
              title={t('nav.settings')}
              className="grid h-9 w-9 place-items-center rounded-full border border-transparent text-ink-2 transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <Settings size={15} strokeWidth={1.75} />
            </button>
          </Magnet>
        </div>
      </div>
    </header>
  );
}
