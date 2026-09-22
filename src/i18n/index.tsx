'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useCountdownStore } from '@/store/countdown-store';
import type { Locale } from '@/types';
import en from './locales/en';
import zh, { type Dictionary } from './locales/zh';

export type { Locale };

export const LOCALES: { value: Locale; label: string; short: string; htmlLang: string }[] = [
  { value: 'zh', label: '简体中文', short: '中', htmlLang: 'zh-CN' },
  { value: 'en', label: 'English', short: 'EN', htmlLang: 'en' },
];

const DICTIONARIES: Record<Locale, Dictionary> = { zh, en };

/** 取字典；显式函数是为了绕开 noUncheckedIndexedAccess 下的 `Dictionary | undefined` */
function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? zh;
}

/**
 * 把嵌套字典的键路径展开成字符串字面量联合：
 * 'nav.home' | 'hero.eyebrow' | 'settings.privacy' | …
 *
 * 这样 `t('nav.hoem')` 会直接编译不过，而不是运行时静默返回键名。
 */
type Paths<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}.${Paths<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type MessageKey = Paths<Dictionary>;

export type MessageVars = Record<string, string | number>;

function resolve(dict: Dictionary, key: string): string | undefined {
  let cursor: unknown = dict;
  for (const segment of key.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

/** 把 {{name}} 占位符替换成实参；缺失的变量原样保留，便于一眼看出漏传 */
function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export interface I18nValue {
  locale: Locale;
  /** 当前语言的完整字典，需要成片文案（如生成 .ics 描述）时用 */
  dict: Dictionary;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, vars?: MessageVars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** 把浏览器语言映射到受支持的 locale；匹配不到就保持默认 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh';
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const tag of candidates) {
    if (!tag) continue;
    if (tag.toLowerCase().startsWith('zh')) return 'zh';
    if (tag.toLowerCase().startsWith('en')) return 'en';
  }
  return 'zh';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useCountdownStore((state) => state.settings.locale);
  const localeExplicit = useCountdownStore((state) => state.settings.localeExplicit);
  const updateSettings = useCountdownStore((state) => state.updateSettings);

  /*
   * 首次访问（用户没手动选过语言）时跟随浏览器。
   * 放在 effect 里是为了让服务端与客户端首帧都是 'zh'，避免 hydration mismatch；
   * 语言切换只是一次额外渲染，不会闪烁（切换前后都是同一套布局）。
   */
  useEffect(() => {
    if (localeExplicit) return;
    const detected = detectLocale();
    if (detected !== locale) updateSettings({ locale: detected });
  }, [locale, localeExplicit, updateSettings]);

  /* <html lang> 交给浏览器无障碍与断词规则，必须跟着切 */
  useEffect(() => {
    const tag = LOCALES.find((item) => item.value === locale)?.htmlLang ?? 'zh-CN';
    document.documentElement.lang = tag;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, vars?: MessageVars) => {
      const raw = resolve(dictionaryFor(locale), key) ?? resolve(zh, key) ?? (key as string);
      return interpolate(raw, vars);
    },
    [locale],
  );

  const setLocale = useCallback(
    (next: Locale) => updateSettings({ locale: next, localeExplicit: true }),
    [updateSettings],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, dict: dictionaryFor(locale), setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * 读取当前语言环境。
 *
 * Provider 之外调用时回落到中文，这样单元测试和极端情况下不会抛错。
 */
export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (context) return context;

  return {
    locale: 'zh',
    dict: zh,
    setLocale: () => {},
    t: (key, vars) => interpolate(resolve(zh, key) ?? (key as string), vars),
  };
}

/** 只要 `t` 时用这个，少解构一层 */
export function useT() {
  return useI18n().t;
}

export type { Dictionary };
