'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileUploader } from '../FileUploader';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { compressPDF, type CompressionQuality, type CompressionAlgorithm } from '@/lib/pdf/processors/compress';
import {
  Check, AlertCircle, Loader2, X, FileArchive, Trash2,
  ShieldCheck, Zap, Sliders
} from 'lucide-react';

export interface CompressPDFToolProps {
  className?: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type FileStatus = 'pending' | 'compressing' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  status: FileStatus;
  result?: Blob;
  error?: string;
  engineUsed?: string;
}

// ─── Quality presets ─────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'low' as CompressionQuality,
    label: 'Maximum',
    range: '70 – 85%',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.40)',
    glow: 'rgba(16,185,129,0.18)',
    desc: 'Smallest file possible. Some image quality loss.',
  },
  {
    id: 'medium' as CompressionQuality,
    label: 'Balanced',
    range: '45 – 65%',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.40)',
    glow: 'rgba(245,158,11,0.18)',
    desc: 'Best size-vs-quality tradeoff. Recommended.',
    recommended: true,
  },
  {
    id: 'high' as CompressionQuality,
    label: 'High Quality',
    range: '20 – 40%',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.40)',
    glow: 'rgba(59,130,246,0.18)',
    desc: 'Preserves image detail. Moderate size savings.',
  },
  {
    id: 'maximum' as CompressionQuality,
    label: 'Near Lossless',
    range: '5 – 15%',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.40)',
    glow: 'rgba(139,92,246,0.18)',
    desc: 'Maximum fidelity. Least size reduction.',
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R; // ≈ 263.9

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompressPDFTool({ className = '' }: CompressPDFToolProps) {
  const [files, setFiles]           = useState<FileItem[]>([]);
  const [quality, setQuality]       = useState<CompressionQuality>('medium');
  const [stripMeta, setStripMeta]   = useState(true);
  const [optImgs, setOptImgs]       = useState(true);
  const [phase, setPhase]           = useState<'upload' | 'ready' | 'processing' | 'done'>('upload');
  const [error, setError]           = useState<string | null>(null);
  const [enableCustom, setEnableCustom] = useState(false);
  const [customDpi, setCustomDpi] = useState(150);
  const [customJpegQuality, setCustomJpegQuality] = useState(80);

  // Progress stored in ref (no batching issues), read by polling interval
  const progressRef  = useRef<Record<string, number>>({});
  const cancelRef    = useRef(false);
  const [displayPct, setDisplayPct] = useState<Record<string, number>>({});

  // Poll ref → state at 10 fps while compressing
  useEffect(() => {
    if (phase !== 'processing') return;
    const id = setInterval(() => {
      setDisplayPct({ ...progressRef.current });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // ── File management ──────────────────────────────────────────────────────

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setError(null);
    const items: FileItem[] = newFiles.slice(0, 10).map(f => ({
      id: uid(),
      file: f,
      status: 'pending',
    }));
    setFiles(items);
    setPhase('ready');
  }, []);

  const removeFile = (id: string) => {
    const next = files.filter(f => f.id !== id);
    setFiles(next);
    if (next.length === 0) setPhase('upload');
  };

  const reset = () => {
    setFiles([]);
    setPhase('upload');
    setError(null);
    progressRef.current = {};
    setDisplayPct({});
    cancelRef.current = false;
  };

  // ── Compression ──────────────────────────────────────────────────────────

  const compress = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (pending.length === 0) return;

    cancelRef.current = false;
    progressRef.current = Object.fromEntries(pending.map(f => [f.id, 0]));
    setDisplayPct({ ...progressRef.current });
    setPhase('processing');

    const markCompressing = (id: string) =>
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'compressing' } : f));

    const markDone = (id: string, result: Blob) =>
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done', result } : f));

    const markError = (id: string, msg: string) =>
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: msg } : f));

    // Try engines in order until one succeeds
    const ENGINE_CHAIN: Array<{ alg: CompressionAlgorithm; label: string }> = [
      { alg: 'standard', label: 'Standard' },
      { alg: 'condense', label: 'PyMuPDF' },
      { alg: 'photon',   label: 'Rasterise' },
    ];

    const processOne = async (item: FileItem) => {
      if (cancelRef.current) return;
      markCompressing(item.id);

      let lastError = 'Compression failed';

      for (const { alg, label } of ENGINE_CHAIN) {
        if (cancelRef.current) return;

        // Reset progress for this attempt
        progressRef.current[item.id] = 0;

        try {
          const out = await compressPDF(
            item.file,
            {
              algorithm: alg,
              quality,
              removeMetadata: stripMeta,
              optimizeImages: optImgs,
              removeUnusedObjects: true,
              ...(enableCustom ? {
                customDpi,
                customJpegQuality: customJpegQuality / 100,
              } : {}),
            },
            (pct) => {
              if (!cancelRef.current) progressRef.current[item.id] = pct;
            }
          );

          if (cancelRef.current) return;

          if (out.success && out.result) {
            progressRef.current[item.id] = 100;
            setFiles(prev => prev.map(f => f.id === item.id
              ? { ...f, status: 'done', result: out.result as Blob, engineUsed: label }
              : f
            ));
            return; // success — stop trying
          }

          lastError = out.error?.message || `${label} engine failed`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : `${label} engine failed`;
        }
      }

      // All engines failed
      if (!cancelRef.current) {
        markError(item.id, lastError);
      }
    };

    // Worker-pool: 2 concurrent
    let idx = 0;
    await Promise.all(
      Array.from({ length: Math.min(2, pending.length) }, async () => {
        while (idx < pending.length && !cancelRef.current) {
          await processOne(pending[idx++]);
        }
      })
    );

    if (!cancelRef.current) setPhase('done');
    else setPhase('ready');
  };

  const cancel = () => {
    cancelRef.current = true;
    setFiles(prev => prev.map(f => f.status === 'compressing' ? { ...f, status: 'pending' } : f));
    setPhase('ready');
  };

  // ── Download all ─────────────────────────────────────────────────────────

  const downloadZip = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.result);
    if (!doneFiles.length) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    doneFiles.forEach(f => {
      zip.file(f.file.name.replace(/\.pdf$/i, '_compressed.pdf'), f.result!);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'compressed_pdfs.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Derived stats ────────────────────────────────────────────────────────

  const total          = files.length;
  const doneCount      = files.filter(f => f.status === 'done').length;
  const errorCount     = files.filter(f => f.status === 'error').length;
  const activeCount    = files.filter(f => f.status === 'compressing').length;
  const pendingCount   = files.filter(f => f.status === 'pending').length;

  const overallPct = total > 0
    ? Math.round(
        files.reduce((sum, f) => {
          if (f.status === 'done' || f.status === 'error') return sum + 100;
          if (f.status === 'compressing') return sum + (displayPct[f.id] ?? 0);
          return sum;
        }, 0) / total
      )
    : 0;

  const preset = PRESETS.find(p => p.id === quality)!;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-5 ${className}`.trim()}>

      {/* ── UPLOAD PHASE ── */}
      {phase === 'upload' && (
        <>
          <FileUploader
            accept={['application/pdf', '.pdf']}
            multiple
            maxFiles={10}
            onFilesSelected={handleFilesSelected}
            onError={msg => setError(msg)}
            label="Drop PDF files here to compress"
            description="Up to 10 PDFs · Processed in your browser · Zero upload"
          />
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </p>
          )}
          {/* Privacy note */}
          <div className="flex items-center justify-center gap-6 py-2">
            {['Files never leave your device', '100% private', 'EU GMP · GDPR · HPRA'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--color-muted-foreground))]">
                <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--color-primary))]" />
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── READY PHASE ── */}
      {phase === 'ready' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: file list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[hsl(var(--color-foreground))]">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
              <Button variant="ghost" size="sm" onClick={reset}>Clear all</Button>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--color-border))] overflow-hidden divide-y divide-[hsl(var(--color-border))]">
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--color-background))]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--color-foreground))] truncate">{f.file.name}</p>
                    <p className="text-xs text-[hsl(var(--color-muted-foreground))]">{fmtSize(f.file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-1 rounded-lg text-[hsl(var(--color-muted-foreground))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {files.length < 10 && (
              <button
                className="w-full rounded-2xl border-2 border-dashed border-[hsl(var(--color-border))] hover:border-[hsl(var(--color-primary)/0.5)] py-4 text-sm font-semibold text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-primary))] transition-colors"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,application/pdf';
                  input.multiple = true;
                  input.onchange = () => {
                    const newFiles = Array.from(input.files || []).slice(0, 10 - files.length);
                    if (newFiles.length) {
                      setFiles(prev => [
                        ...prev,
                        ...newFiles.map(f => ({ id: uid(), file: f, status: 'pending' as FileStatus })),
                      ]);
                    }
                  };
                  input.click();
                }}
              >
                + Add more PDFs ({10 - files.length} remaining)
              </button>
            )}
          </div>

          {/* Right: settings */}
          <div className="lg:col-span-2 space-y-4">

            {/* Quality selector */}
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-[hsl(var(--color-muted-foreground))]">
                Compression Level
              </p>
              <div className="space-y-1.5">
                {PRESETS.map(p => {
                  const active = quality === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setQuality(p.id)}
                      className="w-full text-left rounded-xl px-4 py-3 border transition-all duration-200 focus:outline-none"
                      style={active
                        ? { borderColor: p.border, background: p.bg, boxShadow: `0 0 0 1px ${p.border}` }
                        : { borderColor: 'hsl(var(--color-border))', background: 'transparent' }
                      }
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className="text-sm font-bold"
                          style={{ color: active ? p.color : 'hsl(var(--color-foreground))' }}
                        >
                          {p.label}
                          {'recommended' in p && p.recommended && (
                            <span className="ml-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                              style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                              Recommended
                            </span>
                          )}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: active ? p.color : 'hsl(var(--color-muted-foreground))' }}
                        >
                          {p.range}
                        </span>
                      </div>
                      <p className="text-[11px] text-[hsl(var(--color-muted-foreground))]">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="rounded-2xl border border-[hsl(var(--color-border))] overflow-hidden divide-y divide-[hsl(var(--color-border))]">
              {[
                { label: 'Optimize images', value: optImgs, set: setOptImgs, sub: 'Re-encode images at target quality' },
                { label: 'Strip metadata', value: stripMeta, set: setStripMeta, sub: 'Remove author, title, keywords' },
              ].map(({ label, value, set, sub }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--color-foreground))]">{label}</p>
                    <p className="text-[11px] text-[hsl(var(--color-muted-foreground))]">{sub}</p>
                  </div>
                  <button
                    onClick={() => set(v => !v)}
                    className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
                    style={{ background: value ? preset.color : 'hsl(var(--color-border))' }}
                    aria-checked={value}
                    role="switch"
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Settings Slider Accordion */}
            <div className="rounded-2xl border border-[hsl(var(--color-border))] overflow-hidden bg-[hsl(var(--color-background))]">
              <button
                type="button"
                onClick={() => setEnableCustom(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--color-muted)/0.3)] transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                  <span className="text-sm font-bold text-[hsl(var(--color-foreground))]">
                    Manual optimization settings
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {enableCustom ? (
                    <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded animate-pulse">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[hsl(var(--color-muted-foreground))]">
                      Disabled
                    </span>
                  )}
                  <span className="text-[hsl(var(--color-muted-foreground))] text-xs">
                    {enableCustom ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {enableCustom && (
                <div className="px-4 pb-4 pt-2 border-t border-[hsl(var(--color-border))] space-y-4 bg-[hsl(var(--color-muted)/0.05)]">
                  {/* Target DPI */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[hsl(var(--color-foreground))]">Target DPI (Resolution)</span>
                      <span className="font-black tabular-nums text-[hsl(var(--color-primary))]">{customDpi} DPI</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={customDpi}
                      onChange={(e) => setCustomDpi(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-[hsl(var(--color-border))] accent-[hsl(var(--color-primary))] cursor-pointer"
                    />
                    <p className="text-[10px] text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                      {customDpi < 100 && '⚠️ Low resolution: Very small file size, but text/images may appear blurry.'}
                      {customDpi >= 100 && customDpi < 150 && '⚡ Screen optimized: Standard for emails, web viewing, and fast loading.'}
                      {customDpi >= 150 && customDpi < 220 && '✨ Balanced quality: Good for screen reading and standard office printing.'}
                      {customDpi >= 220 && '🏆 High fidelity: Best quality for publications and high-res print, but larger size.'}
                    </p>
                  </div>

                  {/* JPEG Quality */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[hsl(var(--color-foreground))]">Image Quality (JPEG)</span>
                      <span className="font-black tabular-nums text-[hsl(var(--color-primary))]">{customJpegQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={customJpegQuality}
                      onChange={(e) => setCustomJpegQuality(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-[hsl(var(--color-border))] accent-[hsl(var(--color-primary))] cursor-pointer"
                    />
                    <p className="text-[10px] text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                      {customJpegQuality < 40 && '⚠️ Extreme compression: Obvious image compression artifacts (blocking).'}
                      {customJpegQuality >= 40 && customJpegQuality < 70 && '⚡ Balanced: Good reduction, decent image clarity for normal use.'}
                      {customJpegQuality >= 70 && customJpegQuality < 90 && '✨ Highly clear: Sharp images, minimal visual loss.'}
                      {customJpegQuality >= 90 && '🏆 Near lossless: Virtually indistinguishable from original, minimal size saving.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Compress button */}
            <button
              onClick={compress}
              className="w-full rounded-2xl py-4 text-base font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
              style={{
                background: preset.color,
                boxShadow: `0 6px 24px ${preset.glow}`,
              }}
            >
              <Zap className="inline w-4 h-4 mr-2 -mt-0.5" />
              Compress {files.length} PDF{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING PHASE ── */}
      {phase === 'processing' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-black text-white tracking-wide">Compressing…</span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {doneCount} of {total} done
              </span>
            </div>
            <button
              onClick={cancel}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>

          <div className="flex min-h-[180px]">
            {/* Ring */}
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-6 flex-shrink-0 border-r border-zinc-800">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  {/* Track */}
                  <circle cx="50" cy="50" r={RING_R} fill="none" stroke="#27272a" strokeWidth="8" />
                  {/* Progress */}
                  <circle
                    cx="50" cy="50" r={RING_R}
                    fill="none"
                    stroke={preset.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - overallPct / 100)}
                    style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">
                    {overallPct}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">%</span>
                </div>
              </div>

              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-sm font-black text-emerald-400 tabular-nums">{doneCount}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Done</div>
                </div>
                <div>
                  <div className="text-sm font-black text-blue-400 tabular-nums">{activeCount}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Active</div>
                </div>
                <div>
                  <div className="text-sm font-black text-zinc-500 tabular-nums">{pendingCount}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Queue</div>
                </div>
                {errorCount > 0 && (
                  <div>
                    <div className="text-sm font-black text-red-400 tabular-nums">{errorCount}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Error</div>
                  </div>
                )}
              </div>
            </div>

            {/* Per-file rows */}
            <div className="flex-1 py-4 px-5 space-y-3 max-h-72 overflow-y-auto">
              {files.map((f, idx) => {
                const pct =
                  f.status === 'done' || f.status === 'error' ? 100
                  : f.status === 'compressing' ? (displayPct[f.id] ?? 0)
                  : 0;
                const barColor =
                  f.status === 'done'       ? '#10b981'
                  : f.status === 'error'    ? '#ef4444'
                  : f.status === 'compressing' ? '#3b82f6'
                  : '#3f3f46';

                return (
                  <div key={f.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {f.status === 'done'        && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        {f.status === 'error'       && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                        {f.status === 'compressing' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                        {f.status === 'pending'     && (
                          <span className="text-[9px] font-bold text-zinc-600 tabular-nums">{idx + 1}</span>
                        )}
                      </div>
                      <span className="flex-1 text-[11px] font-semibold text-zinc-300 truncate min-w-0">
                        {f.file.name}
                      </span>
                      <span className="text-[9px] text-zinc-600 tabular-nums flex-shrink-0">
                        {fmtSize(f.file.size)}
                      </span>
                      <span
                        className="text-[10px] font-black tabular-nums w-8 text-right flex-shrink-0"
                        style={{ color: f.status === 'pending' ? '#52525b' : barColor }}
                      >
                        {f.status === 'pending' ? '—' : `${Math.round(pct)}%`}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-zinc-800 ml-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-150"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>

                    {f.status === 'error' && f.error && (
                      <p className="text-[9px] text-red-400 ml-6 truncate">{f.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall bar */}
          <div className="px-6 pb-5 pt-1">
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${overallPct}%`, background: preset.color }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DONE PHASE ── */}
      {phase === 'done' && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div
            className="rounded-2xl border p-5 flex items-center gap-4"
            style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {doneCount} file{doneCount !== 1 ? 's' : ''} compressed
                {errorCount > 0 && ` · ${errorCount} failed`}
              </p>
              {(() => {
                const origTotal = files.filter(f => f.status === 'done').reduce((s, f) => s + f.file.size, 0);
                const compTotal = files.filter(f => f.status === 'done' && f.result).reduce((s, f) => s + (f.result?.size ?? 0), 0);
                const pct = origTotal > 0 ? Math.round((1 - compTotal / origTotal) * 100) : 0;
                return origTotal > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Saved {fmtSize(origTotal - compTotal)} total · {pct}% reduction
                  </p>
                );
              })()}
            </div>
            {doneCount > 1 && (
              <button
                onClick={downloadZip}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 flex-shrink-0"
                style={{ background: '#10b981' }}
              >
                <FileArchive className="w-4 h-4" />
                Download All (.zip)
              </button>
            )}
          </div>

          {/* Per-file results */}
          <div className="rounded-2xl border border-[hsl(var(--color-border))] overflow-hidden divide-y divide-[hsl(var(--color-border))]">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-4 bg-[hsl(var(--color-background))]">

                {/* Status icon */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: f.status === 'done' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  }}>
                  {f.status === 'done'
                    ? <Check className="w-4 h-4 text-emerald-500" />
                    : <AlertCircle className="w-4 h-4 text-red-500" />
                  }
                </div>

                {/* Name + size info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--color-foreground))] truncate">
                    {f.file.name}
                  </p>
                  {f.status === 'done' && f.result && (
                    <p className="text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[hsl(var(--color-muted-foreground))]">{fmtSize(f.file.size)}</span>
                      <span className="text-[hsl(var(--color-muted-foreground))]">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtSize(f.result.size)}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        −{Math.round((1 - f.result.size / f.file.size) * 100)}%
                      </span>
                      {f.engineUsed && f.engineUsed !== 'Standard' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          via {f.engineUsed}
                        </span>
                      )}
                    </p>
                  )}
                  {f.status === 'error' && (
                    <p className="text-xs text-red-500 mt-0.5">{f.error}</p>
                  )}
                </div>

                {/* Download */}
                {f.status === 'done' && f.result && (
                  <DownloadButton
                    file={f.result}
                    filename={f.file.name.replace(/\.pdf$/i, '_compressed.pdf')}
                    variant="outline"
                    size="sm"
                    showFileSize
                  />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">
              Compress More Files
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                setFiles(prev => prev.map(f => ({ ...f, status: 'pending', result: undefined, error: undefined })));
                progressRef.current = {};
                setDisplayPct({});
                setPhase('ready');
              }}
            >
              Re-compress with Different Settings
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompressPDFTool;
