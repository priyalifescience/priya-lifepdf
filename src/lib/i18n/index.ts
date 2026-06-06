/**
 * Internationalization utilities
 * Re-exports all i18n configuration and utilities
 */

export {
  locales,
  defaultLocale,
  localeConfig,
  isRTL,
  isValidLocale,
  getLocaleFromPath,
  getLocalizedPath,
  type Locale,
} from './config';

export {
  isRTLLocale,
  getDirection,
  getRTLClasses,
  flipPosition,
  getLogicalProperty,
  getIconRotation,
} from './rtl';

export {
  loadMessages,
  loadEnglishMessages,
  getNestedValue,
  getTranslationWithFallback,
  mergeWithFallback,
  createTranslator,
  hasTranslation,
  getMissingKeys,
  type NestedMessages,
} from './fallback';

// Legacy exports for backward compatibility
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ar', 'it', 'ro'] as const;
export const DEFAULT_LOCALE = 'en';
export const LOCALE_CONFIG = {
  en: { name: 'English', nativeName: 'English', direction: 'ltr' as const },
  es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr' as const },
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr' as const },
  de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr' as const },
  pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr' as const },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' as const },
  it: { name: 'Italian', nativeName: 'Italiano', direction: 'ltr' as const },
  ro: { name: 'Romanian', nativeName: 'Română', direction: 'ltr' as const },
};
