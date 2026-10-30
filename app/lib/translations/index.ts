import { LanguageCode, LanguageInfo, TranslationDictionary, SUPPORTED_LANGUAGES } from './types';
import en from './en';
import ar from './ar';
import fr from './fr';
import de from './de';
import es from './es';
import tr from './tr';

export * from './types';

// Typed dictionary map ensuring all 6 languages implement TranslationDictionary
export const translations: Record<LanguageCode, TranslationDictionary> = {
  en,
  ar,
  fr,
  de,
  es,
  tr,
};

// Dev-time check to verify key parity across all languages
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  const enKeys = Object.keys(en) as (keyof TranslationDictionary)[];
  const locales: LanguageCode[] = ['ar', 'fr', 'de', 'es', 'tr'];

  locales.forEach((locale) => {
    const targetDict = translations[locale];
    const missingKeys = enKeys.filter((key) => !targetDict[key]);
    if (missingKeys.length > 0) {
      console.warn(
        `[i18n Warning] Locale '${locale}' is missing ${missingKeys.length} keys:`,
        missingKeys.slice(0, 5)
      );
    }
  });
}
