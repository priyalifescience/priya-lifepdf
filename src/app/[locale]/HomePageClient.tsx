'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Zap, Wrench, Sparkles, Edit, FileImage,
  FolderOpen, Settings, ShieldCheck, Star, FlaskConical,
  FileCheck2, Lock, MapPin, Layers,
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
      <div className="text-4xl lg:text-5xl font-black mb-1.5" style={{ color: '#2e7d1a', fontVariantNumeric: 'tabular-nums' }}>
        {count}{suffix}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>{label}</div>
    </div>
  );
}

export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const t = useTranslations();
  const allTools = getAllTools();
  const popularTools = getPopularTools();

  // --- Canvas particle system hook ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }> = [];

    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw lines & particles
      ctx.strokeStyle = 'rgba(46, 125, 26, 0.04)';
      ctx.fillStyle = 'rgba(46, 125, 26, 0.12)';

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.lineWidth = (1 - dist / 120) * 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (mouse.x > -500) {
          const distToMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (distToMouse < 180) {
            ctx.lineWidth = (1 - distToMouse / 180) * 1.2;
            ctx.strokeStyle = 'rgba(46, 125, 26, 0.09)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(46, 125, 26, 0.04)';
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- Slider and Tab State Management ---
  const [activeTab, setActiveTab] = useState<'workflow' | 'compliance'>('workflow');
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scrolling slide deck and progress bar logic
  useEffect(() => {
    if (activeTab !== 'workflow' || isPaused) return;

    const intervalTime = 4500; // 4.5 seconds per slide
    const updateInterval = 45; // update progress bar every 45ms
    const step = (updateInterval / intervalTime) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((prevIndex) => (prevIndex + 1) % 4);
          return 0;
        }
        return prev + step;
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [activeTab, isPaused]);

  const handleSlideSelect = (index: number) => {
    setActiveSlide(index);
    setSlideProgress(0);
  };

  const workflowSlides = [
    {
      title: '1. Select Local Tool',
      desc: 'Browse and select from 90+ specialized GxP PDF tools. Form logic builders, signature helpers, deskewers, and deep sanitizers ready in one click.',
      badge: 'Choose Utility',
      stepText: 'STEP 1',
      icon: Wrench,
    },
    {
      title: '2. Drag & Drop File',
      desc: 'Your file is loaded directly into the browser tab\'s local secure memory sandbox. Absolutely zero bytes are uploaded or transmitted to any server.',
      badge: 'Local Load',
      stepText: 'STEP 2',
      icon: Lock,
    },
    {
      title: '3. Process & Customize',
      desc: 'Verify signature matrices, dynamic coordinates, or apply approved status marks. All calculations execute instantly at native machine speed.',
      badge: 'GxP Stamping',
      stepText: 'STEP 3',
      icon: ShieldCheck,
    },
    {
      title: '4. Download Export',
      desc: 'Save your verified, fully compliant PDF instantly. Clean pieceInfo, rebuilt cross-reference tables, and fully optimized assets downloaded in milliseconds.',
      badge: 'Lossless Save',
      stepText: 'STEP 4',
      icon: FileCheck2,
    },
  ];

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
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff', color: '#1a2e0f' }}>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hpmarquee     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes lp-ticker     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes hp-fade-up    { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hp-fade-right { from{opacity:0;transform:translateX(15px)} to{opacity:1;transform:translateX(0)} }

        .hp-badge  { animation:hp-fade-up  .4s ease both; }
        .hp-h1     { animation:hp-fade-up  .5s ease .05s both; }
        .hp-sub    { animation:hp-fade-up  .5s ease .1s both; }
        .hp-chips  { animation:hp-fade-up  .5s ease .15s both; }
        .hp-ctas   { animation:hp-fade-up  .5s ease .2s both; }
        .hp-panel  { animation:hp-fade-right .6s ease .1s both; }

        .hp-btn-solid {
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          border-radius:6px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;
          background:#111827;color:#ffffff;border:none;
          transition:background .15s ease,transform .12s ease;
        }
        .hp-btn-solid:hover { background:#1f2937; }
        .hp-btn-solid:active { transform:translateY(1px); }

        .hp-btn-outline {
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          border-radius:6px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;
          background:#f3f4f6;color:#111827;border:1px solid #e5e7eb;
          transition:background .15s ease,transform .12s ease;
        }
        .hp-btn-outline:hover { background:#e5e7eb; }
        .hp-btn-outline:active { transform:translateY(1px); }

        .hp-btn-green {
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          border-radius:6px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;
          background:#2e7d1a;color:#ffffff;border:none;
          transition:background .15s ease,transform .12s ease;
        }
        .hp-btn-green:hover { background:#246314; }
        .hp-btn-green:active { transform:translateY(1px); }

        .hp-card {
          border: 1px solid #e5e7eb;
          transition:border-color .15s ease,box-shadow .15s ease;
        }
        .hp-card:hover {
          border-color:#2e7d1a !important;
          box-shadow: 0 4px 12px rgba(46,125,26,0.06);
        }
        .hp-cat-icon { transition:background .15s ease,transform .15s ease; }
        .hp-card:hover .hp-cat-icon { transform:scale(1.03);background:rgba(46,125,26,.08) !important; }
        .hp-cat-title { transition:color .15s ease; }
        .hp-card:hover .hp-cat-title { color:#2e7d1a !important; }

        .hp-stat-item { transition:background .15s ease;border-radius:8px; }
        .hp-stat-item:hover { background:#f9fafb; }

        .hp-section-label {
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;
          letter-spacing:.06em;text-transform:uppercase;
          background:rgba(46,125,26,.08);border:1px solid rgba(46,125,26,.2);color:#2e7d1a;
          margin-bottom:12px;
        }

        .lp-ticker-track { display:flex;align-items:center;white-space:nowrap;animation:lp-ticker 55s linear infinite;will-change:transform; }
        .lp-ticker-track:hover { animation-play-state:paused; }
        .lti { display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;
               color:rgba(255,255,255,.9);letter-spacing:.07em;text-transform:uppercase;
               padding:0 20px;white-space:nowrap; }
        .lti svg { color:rgba(255,255,255,.75);flex-shrink:0; }
        .lti .hl { color:#ffffff;font-weight:800; }
        .lti-dot { display:inline-block;width:3px;height:3px;border-radius:50%;
                   background:rgba(255,255,255,.4);flex-shrink:0;margin:0 4px; }
        .ltfade-l { position:absolute;top:0;bottom:0;left:0;width:80px;
                    background:linear-gradient(to right,#2e7d1a 30%,transparent);
                    pointer-events:none;z-index:2; }
        .ltfade-r { position:absolute;top:0;bottom:0;right:0;width:80px;
                    background:linear-gradient(to left,#2e7d1a 30%,transparent);
                    pointer-events:none;z-index:2; }
      `}} />

      <Header locale={locale} />

      {/* ── Top sector ticker (fixed) ── */}
      <div className="fixed top-[72px] left-0 right-0 z-40 overflow-hidden select-none"
           style={{ background: '#66B539', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
        <div className="flex whitespace-nowrap animate-[hpmarquee_40s_linear_infinite] py-[8px] gap-10 text-[11px] font-bold tracking-widest uppercase" style={{ color: '#fff' }}>
          {[0,1].map(i => (
            <div key={i} className="flex gap-10 items-center" aria-hidden={i === 1 ? 'true' : undefined}>
              <span>🧬 Pharma</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>🔬 Biotech &amp; MedTech</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>🏥 Health</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>🇮🇪 Life Science Ireland</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>📄 PDF Editor for Life Science</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>🛡️ GDPR · No File Upload</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
              <span>✅ EU GMP Annex 1 · HPRA</span><span style={{color:'rgba(255,255,255,.4)'}}>◆</span>
            </div>
          ))}
        </div>
      </div>

      <main id="main-content" className="flex-1" tabIndex={-1} style={{ paddingTop: '96px' }}>

        {/* ════════════════ HERO ════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.18)', paddingTop:'52px', paddingBottom:'72px' }}
          aria-labelledby="hero-title"
        >
          {/* Background video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
            aria-hidden="true"
          >
            <source src="/images/hero_amine.mp4" type="video/mp4" />
          </video>

          {/* Dark overlay for text legibility */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(10,30,8,0.52) 100%)', zIndex: 1 }}
          />

          <div className="container mx-auto relative" style={{ zIndex: 10, paddingLeft:'clamp(16px,4vw,48px)', paddingRight:'clamp(16px,4vw,48px)' }}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">

              {/* Left */}
              <div className="flex-1 min-w-0">
                <div className="hp-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide mb-5"
                     style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.30)', color:'#ffffff', backdropFilter:'blur(6px)' }}>
                  🧬 Priya LifePDF · Ireland's Pharma PDF Toolkit
                </div>

                <h1 id="hero-title"
                    className="hp-h1 font-black tracking-tight leading-[1.06] mb-5"
                    style={{ color:'#ffffff', fontSize:'clamp(2rem,5vw,3.4rem)', textShadow:'0 2px 16px rgba(0,0,0,0.3)' }}>
                  Private PDF Toolkit{' '}
                  <span style={{ color:'#7fe860' }}>for Pharma</span>
                  <br className="hidden md:block" />
                  {' '}&amp; Life Science
                </h1>

                <p className="hp-sub text-base mb-7 leading-relaxed" style={{ color:'rgba(255,255,255,0.82)', maxWidth:'520px', fontSize:'1.05rem' }}>
                  Process batch records, SOPs, validation protocols and regulatory
                  submissions — without sending a single byte to any server.{' '}
                  <strong style={{ color:'#7fe860', fontWeight:700 }}>90+ professional tools. 100% private.</strong>
                </p>

                <div className="hp-chips flex flex-wrap gap-2 mb-7">
                  {[
                    { icon: Lock,        label:'Files never leave your device' },
                    { icon: MapPin,      label:'Operated from Ireland' },
                    { icon: ShieldCheck, label:'EU GMP · GDPR · HPRA' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label}
                         className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                         style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.9)', backdropFilter:'blur(4px)' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color:'#7fe860' }} />
                      {label}
                    </div>
                  ))}
                </div>

                <div className="hp-ctas flex flex-col sm:flex-row gap-3">
                  <Link href={`/${locale}/tools`}>
                    <button className="hp-btn-solid" style={{ padding:'13px 36px', fontSize:'15px', background:'#2e7d1a' }}>
                      {t('home.hero.cta')}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </Link>
                  <Link href={`/${locale}/tools/gmp-stamp`}>
                    <button className="hp-btn-outline" style={{ padding:'13px 28px', fontSize:'15px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.30)', color:'#ffffff', backdropFilter:'blur(4px)' }}>
                      <FlaskConical className="h-4 w-4" style={{ color:'#7fe860' }} />
                      GMP Stamp Tool
                    </button>
                  </Link>
                </div>

                {/* Social proof strip */}
                <div className="mt-8 pt-7 flex flex-wrap gap-x-6 gap-y-2 items-center" style={{ borderTop:'1px solid rgba(255,255,255,0.15)' }}>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.45)' }}>Trusted for</span>
                  {['EU GMP Annex 1','GDPR Art.25','HPRA','FDA 21 CFR Pt.11','ICH Q10'].map(b => (
                    <span key={b} className="text-xs font-bold" style={{ color:'rgba(255,255,255,0.65)' }}>{b}</span>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Widget (Tabs: Workflow Guide & Compliance Status) */}
              <div className="hp-panel lg:flex-shrink-0 lg:w-[400px] xl:w-[420px]" style={{ zIndex: 10 }}>
                <div className="rounded-2xl border border-slate-200 bg-white"
                     style={{ boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
                  
                  {/* Tab Selector Headers */}
                  <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50 rounded-t-2xl">
                    <button
                      onClick={() => setActiveTab('workflow')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === 'workflow'
                          ? 'bg-white text-[#2e7d1a] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Interactive Workflow
                    </button>
                    <button
                      onClick={() => setActiveTab('compliance')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === 'compliance'
                          ? 'bg-white text-[#2e7d1a] shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Compliance Overview
                    </button>
                  </div>

                  {/* Tab content area */}
                  <div className="p-6 h-[380px] flex flex-col justify-between">
                    
                    {activeTab === 'workflow' ? (
                      // Tab 1: Workflow auto-scroll slides
                      <div
                        className="flex-1 flex flex-col justify-between"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                      >
                        {/* Slide Content */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest text-[#2e7d1a] uppercase bg-emerald-50 px-2.5 py-0.5 rounded">
                              {workflowSlides[activeSlide].stepText}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {isPaused ? 'Paused' : 'Auto-scrolling'}
                            </span>
                          </div>

                          <div className="flex gap-4 items-start">
                            {/* Slide Icon */}
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shrink-0">
                              {(() => {
                                const SlideIcon = workflowSlides[activeSlide].icon;
                                return <SlideIcon className="h-6 w-6 text-[#2e7d1a]" />;
                              })()}
                            </div>
                            
                            <div>
                              <h3 className="text-base font-bold text-slate-800 mb-1.5 transition-all">
                                {workflowSlides[activeSlide].title}
                              </h3>
                              <p className="text-xs text-slate-500 leading-relaxed transition-all">
                                {workflowSlides[activeSlide].desc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress controls and navigation dots */}
                        <div className="space-y-4">
                          {/* Slide Progress Bar */}
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2e7d1a] transition-all duration-75"
                              style={{ width: `${slideProgress}%` }}
                            />
                          </div>

                          {/* Navigation Dots and Action Links */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {workflowSlides.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSlideSelect(idx)}
                                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                    activeSlide === idx ? 'bg-[#2e7d1a] w-5' : 'bg-slate-200 hover:bg-slate-400'
                                  }`}
                                  aria-label={`Go to slide ${idx + 1}`}
                                />
                              ))}
                            </div>
                            
                            <Link href={`/${locale}/tools`} className="text-[11px] font-bold text-[#2e7d1a] hover:underline flex items-center gap-1">
                              Browse All Tools <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                      </div>
                    ) : (
                      // Tab 2: Compliance overview statistics & badges (the original content)
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          {[
                            { label:'PDF Tools Available',    value:'90+', accent:true  },
                            { label:'File Uploads to Server', value:'0',   accent:false },
                            { label:'Languages Supported',    value:'9',   accent:false },
                            { label:'GMP Stamp Presets',      value:'10',  accent:false },
                          ].map(({ label, value, accent }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100">
                              <span className="text-xs text-slate-500">{label}</span>
                              <span className="text-lg font-black"
                                    style={{ color: accent ? '#2e7d1a' : '#111827' }}>{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-1.5">
                            {['EU GMP Annex 1','GDPR Art. 25','HPRA','FDA 21 CFR','ICH Q10'].map(b => (
                              <span key={b}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-slate-50 border border-slate-100 text-slate-600">
                                {b}
                              </span>
                            ))}
                          </div>

                          <Link href={`/${locale}/tools/gmp-stamp`} className="block">
                            <button className="hp-btn-green w-full justify-center">
                              Open GMP Stamp Tool <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════ HIGHLIGHTS TICKER ════════════════ */}
        <div className="relative overflow-hidden select-none"
             style={{ background:'#4a9e2a', borderTop:'1px solid rgba(0,0,0,.06)' }}
             aria-hidden="true">
          <div className="ltfade-l" />
          <div className="ltfade-r" />
          <div style={{ padding:'10px 0' }}>
            <div className="lp-ticker-track">
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

        {/* ════════════════ STATS ════════════════ */}
        <section style={{ background:'#ffffff', borderBottom:'1px solid #e5e7eb' }} aria-label="Statistics">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { value: allTools.length, suffix:'+', label: t('home.stats.pdfTools') },
                { value: 100, suffix:'%', label: t('home.stats.freeToUse') },
                { value: 9,   suffix:'',  label: t('home.stats.languages') },
                { value: 0,   suffix:'',  label: t('home.stats.filesUploaded') },
              ].map(({ value, suffix, label }, i) => (
                <div key={label} style={{ borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <StatItem value={value} suffix={suffix} label={label} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ WASM LOCAL SECURITY ARCHITECTURE ════════════════ */}
        <section className="py-20 text-white" style={{ background: '#0f172a' }} aria-labelledby="wasm-sec-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
                   style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#a7f3d0' }}>
                🛡️ Local Execution Stack
              </div>
              <h2 id="wasm-sec-heading" className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">
                Local Security Architecture
              </h2>
              <p className="text-base max-w-2xl mx-auto text-slate-400">
                GxP and regulatory compliance built directly into the client-side execution layer. Files never touch a server.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: '100% Client-Side Sandbox',
                  desc: 'All PDF documents are parsed and modified locally in your browser\'s secure tab sandbox. Data never travels across the network.',
                  icon: Lock,
                  tag: 'Zero Ingestion'
                },
                {
                  title: 'Offline-First Security',
                  desc: 'Disconnect your internet entirely. Once the web application loads, all 90+ tools execute in full isolation without calling back home.',
                  icon: ShieldCheck,
                  tag: 'Air-Gapped Ready'
                },
                {
                  title: 'Zero Permanent Storage',
                  desc: 'No databases, shadow tracking, or cloud log retention. Files reside transiently in browser RAM and vanish on tab close.',
                  icon: FileCheck2,
                  tag: 'GDPR Compliant'
                },
                {
                  title: 'WebAssembly Engine',
                  desc: 'High-performance PDF transformations compiled from native Rust and C++ libraries directly into fast WASM browser binaries.',
                  icon: Zap,
                  tag: 'Native Speeds'
                }
              ].map(({ title, desc, icon: Icon, tag }) => (
                <div key={title} className="p-6 rounded-xl border flex flex-col justify-between"
                     style={{ background: '#1e293b', borderColor: '#334155' }}>
                  <div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                         style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{desc}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
                          style={{ background: 'rgba(167,243,208,0.1)', color: '#a7f3d0' }}>
                      {tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ FEATURED GMP TOOL ════════════════ */}
        <section className="py-16" style={{ background:'#ffffff' }} aria-labelledby="featured-gmp-heading">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl overflow-hidden"
                 style={{ border:'1px solid #e5e7eb' }}>
              <div className="p-8 lg:p-10"
                   style={{ background:'#f8fafc' }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-10">

                  <div className="flex-1">
                    <div className="hp-section-label">
                      Featured Pharma Tool
                    </div>
                    <h2 id="featured-gmp-heading"
                        className="text-2xl lg:text-[2rem] font-black mb-3 leading-tight"
                        style={{ color:'#111827' }}>
                      Pharma GMP Document Stamp Tool
                    </h2>
                    <p className="mb-5 max-w-xl leading-relaxed text-sm lg:text-base" style={{ color:'#4b5563' }}>
                      Apply{' '}
                      <span style={{ color:'#2e7d1a', fontWeight:700 }}>APPROVED, DRAFT, SUPERSEDED, CONTROLLED COPY</span>
                      {' '}and 10 other GMP-compliant status stamps to any pharmaceutical PDF.
                      Drag, position, resize and save — entirely in your browser.
                    </p>
                    <div className="flex flex-wrap gap-5 mb-7">
                      {[
                        { icon: ShieldCheck, label:'Files never leave your device' },
                        { icon: FlaskConical,label:'EU GMP Annex 1 compliant'     },
                        { icon: FileCheck2,  label:'GDPR Art. 25 · HPRA'          },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:'#2e7d1a' }}>
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </div>
                      ))}
                    </div>
                    <Link href={`/${locale}/tools/gmp-stamp`}>
                      <button className="hp-btn-green">
                        Open GMP Stamp Tool <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>

                  <div className="lg:flex-shrink-0 lg:w-56 space-y-2">
                    {[
                      { text:'APPROVED',        c:'#2e7d1a', bg:'rgba(46,125,26,0.06)', bd:'rgba(46,125,26,0.18)'  },
                      { text:'CONTROLLED COPY', c:'#2e7d1a', bg:'rgba(46,125,26,0.06)', bd:'rgba(46,125,26,0.18)'  },
                      { text:'DRAFT',           c:'#b91c1c', bg:'rgba(185,28,28,0.05)', bd:'rgba(185,28,28,0.15)'   },
                      { text:'SUPERSEDED',      c:'#b91c1c', bg:'rgba(185,28,28,0.05)', bd:'rgba(185,28,28,0.15)'   },
                      { text:'CONFIDENTIAL',    c:'#b91c1c', bg:'rgba(185,28,28,0.05)', bd:'rgba(185,28,28,0.15)'   },
                    ].map(s => (
                      <div key={s.text}
                           className="flex items-center justify-center rounded py-2 text-xs font-black tracking-widest uppercase"
                           style={{ color:s.c, background:s.bg, border:`1px solid ${s.bd}` }}>
                        {s.text}
                      </div>
                    ))}
                    <p className="pt-1 text-center text-[11px] font-semibold" style={{ color:'#6b7280' }}>
                      10 GMP presets · Draggable · Resizable
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ WHY CHOOSE ════════════════ */}
        <section className="py-16" style={{ background:'#ffffff', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }} aria-label="Features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="hp-section-label" style={{ display:'inline-flex' }}>
                <Sparkles className="h-3.5 w-3.5" />
                Why Priya LifePDF
              </div>
              <h2 className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#111827' }}>
                Built for Pharma &amp; Life Science Professionals
              </h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color:'#4b5563' }}>
                Every feature designed around GMP compliance, data privacy, and regulatory requirements.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: ShieldCheck, color:'#2e7d1a', bg:'rgba(46,125,26,0.06)', bd:'rgba(46,125,26,0.15)',
                  title: t('home.features.privacy.title'), desc: t('home.features.privacy.description') },
                { icon: Zap,  color:'#d97706', bg:'rgba(217,119,6,0.06)', bd:'rgba(217,119,6,0.15)',
                  title: t('home.features.free.title'), desc: t('home.features.free.description') },
                { icon: Wrench, color:'#2563eb', bg:'rgba(37,99,235,0.06)', bd:'rgba(37,99,235,0.15)',
                  title: t('home.features.powerful.title'), desc: t('home.features.powerful.description') },
              ].map(({ icon: Icon, color, bg, bd, title, desc }, idx) => (
                <div key={title}
                     className="hp-card rounded-2xl p-7 flex flex-col items-center text-center bg-white"
                     style={{ border:`1px solid #e5e7eb` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                       style={{ background:bg, border:`1px solid ${bd}` }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color:'#111827' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:'#4b5563' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════ POPULAR TOOLS ════════════════ */}
        <section className="py-16" style={{ background:'#ffffff' }} aria-labelledby="popular-tools-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="hp-section-label" style={{ display:'inline-flex' }}>
                <Star className="h-3.5 w-3.5" />
                {t('home.popularTools.badge')}
              </div>
              <h2 id="popular-tools-heading" className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#111827' }}>
                {t('home.popularTools.title')}
              </h2>
              <p className="text-sm max-w-2xl mx-auto" style={{ color:'#4b5563' }}>
                {t('home.popularTools.description')}
              </p>
            </div>
            <ToolGrid tools={popularTools} locale={locale} localizedToolContent={localizedToolContent} />
          </div>
        </section>

        {/* ════════════════ ORGANIZE TOOLS ════════════════ */}
        <section className="py-16" style={{ background:'#f8fafc', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }} aria-labelledby="featured-tools-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 id="featured-tools-heading" className="text-2xl font-black mb-1.5" style={{ color:'#111827' }}>
                  {t(`home.categories.${categoryTranslationKeys['organize-manage']}`)}
                </h2>
                <p className="text-sm" style={{ color:'#4b5563' }}>
                  {t(`home.categoriesDescription.${categoryTranslationKeys['organize-manage']}`)}
                </p>
              </div>
              <Link href={`/${locale}/tools`}>
                <button className="hp-btn-outline" style={{ padding:'8px 18px', fontSize:'13px' }}>
                  {t('common.navigation.tools')} <ArrowRight className="h-4 w-4" style={{ color:'#2e7d1a' }} />
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

        {/* ════════════════ CATEGORIES ════════════════ */}
        <section className="py-16" style={{ background:'#ffffff' }} aria-labelledby="categories-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="text-2xl lg:text-3xl font-black mb-3" style={{ color:'#111827' }}>
                {t('home.categoriesSection.title')}
              </h2>
              <p className="text-sm max-w-2xl mx-auto" style={{ color:'#4b5563' }}>
                {t('home.categoriesSection.description', { count: allTools.length })}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryOrder.map((category) => {
                const tools = getToolsByCategory(category);
                const Icon = categoryIcons[category];
                const name = t(`home.categories.${categoryTranslationKeys[category]}`);
                const desc = t(`home.categoriesDescription.${categoryTranslationKeys[category]}`);
                return (
                  <Link key={category} href={`/${locale}/tools?category=${category}`} className="group block">
                    <div className="hp-card rounded-2xl p-5 h-full flex items-start gap-4 bg-white"
                         style={{ border:'1px solid #e5e7eb' }}>
                      <div className="hp-cat-icon flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                           style={{ background:'rgba(46,125,26,0.06)', border:'1px solid rgba(46,125,26,0.15)' }}>
                        <Icon className="h-5 w-5" style={{ color:'#2e7d1a' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="hp-cat-title font-bold text-sm mb-1" style={{ color:'#111827' }}>{name}</h3>
                        <p className="text-xs line-clamp-2 mb-2.5" style={{ color:'#6b7280' }}>{desc}</p>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                              style={{ background:'rgba(46,125,26,0.06)', color:'#2e7d1a' }}>
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

        {/* ════════════════ CTA BANNER ════════════════ */}
        <section className="py-24 relative overflow-hidden"
                 style={{ background:'#2e7d1a' }}>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
                 style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff' }}>
              <Sparkles className="h-3.5 w-3.5" />
              100% Free · No Registration · No File Upload
            </div>
            <h2 className="text-3xl lg:text-[2.6rem] font-black mb-4 leading-tight text-white">
              Start Processing PDFs Privately Today
            </h2>
            <p className="text-base max-w-lg mx-auto mb-8 text-emerald-100">
              Trusted by pharma and life science teams across Ireland and the EU
              for secure, browser-based PDF processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${locale}/tools`}>
                <button style={{
                  display:'inline-flex',alignItems:'center',gap:'8px',
                  borderRadius:'6px',padding:'12px 32px',fontSize:'14px',fontWeight:600,cursor:'pointer',
                  background:'#ffffff',color:'#2e7d1a',border:'none',
                  transition:'background .15s ease,transform .12s ease',
                }}
                onMouseEnter={e=>{(e.target as HTMLElement).style.background='#f3f4f6'}}
                onMouseLeave={e=>{(e.target as HTMLElement).style.background='#ffffff'}}>
                  Explore All {allTools.length}+ Tools <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href={`/${locale}/tools/gmp-stamp`}>
                <button style={{
                  display:'inline-flex',alignItems:'center',gap:'8px',
                  borderRadius:'6px',padding:'12px 24px',fontSize:'14px',fontWeight:600,cursor:'pointer',
                  background:'rgba(255,255,255,0.1)',color:'#ffffff',
                  border:'1px solid rgba(255,255,255,0.25)',
                  transition:'background .15s ease,transform .12s ease',
                }}
                onMouseEnter={e=>{(e.target as HTMLElement).style.background='rgba(255,255,255,0.18)'}}
                onMouseLeave={e=>{(e.target as HTMLElement).style.background='rgba(255,255,255,0.1)'}}>
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
