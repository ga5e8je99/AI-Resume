import { formatRelativeTime as formatRelativeTimeIntl } from './formatUtils';
import { LanguageCode } from './translations/types';

/**
 * Utility function for human-readable relative date and time formatting
 * with support for all 6 locales (en, ar, fr, de, es, tr) via Intl.
 */
export function formatRelativeTime(
  dateInput?: string | number | Date | null,
  localeOrIsAr: LanguageCode | boolean = 'en'
): string {
  const locale: LanguageCode =
    typeof localeOrIsAr === 'boolean'
      ? (localeOrIsAr ? 'ar' : 'en')
      : (localeOrIsAr as LanguageCode) || 'en';

  return formatRelativeTimeIntl(dateInput, locale);
}
