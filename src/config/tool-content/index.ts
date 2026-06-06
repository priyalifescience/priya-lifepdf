/**
 * Tool content exports for all languages
 * Requirements: 3.1 - Multi-language support
 */

export { toolContentEn } from './en';
export { toolContentEs } from './es';
export { toolContentFr } from './fr';
export { toolContentDe } from './de';
export { toolContentPt } from './pt';
export { toolContentAr } from './ar';
export { toolContentIt } from './it';

import { toolContentEn } from './en';
import { toolContentEs } from './es';
import { toolContentFr } from './fr';
import { toolContentDe } from './de';
import { toolContentPt } from './pt';
import { toolContentAr } from './ar';
import { toolContentIt } from './it';
import { ToolContent } from '@/types/tool';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'it' | 'ro';

/**
 * Get tool content for a specific locale
 * Falls back to English if translation not found
 * ar falls back to en content for now
 */
export function getToolContent(locale: Locale, toolId: string): ToolContent | undefined {
  const contentMap: Record<Locale, Record<string, ToolContent>> = {
    en: toolContentEn,
    es: toolContentEs,
    fr: toolContentFr,
    de: toolContentDe,
    pt: toolContentPt,
    ar: toolContentAr,
    it: toolContentIt,
    ro: toolContentEn, // Fallback to English for Romanian tool content for now
  };

  const localeContent = contentMap[locale];
  if (localeContent && localeContent[toolId]) {
    return localeContent[toolId];
  }

  // Fallback to English
  return toolContentEn[toolId];
}

