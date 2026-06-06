'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Zap, Wrench, Sparkles, Edit, FileImage,
  FolderOpen, Settings, ShieldCheck, Star, FlaskConical,
  FileCheck2, Lock, MapPin,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { getAllTools, getToolsByCategory, getPopularTools } from '@/config/tools';
import { type Locale } from '@/lib/i18n/config';
import { type ToolCategory } from '@/types/tool';

interface HomePageClientProps {
  locale: Locale;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

// ── Animated count-up ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      const s = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - s) / duration, 1);
        setCount(Math.round((1 - (1 - p) ** 3) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function StatItem({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center px-4 py-8 hp-stat-item">
      <div className="text-4xl lg:text-5xl font-black mb-1.5" style={{ color: '#86bc24', fontVariantNumeric: 'tabular-nums' }}>
        {count}{suffix}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5a7a7e' }}>{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const t = useTranslations();
  const allTools = getAllTools();
  const popularTools = getPopularTools();

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

  const categoryOrder: ToolCategory[] = [
    'edit-annotate', 'convert-to-pdf', 'convert-from-pdf',
    'organize-manage', 'optimize-repair', 'secure-pdf',
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1317', color: '#e8edf0' }}>

      {/* ── All keyframes + utility classes ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hpmarquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes lifepdf-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes hp-fade-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hp-fade-right{ from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes hp-orb-pulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.1);opacity:1} }
        @keyframes hp-orb-drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-14px)} }
        @keyframes hp-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes hp-dot-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes hp-shimmer   { 0%{transform:translateX(-150%)} 100%{transform:translateX(250%)} }
        @keyframes hp-bar-fill  { from{width:0} to{width:var(--bar-w)} }

        .hp-badge  { animation: hp-fade-up  .5s ease both; }
        .hp-h1     { animation: hp-fade-up  .6s ease .08s both; }
        .hp-sub    { animation: hp-fade-up  .6s ease .16s both; }
        .hp-chips  { animation: hp-fade-up  .6s ease .24s both; }
        .hp-ctas   { animation: hp-fade-up  .6s ease .32s both; }
        .hp-panel  { animation: hp-fade-right .75s ease .1s both; }
        .hp-pfloat { animation: hp-float 5.5s ease-in-out infinite; }
        .hp-orb1   { animation: hp-orb-pulse 6s ease-in-out infinite, hp-orb-drift 11s ease-in-out infinite; }
        .hp-orb2   { animation: hp-orb-pulse 8s ease-in-out 2s infinite; }
        .hp-orb3   { animation: hp-orb-pulse 7s ease-in-out 4s infinite; }
        .hp-dot    { animation: hp-dot-blink 2.2s ease-in-out infinite; }

        .hp-btn-solid {
          display:inline-flex; align-items:center; gap:8px;
          border-radius:12px; padding:12px 28px; font-size:15px; font-weight:700; cursor:pointer;
          background:#86bc24; color:#0a0f0b;
          box-shadow:0 4px 24px rgba(134,188,36,.32);
          transition:transform .18s ease, box-shadow .18s ease;
          border:none;
        }
        .hp-btn-solid:hover { transform:translateY(-2px); box-shadow:0 8px 36px rgba(134,188,36,.45); }

        .hp-btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          border-radius:12px; padding:12px 22px; font-size:14px; font-weight:600; cursor:pointer;
          background:rgba(134,188,36,.06); color:#86bc24;
          border:1px solid rgba(134,188,36,.28);
          transition:transform .18s ease, background .18s ease;
        }
        .hp-btn-outline:hover { transform:translateY(-2px); background:rgba(134,188,36,.12); }

        .hp-card {
          transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .hp-card:hover {
          transform:translateY(-3px);
          box-shadow:0 8px 32px rgba(134,188,36,.12);
          border-color:rgba(134,188,36,.35) !important;
        }

        .hp-cat-icon { transition:transform .2s ease; }
        .hp-card:hover .hp-cat-icon { transform:scale(1.1); }
        .hp-cat-title { transition:color .15s ease; }
        .hp-card:hover .hp-cat-title { color:#86bc24 !important; }

        .hp-shimmer-wrap { position:relative; overflow:hidden; }
        .hp-shimmer-wrap::after {
          content:'';
          position:absolute; top:0; left:0; right:0; bottom:0;
          background:linear-gradient(90deg,transparent,rgba(134,188,36,.04),transparent);
          animation:hp-shimmer 4s ease-in-out infinite;
          pointer-events:none;
        }

        .hp-stat-item { transition:background .2s ease; border-radius:12px; }
        .hp-stat-item:hover { background:rgba(134,188,36,.04); }

        .lifepdf-ticker-track { display:flex;align-items:center;white-space:nowrap;animation:lifepdf-ticker 55s linear infinite;will-change:transform; }
        .lifepdf-ticker-track:hover { animation-play-state:paused; }
        .lti { display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.07em;text-transform:uppercase;padding:0 20px;white-space:nowrap; }
        .lti svg { color:#86bc24;flex-shrink:0; }
        .lti .hl { color:#86bc24; }
        .lti-dot { display:inline-block;width:3px;height:3px;border-radius:50%;background:rgba(134,188,36,.4);flex-shrink:0;margin:0 4px; }
        .ltfade-l { position:absolute;top:0;bottom:0;left:0;width:80px;background:linear-gradient(to right,#080c09 30%,transparent);pointer-events:none;z-index:2; }
        .ltfade-r { position:absolute;top:0;bottom:0;right:0;width:80px;background:linear-gradient(to left,#080c09 30%,transparent);pointer-events:none;z-index:2; }

        .hp-stamp-row { transition:transform .15s ease, box-shadow .15s ease; }
        .hp-stamp-row:hover { transform:translateX(4px); }

        .hp-glow-border {
          background: linear-gradient(135deg, rgba(134,188,36,.38), rgba(134,188,36,.05) 60%, rgba(134,188,36,.1));
          padding:1px; border-radius:18px;
        }
        .hp-glow-inner { border-radius:17px; }

        .hp-section-label {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 14px; border-radius:99px; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
          background:rgba(134,188,36,.08); border:1px solid rgba(134,188,36,.18); color:#86bc24;
          margin-bottom:16px;
        }
      `}} />

      <Header locale={locale} />

      {/* ── Top sector ticker (fixed) ── */}
      <div className="fixed top-[72px] left-0 right-0 z-40 overflow-hidden select-none"
           style={{ background: '#111a14', borderBottom: '1px solid rgba(134,188,36,.18)' }}>
        <div className="flex whitespace-nowrap animate-[hpmarquee_40s_linear_infinite] py-[9px] gap-10 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#86bc24' }}>
          {[0,1].map(i => (
            <div key={i} className="flex gap-10 items-center" aria-hidden={i === 1 ? 'true' : undefined}>
              <span>🧬 Pharma</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>🔬 Biotech &amp; MedTech</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>🏥 Health</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>🇮🇪 Life Science Ireland</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>📄 PDF Editor for Life Science</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>🛡️ GDPR · No File Upload</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
              <span>✅ EU GMP Annex 1 · HPRA</span><span style={{color:'rgba(134,188,36,.3)'}}>◆</span>
            </div>
          ))}
        </div>
      </div>

      <main id="main-content" className="flex-1" tabIndex={-1} style={{ paddingTop: '108px' }}>

        {/* ════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden pb-28 lg:pb-36 pt-14 lg:pt-20"
          style={{ background: 'linear-gradient(160deg,#090e0b 0%,#0d1317 42%,#0e1910 100%)' }}
          aria-labelledby="hero-title"
        >
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(134,188,36,.055) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />

          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="hp-orb1 absolute top-[-100px] left-[10%] w-[580px] h-[580px] rounded-full"
                 style={{ background: 'radial-gradient(circle,rgba(134,188,36,.13) 0%,transparent 65%)' }} />
            <div className="hp-orb2 absolute top-[80px] right-[6%] w-[380px] h-[380px] rounded-full"
                 style={{ background: 'radial-gradient(circle,rgba(102,181,57,.09) 0%,transparent 65%)' }} />
            <div className="hp-orb3 absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[800px] h-[260px] rounded-full"
                 style={{ background: 'radial-gradient(ellipse,rgba(134,188,36,.07) 0%,transparent 70%)' }} />
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
               style={{ background: 'linear-gradient(to bottom,transparent,#0d1317)' }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-20">

              {/* Left */}
              <div className="flex-1 max-w-2xl">
                <div className="hp-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
                     style={{ background:'rgba(134,188,36,.08)', border:'1px solid rgba(134,188,36,.22)', color:'#86bc24' }}>
                  <span className="hp-dot h-1.5 w-1.5 rounded-full inline-block" style={{ background:'#86bc24' }} />
                  Priya LifePDF · Ireland's Pharma PDF Toolkit
                </div>

                <h1 id="hero-title"
                    className="hp-h1 text-[2.6rem] md:text-5xl lg:text-[3.6rem] font-black tracking-tight leading-[1.06] mt-5 mb-5"
                    style={{ color:'#f0f4e8' }}>
                  Private PDF Toolkit{' '}
                  <span style={{ color:'#86bc24' }}>for Pharma</span>
                  <br className="hidden md:block" />
                  {' '}&amp; Life Science
                </h1>

                <p className="hp-sub text-base lg:text-lg mb-8 leading-relaxed max-w-xl" style={{ color:'#7a9a9e' }}>
                  Process batch records, SOPs, validation protocols and regulatory
                  submissions without sending a single file to any server.{' '}
                  <span style={{ color:'#a8c890' }}>90+ professional tools. 100% private.</span>
                </p>

                <div className="hp-chips flex flex-wrap gap-2 mb-8">
                  {[
                    { icon: Lock,        label:'Files never leave your device' },
                    { icon: MapPin,      label:'Operated from Ireland' },
                    { icon: ShieldCheck, label:'EU GMP · GDPR · HPRA' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label}
                         className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                         style={{ background:'rgba(134,188,36,.08)', border:'1px solid rgba(134,188,36,.17)', color:'#a8d45c' }}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>

                <div className="hp-ctas flex flex-col sm:flex-row gap-3">
                  <Link href={`/${locale}/tools`}>
                    <button className="hp-btn-solid">
                      {t('home.hero.cta')}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link href={`/${locale}/tools/gmp-stamp`}>
                    <button className="hp-btn-outline">
                      <FlaskConical className="h-4 w-4" />
                      GMP Stamp Tool
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right: compliance panel */}
              <div className="hp-panel lg:flex-shrink-0 lg:w-80 xl:w-[360px]">
                <div className="hp-pfloat hp-glow-border">
                  <div className="hp-glow-inner p-6 space-y-3"
                       style={{ background:'#0e1910' }}>

                    <div className="flex items-center gap-2 pb-3 mb-1"
                         style={{ borderBottom:'1px solid rgba(134,188,36,.1)' }}>
                      <ShieldCheck className="h-5 w-5" style={{ color:'#86bc24' }} />
                      <span className="text-sm font-black tracking-wide" style={{ color:'#e8edf0' }}>Compliance Overview</span>
                      <span className="hp-dot ml-auto h-2 w-2 rounded-full"
                            style={{ background:'#86bc24', boxShadow:'0 0 8px #86bc24' }} />
                    </div>

                    {[
                      { label:'PDF Tools Available',    value:'90+', accent:true  },
                      { label:'File Uploads to Server', value:'0',   accent:false },
                      { label:'Languages Supported',    value:'9',   accent:false },
                      { label:'GMP Stamp Presets',      value:'10',  accent:false },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="flex items-center justify-between py-2.5"
                           style={{ borderBottom:'1px solid rgba(134,188,36,.07)' }}>
                        <span className="text-xs" style={{ color:'#5a7a7e' }}>{label}</span>
                        <span className="text-xl font-black"
                              style={{ color: accent ? '#86bc24' : '#c8ddb0' }}>{value}</span>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {['EU GMP Annex 1','GDPR Art. 25','HPRA','FDA 21 CFR','ICH Q10'].map(b => (
                        <span key={b}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
                              style={{ background:'rgba(134,188,36,.1)', color:'#86bc24', border:'1px solid rgba(134,188,36,.2)' }}>
                          {b}
                        </span>
                      ))}
                    </div>

                    <Link href={`/${locale}/tools/gmp-stamp`} className="block pt-1">
                      <button className="hp-btn-solid w-full justify-center" style={{ width:'100%' }}>
                        Open GMP Stamp Tool <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            HIGHLIGHTS TICKER
        ════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden select-none"
             style={{ background:'#080c09', borderTop:'1px solid rgba(134,188,36,.14)', borderBottom:'1px solid rgba(134,188,36,.08)' }}
             aria-hidden="true">
          <div className="ltfade-l" />
          <div className="ltfade-r" />
          <div style={{ padding:'10px 0' }}>
            <div className="lifepdf-ticker-track">
              {[0,1].map(i => (
                <span key={i} style={{ display:'inline-flex', alignItems:'center' }}>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span className="hl">Files Never Leave Your Device</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>100% Free · No Account Needed</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span className="hl">🇮🇪 Built &amp; Operated from Ireland</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>EU GMP Annex 1 · FDA 21 CFR Part 11</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>GDPR Article 25 · Privacy by Design</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span className="hl">90+ PDF Tools for Pharma &amp; Life Science</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span className="hl">Client-Side WASM Processing Only</span></span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Zero Data Upload · Zero Server Contact</span><span className="lti-dot"/>
                  <span className="lti"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span className="hl">GMP Stamps</span> · APPROVED · DRAFT · CONTROLLED COPY</span><span className="lti-dot"/>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            ANIMATED STATS
        ════════════════════════════════════════════════ */}
        <section style={{ background:'#0d1317', borderBottom:'1px solid rgba(134,188,36,.07)' }} aria-label="Statistics">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { value: allTools.length, suffix:'+', label: t('home.stats.pdfTools') },
                { value: 100,  suffix:'%', label: t('home.stats.freeToUse') },
                { value: 9,    suffix:'',  label: t('home.stats.languages') },
                { value: 0,    suffix:'',  label: t('home.stats.filesUploaded') },
              ].map(({ value, suffix, label }, i) => (
                <div key={label} style={{ borderLeft: i > 0 ? '1px solid rgba(134,188,36,.08)' : 'none' }}>
                  <StatItem value={value} suffix={suffix} label={label} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            FEATURED GMP TOOL
        ════════════════════════════════════════════════ */}
        <section className="py-16" style={{ background:'#0a0f0d' }} aria-labelledby="featured-gmp-heading">
          <div className="container mx-auto px-4">
            <div className="hp-glow-border hp-shimmer-wrap">
              <div className="hp-glow-inner p-8 lg:p-10"
                   style={{ background:'linear-gradient(135deg,#0e1910 0%,#0d1317 55%,#0e1910 100%)' }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-10">

                  <div className="flex-1">
                    <div className="hp-section-label">
                      <span className="hp-dot h-1.5 w-1.5 rounded-full" style={{ background:'#86bc24' }} />
                      Featured Pharma Tool
                    </div>
                    <h2 id="featured-gmp-heading"
                        className="text-2xl lg:text-[2rem] font-black mb-3 leading-tight"
                        style={{ color:'#f0f4e8' }}>
                      Pharma GMP Document Stamp Tool
                    </h2>
                    <p className="mb-5 max-w-xl leading-relaxed text-sm lg:text-base" style={{ color:'#7a9a9e' }}>
                      Apply{' '}
                      <span style={{ color:'#a8d45c', fontWeight:700 }}>APPROVED, DRAFT, SUPERSEDED, CONTROLLED COPY</span>
                      {' '}and 7 other GMP-compliant status stamps to any pharmaceutical PDF.
                      Drag, position, resize and save — entirely in your browser.
                    </p>
                    <div className="flex flex-wrap gap-5 mb-7">
                      {[
                        { icon: ShieldCheck, label:'Files never leave your device' },
                        { icon: FlaskConical,label:'EU GMP Annex 1 compliant'     },
                        { icon: FileCheck2,  label:'GDPR Art. 25 · HPRA'          },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:'#86bc24' }}>
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </div>
                      ))}
                    </div>
                    <Link href={`/${locale}/tools/gmp-stamp`}>
                      <button className="hp-btn-solid">
                        Open GMP Stamp Tool <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>

                  <div className="lg:flex-shrink-0 lg:w-60 space-y-2">
                    {[
                      { text:'APPROVED',        c:'#86bc24', bg:'rgba(134,188,36,.08)', bd:'rgba(134,188,36,.3)'  },
                      { text:'CONTROLLED COPY', c:'#86bc24', bg:'rgba(134,188,36,.08)', bd:'rgba(134,188,36,.3)'  },
                      { text:'DRAFT',           c:'#f87171', bg:'rgba(248,113,113,.08)', bd:'rgba(248,113,113,.3)'},
                      { text:'SUPERSEDED',      c:'#f87171', bg:'rgba(248,113,113,.08)', bd:'rgba(248,113,113,.3)'},
                      { text:'CONFIDENTIAL',    c:'#f87171', bg:'rgba(248,113,113,.08)', bd:'rgba(248,113,113,.3)'},
                    ].map(s => (
                      <div key={s.text}
                           className="hp-stamp-row flex items-center justify-center rounded-lg py-2 text-xs font-black tracking-widest uppercase"
                           style={{ color:s.c, background:s.bg, border:`1.5px solid ${s.bd}` }}>
                        {s.text}
                      </div>
                    ))}
                    <p className="pt-1 text-center text-[11px] font-semibold" style={{ color:'#4a6a6e' }}>
                      10 GMP presets · Draggable · Resizable
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            WHY CHOOSE — 3 FEATURES
        ════════════════════════════════════════════════ */}
        <section className="py-16" style={{ background:'#0d1317' }} aria-label="Features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="hp-section-label mx-auto" style={{ display:'inline-flex' }}>
                <Sparkles className="h-3.5 w-3.5" />
                Why Priya LifePDF
              </div>
              <h2 className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#f0f4e8' }}>
                Built for Pharma &amp; Life Science Professionals
              </h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color:'#5a7a7e' }}>
                Every feature designed around GMP compliance, data privacy, and regulatory requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: ShieldCheck, color:'#86bc24', bg:'rgba(134,188,36,.1)', bd:'rgba(134,188,36,.2)',
                  title: t('home.features.privacy.title'),
                  desc:  t('home.features.privacy.description') },
                { icon: Zap,        color:'#f0c040', bg:'rgba(240,192,64,.1)',  bd:'rgba(240,192,64,.2)',
                  title: t('home.features.free.title'),
                  desc:  t('home.features.free.description') },
                { icon: Wrench,     color:'#60a8f0', bg:'rgba(96,168,240,.1)',  bd:'rgba(96,168,240,.2)',
                  title: t('home.features.powerful.title'),
                  desc:  t('home.features.powerful.description') },
              ].map(({ icon: Icon, color, bg, bd, title, desc }, idx) => (
                <div key={title}
                     className="hp-card rounded-2xl p-7 flex flex-col items-center text-center"
                     style={{ background:'#0e1910', border:'1px solid rgba(134,188,36,.1)', animationDelay:`${idx*.1}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                       style={{ background:bg, border:`1px solid ${bd}` }}>
                    <Icon className="h-7 w-7" style={{ color }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color:'#e8edf0' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:'#5a7a7e' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            POPULAR TOOLS
        ════════════════════════════════════════════════ */}
        <section className="py-16" style={{ background:'#0a0f0d' }} aria-labelledby="popular-tools-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="hp-section-label mx-auto" style={{ display:'inline-flex' }}>
                <Star className="h-3.5 w-3.5" />
                {t('home.popularTools.badge')}
              </div>
              <h2 id="popular-tools-heading" className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#f0f4e8' }}>
                {t('home.popularTools.title')}
              </h2>
              <p className="text-sm max-w-2xl mx-auto" style={{ color:'#5a7a7e' }}>
                {t('home.popularTools.description')}
              </p>
            </div>
            <ToolGrid tools={popularTools} locale={locale} localizedToolContent={localizedToolContent} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            ORGANIZE & MANAGE TOOLS
        ════════════════════════════════════════════════ */}
        <section className="py-16" style={{ background:'#0d1317' }} aria-labelledby="featured-tools-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 id="featured-tools-heading" className="text-2xl font-black mb-1.5" style={{ color:'#f0f4e8' }}>
                  {t(`home.categories.${categoryTranslationKeys['organize-manage']}`)}
                </h2>
                <p className="text-sm" style={{ color:'#5a7a7e' }}>
                  {t(`home.categoriesDescription.${categoryTranslationKeys['organize-manage']}`)}
                </p>
              </div>
              <Link href={`/${locale}/tools`}>
                <button className="hp-btn-outline" style={{ padding:'8px 18px', fontSize:'13px' }}>
                  {t('common.navigation.tools')} <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <ToolGrid
              tools={getToolsByCategory('organize-manage').slice(0, 8)}
              locale={locale}
              localizedToolContent={localizedToolContent}
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            TOOL CATEGORIES
        ════════════════════════════════════════════════ */}
        <section className="py-16" style={{ background:'#0a0f0d' }} aria-labelledby="categories-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#f0f4e8' }}>
                {t('home.categoriesSection.title')}
              </h2>
              <p className="text-sm max-w-2xl mx-auto" style={{ color:'#5a7a7e' }}>
                {t('home.categoriesSection.description', { count: allTools.length })}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryOrder.map((category, idx) => {
                const tools = getToolsByCategory(category);
                const Icon = categoryIcons[category];
                const name = t(`home.categories.${categoryTranslationKeys[category]}`);
                const desc = t(`home.categoriesDescription.${categoryTranslationKeys[category]}`);
                return (
                  <Link key={category} href={`/${locale}/tools?category=${category}`} className="group block">
                    <div className="hp-card rounded-2xl p-5 h-full flex items-start gap-4"
                         style={{ background:'#0e1910', border:'1px solid rgba(134,188,36,.1)' }}>
                      <div className="hp-cat-icon flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                           style={{ background:'rgba(134,188,36,.1)', border:'1px solid rgba(134,188,36,.18)' }}>
                        <Icon className="h-5 w-5" style={{ color:'#86bc24' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="hp-cat-title font-bold text-sm mb-1" style={{ color:'#e8edf0' }}>{name}</h3>
                        <p className="text-xs line-clamp-2 mb-2.5" style={{ color:'#4a6a6e' }}>{desc}</p>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                              style={{ background:'rgba(134,188,36,.08)', color:'#86bc24' }}>
                          {t('home.categoriesSection.toolsCount', { count: tools.length })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            BOTTOM CTA BANNER
        ════════════════════════════════════════════════ */}
        <section className="py-20 relative overflow-hidden"
                 style={{ background:'linear-gradient(135deg,#0e1910 0%,#0d1317 50%,#0e1910 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage:'radial-gradient(circle,rgba(134,188,36,.05) 1px,transparent 1px)',
            backgroundSize:'26px 26px',
          }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse,rgba(134,188,36,.09) 0%,transparent 70%)' }} />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="hp-section-label mx-auto mb-6" style={{ display:'inline-flex' }}>
              <Sparkles className="h-3.5 w-3.5" />
              100% Free · No Registration · No File Upload
            </div>
            <h2 className="text-3xl lg:text-[2.6rem] font-black mb-4 leading-tight" style={{ color:'#f0f4e8' }}>
              Start Processing PDFs Privately Today
            </h2>
            <p className="text-base max-w-lg mx-auto mb-8" style={{ color:'#5a7a7e' }}>
              Trusted by pharma and life science teams across Ireland and the EU
              for secure, browser-based PDF processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${locale}/tools`}>
                <button className="hp-btn-solid" style={{ fontSize:'16px', padding:'14px 34px' }}>
                  Explore All {allTools.length}+ Tools <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href={`/${locale}/tools/gmp-stamp`}>
                <button className="hp-btn-outline" style={{ fontSize:'14px', padding:'14px 24px' }}>
                  <FlaskConical className="h-4 w-4" />
                  Try GMP Stamp Tool
                </button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
