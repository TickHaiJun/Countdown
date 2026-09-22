import type { MessageKey } from '@/i18n';
import { formatWeekdayIndex } from '@/i18n/format';
import type { Locale, Recurrence } from '@/types';

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * 把重复规则翻译成一句人话。
 *
 * 换行逻辑一律走字典，这里只负责把「周几」「第几个」这类结构化片段
 * 按当前语言拼好再塞进模板——中文用顿号、英文用逗号。
 */
export function describeRecurrence(
  rule: Recurrence,
  t: Translate,
  locale: Locale,
): string | null {
  const joiner = locale === 'zh' ? '、' : ', ';
  const separator = locale === 'zh' ? ' · ' : ', ';

  switch (rule.kind) {
    case 'none':
      return null;

    case 'daily': {
      const interval = rule.interval ?? 1;
      return interval > 1 ? t('recurrence.everyNDays', { n: interval }) : t('recurrence.daily');
    }

    case 'weekly': {
      const days = [...(rule.weekdays ?? [])]
        .sort((a, b) => a - b)
        .map((day) => formatWeekdayIndex(day, locale, true))
        .join(joiner);
      return days ? t('recurrence.weeklyOn', { days }) : t('recurrence.weekly');
    }

    case 'monthly':
      return t('recurrence.monthly', { day: rule.day ?? 1 });

    case 'yearly':
      return t('recurrence.yearly', { month: rule.month ?? 1, day: rule.day ?? 1 });

    case 'monthlyNthWeekday': {
      const nth =
        rule.nth === -1
          ? t('recurrence.nthLast')
          : t('recurrence.nthN', { n: rule.nth ?? 1 });
      return t('recurrence.monthlyNthWeekday', {
        nth,
        weekday: formatWeekdayIndex(rule.weekday ?? 1, locale),
      });
    }

    case 'monthlyLastWorkday':
      return t('recurrence.monthlyLastWorkday');

    case 'payday': {
      const base = t('recurrence.payday', { day: rule.day ?? 15 });
      const adjust =
        rule.adjust === 'forward'
          ? t('recurrence.paydayForward')
          : rule.adjust === 'backward'
            ? t('recurrence.paydayBackward')
            : '';
      return [base, adjust].filter(Boolean).join(separator);
    }

    default:
      return null;
  }
}
