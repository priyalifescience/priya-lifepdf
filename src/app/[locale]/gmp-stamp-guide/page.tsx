import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import GMPStampGuideClient from './GMPStampGuideClient';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = 'GMP Document Stamping Guide — FDA · EU GMP Annex 1 · HPRA · Ireland';
  const description =
    'Complete guide to GMP document stamping for pharma, MedTech and life science teams in Ireland. Learn why document status stamps (APPROVED, CONTROLLED COPY, SUPERSEDED, DRAFT) are a regulatory requirement under FDA 21 CFR Part 11, EU GMP Annex 1, HPRA, and ICH Q10 — and how to apply them privately in your browser with zero file upload.';

  return {
    title,
    description,
    keywords: [
      'gmp document stamping guide',
      'pharma document control ireland',
      'approved stamp pdf pharmaceutical',
      'controlled copy stamp sop',
      'fda 21 cfr part 11 document stamp',
      'eu gmp annex 1 document control',
      'hpra document control ireland',
      'ich q10 document management',
      'gxp document stamp guide',
      'batch record stamp guide',
      'validation protocol document status',
      'medtech document control ireland',
      'gdpr pharma pdf tool',
      'private pdf stamp pharmaceutical',
      'regulatory document stamp ireland',
    ],
    openGraph: {
      title,
      description,
      url: `https://pdf.priyalifescience.com/${locale}/gmp-stamp-guide`,
      siteName: 'Priya LifePDF',
      locale: locale === 'en' ? 'en_IE' : locale,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://pdf.priyalifescience.com/${locale}/gmp-stamp-guide`,
    },
  };
}

interface GmpGuidePageProps {
  params: Promise<{ locale: string }>;
}

export default async function GmpStampGuidePage({ params }: GmpGuidePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GMPStampGuideClient locale={locale as Locale} />;
}
