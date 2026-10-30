import { LanguageCode } from './translations/types';

// Map 2-letter language codes to standard BCP-47 locale tags for Intl
const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  ar: 'ar-EG',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  tr: 'tr-TR',
};

/**
 * Format a date with Intl.DateTimeFormat according to user's locale
 */
export function formatDate(
  dateInput: Date | string | number | null | undefined,
  locale: LanguageCode = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const bcp47 = LOCALE_MAP[locale] || 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(bcp47, defaultOptions).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Format relative time (e.g., "5m ago", "منذ ٥ دقائق", "il y a 5 min") using Intl.RelativeTimeFormat
 */
export function formatRelativeTime(
  dateInput: Date | string | number | null | undefined,
  locale: LanguageCode = 'en'
): string {
  if (!dateInput) {
    switch (locale) {
      case 'ar': return 'لا يوجد نشاط';
      case 'fr': return 'Aucune activité';
      case 'de': return 'Keine Aktivität';
      case 'es': return 'Sin actividad';
      case 'tr': return 'Etkinlik yok';
      default: return 'No activity';
    }
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  const bcp47 = LOCALE_MAP[locale] || 'en-US';
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: 'auto' });
  } catch {
    return formatDate(date, locale);
  }

  if (absSeconds < 60) {
    return rtf.format(diffInSeconds < 0 ? -1 : 1, 'minute');
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day');
  }

  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  }

  const diffInYears = Math.round(diffInDays / 365);
  return rtf.format(diffInYears, 'year');
}

/**
 * Format numbers with Intl.NumberFormat according to user's locale
 */
export function formatNumber(
  value: number,
  locale: LanguageCode = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const bcp47 = LOCALE_MAP[locale] || 'en-US';
  try {
    return new Intl.NumberFormat(bcp47, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format currency with Intl.NumberFormat according to user's locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: LanguageCode = 'en'
): string {
  const bcp47 = LOCALE_MAP[locale] || 'en-US';
  try {
    return new Intl.NumberFormat(bcp47, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * Format percentage with Intl.NumberFormat according to user's locale
 */
export function formatPercent(
  fraction: number,
  locale: LanguageCode = 'en'
): string {
  const bcp47 = LOCALE_MAP[locale] || 'en-US';
  try {
    return new Intl.NumberFormat(bcp47, {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(fraction);
  } catch {
    return `${Math.round(fraction * 100)}%`;
  }
}
