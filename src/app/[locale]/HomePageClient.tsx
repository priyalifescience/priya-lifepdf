'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Zap, Wrench, Sparkles, Edit, FileImage, FolderOpen, Settings, ShieldCheck, Star, FlaskConical, FileCheck2, Lock, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getAllTools, getToolsByCategory, getPopularTools } from '@/config/tools';
import { type Locale } from '@/lib/i18n/config';
import { type ToolCategory } from '@/types/tool';

interface HomePageClientProps {
  locale: Locale;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

// ... (previous imports)

// ... (props interface)

// ... (previous imports)

// ... (props interface)

export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const t = useTranslations();
  const allTools = getAllTools();
  const popularTools = getPopularTools();

  // Feature highlights (same as before)
  const features = [
    {
      icon: ShieldCheck,
      titleKey: 'home.features.privacy.title',
      descriptionKey: 'home.features.privacy.description',
      color: 'text-green-500',
    },
    {
      icon: Zap,
      titleKey: 'home.features.free.title',
      descriptionKey: 'home.features.free.description',
      color: 'text-yellow-500',
    },
    {
      icon: Wrench,
      titleKey: 'home.features.powerful.title',
      descriptionKey: 'home.features.powerful.description',
      color: 'text-blue-500',
    },
  ];

  // Category icons mapping
  const categoryIcons: Record<ToolCategory, typeof Edit> = {
    'edit-annotate': Edit,
    'convert-to-pdf': FileImage,
    'convert-from-pdf': FileImage,
    'organize-manage': FolderOpen,
    'optimize-repair': Settings,
    'secure-pdf': ShieldCheck,
  };

  const categoryTranslationKeys: Record<ToolCategory, string> = {
    'edit-annotate': 'editAnnotate',
    'convert-to-pdf': 'convertToPdf',
    'convert-from-pdf': 'convertFromPdf',
    'organize-manage': 'organizeManage',
    'optimize-repair': 'optimizeRepair',
    'secure-pdf': 'securePdf',
  };

  // Category sections to display
  const categoryOrder: ToolCategory[] = [
    'edit-annotate',
    'convert-to-pdf',
    'convert-from-pdf',
    'organize-manage',
    'optimize-repair',
    'secure-pdf',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--color-background))]">
      <Header locale={locale} />

      {/* Sector Promotional Ticker */}
      <div className="fixed top-[72px] left-0 right-0 z-40 overflow-hidden select-none"
           style={{ background: '#151B1F', borderBottom: '1px solid #2a3540' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes hpmarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        ` }} />
        <div className="flex whitespace-nowrap animate-[hpmarquee_40s_linear_infinite] py-2 gap-10 text-xs font-semibold tracking-widest uppercase" style={{ color: '#86bc24' }}>
          {[0,1].map(i => (
            <div key={i} className="flex gap-10 items-center" aria-hidden={i === 1 ? 'true' : undefined}>
              <span>🧬 Pharma</span><span style={{color:'#2a3540'}}>◆</span>
              <span>🔬 Biotech &amp; MedTech</span><span style={{color:'#2a3540'}}>◆</span>
              <span>🏥 Health</span><span style={{color:'#2a3540'}}>◆</span>
              <span>🇮🇪 Life Science Ireland</span><span style={{color:'#2a3540'}}>◆</span>
              <span>📄 PDF Editor for Life Science</span><span style={{color:'#2a3540'}}>◆</span>
              <span>🛡️ GDPR Compliant · No File Upload</span><span style={{color:'#2a3540'}}>◆</span>
              <span>✅ EU GMP Annex 1 · HPRA</span><span style={{color:'#2a3540'}}>◆</span>
            </div>
          ))}
        </div>
      </div>

      <main id="main-content" className="flex-1 relative" tabIndex={-1}>
        {/* Hero Section — premium dark, no external image */}
        <section
          className="relative overflow-hidden pt-[112px] pb-24 lg:pt-[132px] lg:pb-32"
          style={{ background: 'linear-gradient(160deg, #0d1317 0%, #151B1F 45%, #111a14 100%)' }}
          aria-labelledby="hero-title"
        >
          {/* Subtle dot-grid texture */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(134,188,36,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          {/* Green glow orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-80px] left-[15%] w-[520px] h-[520px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(134,188,36,0.12) 0%, transparent 70%)' }} />
            <div className="absolute top-[60px] right-[10%] w-[380px] h-[380px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(102,181,57,0.08) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(134,188,36,0.06) 0%, transparent 70%)' }} />
          </div>

          {/* Fade to page background at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--color-background)))' }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

              {/* Left: text */}
              <div className="flex-1 max-w-2xl">
                {/* Brand badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border text-xs font-semibold"
                     style={{ background: 'rgba(134,188,36,0.08)', borderColor: 'rgba(134,188,36,0.25)', color: '#86bc24' }}>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Priya LifePDF · Ireland's Pharma PDF Toolkit
                </div>

                <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight mb-5 leading-tight text-white">
                  Private PDF Toolkit{' '}
                  <span style={{ color: '#86bc24' }}>for Pharma</span>
                  <br className="hidden md:block" />{' '}
                  &amp; Life Science
                </h1>

                <p className="text-base lg:text-lg mb-8 leading-relaxed max-w-xl" style={{ color: '#8fa3a8' }}>
                  Process batch records, SOPs, validation protocols and regulatory
                  submissions without sending a single file to any server.
                  90+ professional tools. 100% private. Built for Irish pharma.
                </p>

                {/* Compliance chips */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {[
                    { icon: Lock, label: 'Files never leave your device' },
                    { icon: MapPin, label: 'Operated from Ireland' },
                    { icon: ShieldCheck, label: 'EU GMP · GDPR · HPRA' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                         style={{ background: 'rgba(134,188,36,0.1)', border: '1px solid rgba(134,188,36,0.2)', color: '#a8d45c' }}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/${locale}/tools`}>
                    <Button variant="primary" size="lg" className="h-11 px-8 text-base shadow-xl transition-all hover:-translate-y-0.5"
                            style={{ background: '#86bc24', borderColor: '#86bc24', color: '#0d1317', fontWeight: 700 }}>
                      {t('home.hero.cta')}
                      <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href={`/${locale}/tools/gmp-stamp`}>
                    <Button variant="outline" size="lg" className="h-11 px-6 text-sm transition-all hover:-translate-y-0.5"
                            style={{ borderColor: 'rgba(134,188,36,0.35)', color: '#86bc24', background: 'transparent' }}>
                      <FlaskConical className="mr-2 h-4 w-4" />
                      GMP Stamp Tool
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: premium stat/compliance panel */}
              <div className="lg:flex-shrink-0 lg:w-80 xl:w-96">
                <div className="rounded-2xl p-1" style={{ background: 'linear-gradient(135deg, rgba(134,188,36,0.3), rgba(134,188,36,0.05) 60%, rgba(21,27,31,0) 100%)' }}>
                  <div className="rounded-2xl p-6 space-y-4" style={{ background: '#111a14', border: '1px solid rgba(134,188,36,0.15)' }}>
                    {/* Panel header */}
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5" style={{ color: '#86bc24' }} />
                      <span className="text-sm font-bold text-white tracking-wide">Compliance Overview</span>
                      <span className="ml-auto flex h-2 w-2 rounded-full" style={{ background: '#86bc24', boxShadow: '0 0 6px #86bc24' }} />
                    </div>

                    {/* Stat rows */}
                    {[
                      { label: 'PDF Tools Available', value: '90+', accent: true },
                      { label: 'File Uploads to Server', value: '0', accent: false },
                      { label: 'Languages Supported', value: '9', accent: false },
                      { label: 'GMP Stamp Presets', value: '10', accent: false },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'rgba(134,188,36,0.1)' }}>
                        <span className="text-xs" style={{ color: '#8fa3a8' }}>{label}</span>
                        <span className="text-lg font-bold" style={{ color: accent ? '#86bc24' : '#e2f0c4' }}>{value}</span>
                      </div>
                    ))}

                    {/* Regulatory badges */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {['EU GMP Annex 1', 'GDPR Art. 25', 'HPRA', 'FDA 21 CFR', 'ICH Q10'].map(b => (
                        <span key={b} className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                              style={{ background: 'rgba(134,188,36,0.12)', color: '#86bc24', border: '1px solid rgba(134,188,36,0.2)' }}>
                          {b}
                        </span>
                      ))}
                    </div>

                    <Link href={`/${locale}/tools/gmp-stamp`} className="block mt-2">
                      <div className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-90"
                           style={{ background: '#86bc24', color: '#0d1317' }}>
                        Open GMP Stamp Tool <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Running Ticker Banner (dark→light boundary) ── */}
        <div className="relative overflow-hidden select-none" style={{ background: '#0a0f0d', borderTop: '1px solid rgba(134,188,36,0.18)', borderBottom: '1px solid rgba(134,188,36,0.10)' }} aria-hidden="true">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes lifepdf-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .lifepdf-ticker-track { display:flex; align-items:center; white-space:nowrap; animation: lifepdf-ticker 55s linear infinite; will-change:transform; }
            .lifepdf-ticker-track:hover { animation-play-state:paused; }
            .lifepdf-ticker-fade-l { position:absolute; top:0; bottom:0; left:0; width:80px; background:linear-gradient(to right,#0a0f0d 30%,transparent); pointer-events:none; z-index:2; }
            .lifepdf-ticker-fade-r { position:absolute; top:0; bottom:0; right:0; width:80px; background:linear-gradient(to left,#0a0f0d 30%,transparent); pointer-events:none; z-index:2; }
            .lti { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.62); letter-spacing:.07em; text-transform:uppercase; padding:0 20px; white-space:nowrap; }
            .lti svg { color:#86bc24; flex-shrink:0; }
            .lti .hl { color:#86bc24; }
            .lti-dot { display:inline-block; width:3px; height:3px; border-radius:50%; background:rgba(134,188,36,0.45); flex-shrink:0; margin:0 4px; }
          `}} />
          <div className="lifepdf-ticker-fade-l" />
          <div className="lifepdf-ticker-fade-r" />
          <div style={{ padding: '11px 0' }}>
            <div className="lifepdf-ticker-track">
              {[0, 1].map(i => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span className="hl">Files Never Leave Your Device</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>100% Free · No Account Needed</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span className="hl">🇮🇪 Built &amp; Operated from Ireland</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>EU GMP Annex 1 · FDA 21 CFR Part 11</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>GDPR Article 25 · Privacy by Design</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span className="hl">90+ PDF Tools for Pharma &amp; Life Science</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>HPRA Governed · Irish Data Protection Act 2018</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span className="hl">Client-Side WASM Processing Only</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Zero Data Upload · Zero Server Contact</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span className="hl">GMP Stamps</span> · APPROVED · DRAFT · CONTROLLED COPY · SUPERSEDED</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>Compress · Merge · Split · Sign · Watermark · OCR · Redact</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span className="hl">ICH Q10 · ISO 13485</span> · Pharma Quality Standards</span><span className="lti-dot"/>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Featured: Pharma GMP Stamp Tool */}
        <section className="py-10 relative z-20" aria-labelledby="featured-gmp-heading">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100 p-8 shadow-md dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-green-950/20 dark:border-emerald-800/60">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800/60 dark:text-emerald-400 mb-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Featured Pharma Tool
                  </div>
                  <h2 id="featured-gmp-heading" className="text-2xl lg:text-3xl font-bold text-[hsl(var(--color-foreground))] mb-3">
                    Pharma GMP Document Stamp Tool
                  </h2>
                  <p className="text-[hsl(var(--color-muted-foreground))] mb-5 max-w-xl leading-relaxed">
                    Apply <strong className="text-[hsl(var(--color-foreground))]">APPROVED, DRAFT, SUPERSEDED, CONTROLLED COPY</strong> and 7 other GMP-compliant status stamps to any pharmaceutical PDF. Drag, position, and save — entirely in your browser. Built for Irish pharma and life science teams.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Files never leave your device
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <FlaskConical className="h-3.5 w-3.5" /> EU GMP Annex 1 compliant
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <FileCheck2 className="h-3.5 w-3.5" /> GDPR Article 25 · HPRA governed
                    </div>
                  </div>
                  <Link href={`/${locale}/tools/gmp-stamp`}>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5">
                      Open GMP Stamp Tool
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
                <div className="lg:flex-shrink-0 lg:w-72">
                  <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm dark:bg-slate-900/90 dark:border-emerald-800/60 space-y-2.5">
                    {[
                      { text: 'APPROVED', color: 'text-emerald-600 border-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/80 dark:bg-emerald-950/30' },
                      { text: 'CONTROLLED COPY', color: 'text-emerald-600 border-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800/80 dark:bg-emerald-950/30' },
                      { text: 'DRAFT', color: 'text-red-600 border-red-500 bg-red-50 dark:text-red-400 dark:border-red-800/80 dark:bg-red-950/30' },
                      { text: 'SUPERSEDED', color: 'text-red-600 border-red-500 bg-red-50 dark:text-red-400 dark:border-red-800/80 dark:bg-red-950/30' },
                      { text: 'CONFIDENTIAL', color: 'text-red-600 border-red-500 bg-red-50 dark:text-red-400 dark:border-red-800/80 dark:bg-red-950/30' },
                    ].map((s) => (
                      <div key={s.text} className={`flex items-center justify-center rounded-md border-2 py-2 text-xs font-bold tracking-widest uppercase ${s.color}`}>
                        {s.text}
                      </div>
                    ))}
                    <p className="pt-1.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-200">10 GMP stamp presets · Draggable · Adjustable opacity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 relative z-20" aria-label="Features">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 text-center glass-card border-0 hover:-translate-y-1 transition-transform duration-300" hover={false}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--color-primary)/0.1)] mb-4 text-[hsl(var(--color-primary))]">
                      <Icon className={`h-6 w-6 ${feature.color}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-[hsl(var(--color-foreground))] mb-2">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-sm text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                      {t(feature.descriptionKey)}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Tools Section */}
        <section className="py-16 bg-[hsl(var(--color-muted)/0.5)]" aria-labelledby="popular-tools-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[hsl(var(--color-primary)/0.1)] border border-[hsl(var(--color-primary)/0.2)]">
                <Star className="h-4 w-4 text-[hsl(var(--color-primary))]" aria-hidden="true" />
                <span className="text-sm font-medium text-[hsl(var(--color-primary))]">
                  {t('home.popularTools.badge')}
                </span>
              </div>
              <h2 id="popular-tools-heading" className="text-3xl font-bold text-[hsl(var(--color-foreground))] mb-3">
                {t('home.popularTools.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] max-w-2xl mx-auto text-base">
                {t('home.popularTools.description')}
              </p>
            </div>
            <ToolGrid
              tools={popularTools}
              locale={locale}
              localizedToolContent={localizedToolContent}
            />
          </div>
        </section>

        <section className="py-16" aria-labelledby="featured-tools-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div className="max-w-2xl">
                <h2 id="featured-tools-heading" className="text-2xl font-bold text-[hsl(var(--color-foreground))] mb-2">
                  {t(`home.categories.${categoryTranslationKeys['organize-manage']}`)}
                </h2>
                <p className="text-[hsl(var(--color-muted-foreground))] text-base">
                  {t(`home.categoriesDescription.${categoryTranslationKeys['organize-manage']}`)}
                </p>
              </div>
              <Link href={`/${locale}/tools`}>
                <Button variant="outline" size="sm" className="group">
                  {t('common.navigation.tools')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
            </div>
            <ToolGrid
              tools={getToolsByCategory('organize-manage').slice(0, 8)}
              locale={locale}
              localizedToolContent={localizedToolContent}
            />
          </div>
        </section>

        {/* Tool Categories Section */}
        <section className="py-16 bg-[hsl(var(--color-muted)/0.3)]" aria-labelledby="categories-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="text-3xl font-bold text-[hsl(var(--color-foreground))] mb-3">
                {t('home.categoriesSection.title')}
              </h2>
              <p className="text-[hsl(var(--color-muted-foreground))] max-w-2xl mx-auto text-base">
                {t('home.categoriesSection.description', { count: allTools.length })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryOrder.map((category) => {
                const categoryTools = getToolsByCategory(category);
                const Icon = categoryIcons[category];
                const categoryName = t(`home.categories.${categoryTranslationKeys[category]}`);
                const categoryDescription = t(`home.categoriesDescription.${categoryTranslationKeys[category]}`);

                return (
                  <Link
                    key={category}
                    href={`/${locale}/tools?category=${category}`}
                    className="group"
                  >
                    <Card className="p-5 h-full glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-[hsl(var(--color-border)/0.6)]">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--color-primary)/0.1)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-5 w-5 text-[hsl(var(--color-primary))]" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-[hsl(var(--color-foreground))] mb-1 group-hover:text-[hsl(var(--color-primary))] transition-colors">
                            {categoryName}
                          </h3>
                          <p className="text-xs text-[hsl(var(--color-muted-foreground))] line-clamp-2 mb-2">
                            {categoryDescription}
                          </p>
                          <div className="flex items-center text-xs font-medium text-[hsl(var(--color-primary))]">
                            <span className="bg-[hsl(var(--color-primary)/0.1)] px-2 py-0.5 rounded-md">
                              {t('home.categoriesSection.toolsCount', { count: categoryTools.length })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16" aria-label="Statistics">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[hsl(var(--color-border))]">
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-gradient mb-1">
                  {allTools.length}+
                </div>
                <div className="text-xs font-medium text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider">
                  {t('home.stats.pdfTools')}
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-gradient mb-1">
                  100%
                </div>
                <div className="text-xs font-medium text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider">
                  {t('home.stats.freeToUse')}
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-gradient mb-1">
                  9
                </div>
                <div className="text-xs font-medium text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider">
                  {t('home.stats.languages')}
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl lg:text-4xl font-bold text-gradient mb-1">
                  0
                </div>
                <div className="text-xs font-medium text-[hsl(var(--color-muted-foreground))] uppercase tracking-wider">
                  {t('home.stats.filesUploaded')}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
