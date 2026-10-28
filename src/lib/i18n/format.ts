import type { Locale } from '@/i18n/routing';

/**
 * Single source of truth for BCP-47 locale tags (i18n.md §7).
 * Do NOT scatter 'en-US' / 'vi-VN' literals across components.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  vi: 'vi-VN',
};

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatCurrency(value: number, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale], {
      style: 'currency',
      currency: currency || 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${formatNumber(value, locale)} ${currency}`;
  }
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
