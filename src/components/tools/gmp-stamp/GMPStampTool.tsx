'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress, ProcessingStatus } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { loadPdfjs, loadPdfLib } from '@/lib/pdf/loader';
import { 
  ShieldCheck, 
  FlaskConical, 
  FileCheck2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Lock,
  Search,
  Pin,
  Save
} from 'lucide-react';

export interface GMPStampToolProps {
  className?: string;
}

interface PlacedStamp {
  id: string;
  text: string;
  color: 'red' | 'green' | 'blue';
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  pageIndex: number;
  style: 'box' | 'text-only';
  scale: number;
}

const GMP_PRESET_STAMPS = [
  { text: 'APPROVED', color: 'green' as const, desc: 'Document approved for use' },
  { text: 'CONTROLLED COPY', color: 'green' as const, desc: 'Official controlled document' },
  { text: 'FOR REVIEW', color: 'green' as const, desc: 'Under review — not final' },
  { text: 'GMP COMPLIANT', color: 'green' as const, desc: 'Meets GMP requirements' },
  { text: 'SAMPLE', color: 'blue' as const, desc: 'Sample copy only' },
  { text: 'DRAFT', color: 'red' as const, desc: 'Work in progress — not approved' },
  { text: 'SUPERSEDED', color: 'red' as const, desc: 'Replaced by newer version' },
  { text: 'VOID', color: 'red' as const, desc: 'No longer valid' },
  { text: 'CONFIDENTIAL', color: 'red' as const, desc: 'Restricted distribution' },
  { text: 'NOT FOR DISTRIBUTION', color: 'red' as const, desc: 'Internal use only' },
] as const;

const getPresetIcon = (text: string) => {
  switch (text) {
    case 'APPROVED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'CONTROLLED COPY':
      return <FileCheck2 className="h-4 w-4 text-emerald-600" />;
    case 'FOR REVIEW':
      return <Search className="h-4 w-4 text-[hsl(var(--color-primary))]" />;
    case 'GMP COMPLIANT':
      return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
    case 'SAMPLE':
      return <FlaskConical className="h-4 w-4 text-blue-600" />;
    case 'DRAFT':
      return <Info className="h-4 w-4 text-red-600" />;
    case 'SUPERSEDED':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'VOID':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'CONFIDENTIAL':
      return <Lock className="h-4 w-4 text-red-600" />;
    case 'NOT FOR DISTRIBUTION':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <FileCheck2 className="h-4 w-4" />;
  }
};

const COLOR_STYLES = {
  green: {
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    selectedBorder: 'border-emerald-600',
    hex: '#059669',
    pdfRgb: [5/255, 150/255, 105/255] as [number, number, number],
  },
  red: {
    border: 'border-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700 border-red-200',
    selectedBorder: 'border-red-600',
    hex: '#dc2626',
    pdfRgb: [220/255, 38/255, 38/255] as [number, number, number],
  },
  blue: {
    border: 'border-blue-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    selectedBorder: 'border-blue-600',
    hex: '#2563eb',
    pdfRgb: [37/255, 99/255, 235/255] as [number, number, number],
  },
};

export function GMPStampTool({ className = '' }: GMPStampToolProps) {
  const t = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<{ blob: Blob; filename: string } | null>(null);

  const [stamps, setStamps] = useState<PlacedStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<typeof GMP_PRESET_STAMPS[number]>(GMP_PRESET_STAMPS[0]);
  const [activeOpacity, setActiveOpacity] = useState<number>(1.0);
  const [activeStyle, setActiveStyle] = useState<'box' | 'text-only'>('box');
  const [activeScale, setActiveScale] = useState<number>(1.0);
  const [canvasDim, setCanvasDim] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const dragStartRef = useRef<{ x: number; y: number; stampX: number; stampY: number } | null>(null);

  const handleClear = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setCurrentPage(1);
    setStatus('idle');
    setProgress(0);
    setOutputFile(null);
    setStamps([]);
    setSelectedStampId(null);
    setError(null);
    pdfDocRef.current = null;
  }, []);

  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setCanvasDim({ width: viewport.width, height: viewport.height });
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (err) {
      setError('Failed to render PDF page.');
    }
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setStatus('uploading');
    setError(null);
    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setStatus('idle');
      setTimeout(() => renderPage(1), 100);
    } catch (err) {
      setError('Failed to load PDF. It may be password-protected or corrupted.');
      setStatus('idle');
    }
  }, [renderPage]);

  useEffect(() => {
    if (file && totalPages > 0) renderPage(currentPage);
  }, [currentPage, file, totalPages, renderPage]);

  const addStamp = useCallback(() => {
    if (!canvasDim.width) return;
    const stampW = Math.round(210 * activeScale);
    const stampH = Math.round(62 * activeScale);
    const newStamp: PlacedStamp = {
      id: Math.random().toString(36).substr(2, 9),
      text: activePreset.text,
      color: activePreset.color,
      x: (canvasDim.width - stampW) / 2,
      y: (canvasDim.height - stampH) / 2,
      width: stampW,
      height: stampH,
      opacity: activeOpacity,
      pageIndex: currentPage - 1,
      style: activeStyle,
      scale: activeScale,
    };
    setStamps(prev => [...prev, newStamp]);
    setSelectedStampId(newStamp.id);
  }, [canvasDim, activePreset, activeOpacity, activeStyle, activeScale, currentPage]);

  const handleStampMouseDown = (e: React.MouseEvent, stamp: PlacedStamp) => {
    e.preventDefault();
    setSelectedStampId(stamp.id);
    dragStartRef.current = { x: e.clientX, y: e.clientY, stampX: stamp.x, stampY: stamp.y };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStartRef.current || !selectedStampId) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setStamps(prev => prev.map(s => {
      if (s.id !== selectedStampId) return s;
      let newX = Math.max(0, dragStartRef.current!.stampX + dx);
      let newY = Math.max(0, dragStartRef.current!.stampY + dy);
      newX = Math.min(canvasDim.width - s.width, newX);
      newY = Math.min(canvasDim.height - s.height, newY);
      return { ...s, x: newX, y: newY };
    }));
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const deleteStamp = (id: string) => {
    setStamps(prev => prev.filter(s => s.id !== id));
    if (selectedStampId === id) setSelectedStampId(null);
  };

  const handleOpacityChange = (val: number) => {
    setActiveOpacity(val);
    if (selectedStampId) {
      setStamps(prev => prev.map(s => s.id === selectedStampId ? { ...s, opacity: val } : s));
    }
  };

  const handleStyleChange = (val: 'box' | 'text-only') => {
    setActiveStyle(val);
    if (selectedStampId) {
      setStamps(prev => prev.map(s => s.id === selectedStampId ? { ...s, style: val } : s));
    }
  };

  const handleScaleChange = (val: number) => {
    setActiveScale(val);
    if (selectedStampId) {
      setStamps(prev => prev.map(s => {
        if (s.id !== selectedStampId) return s;
        const newW = Math.round(210 * val);
        const newH = Math.round(62 * val);
        return { ...s, scale: val, width: newW, height: newH };
      }));
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(20);
    try {
      const pdfLib = await loadPdfLib();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const boldFont = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);
      setProgress(50);
      for (const stamp of stamps) {
        if (stamp.pageIndex < 0 || stamp.pageIndex >= pages.length) continue;
        const page = pages[stamp.pageIndex];
        const pageW = page.getWidth();
        const pageH = page.getHeight();
        const pdfStampW = (stamp.width / canvasDim.width) * pageW;
        const pdfStampH = (stamp.height / canvasDim.height) * pageH;
        const pdfX = (stamp.x / canvasDim.width) * pageW;
        const pdfY = (1 - (stamp.y + stamp.height) / canvasDim.height) * pageH;
        const [r, g, b] = COLOR_STYLES[stamp.color].pdfRgb;
        const colorRGB = pdfLib.rgb(r, g, b);
        if (stamp.style !== 'text-only') {
          page.drawRectangle({
            x: pdfX, y: pdfY, width: pdfStampW, height: pdfStampH,
            borderColor: colorRGB, borderWidth: 3, opacity: stamp.opacity
          });
        }
        const fontSize = Math.min(pdfStampH * 0.42, (pdfStampW * 0.88) / (stamp.text.length * 0.62));
        const textWidth = boldFont.widthOfTextAtSize(stamp.text, fontSize);
        const textHeight = boldFont.heightAtSize(fontSize);
        const textX = pdfX + (pdfStampW - textWidth) / 2;
        const textY = pdfY + (pdfStampH - textHeight) / 2 + (textHeight * 0.15);
        page.drawText(stamp.text, { x: textX, y: textY, size: fontSize, font: boldFont, color: colorRGB, opacity: stamp.opacity });
      }
      setProgress(80);
      const modifiedPdfBytes = await pdfDoc.save();
      const outputBlob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setOutputFile({ blob: outputBlob, filename: `gmp_stamped_${file.name}` });
      setStatus('complete');
      setProgress(100);
    } catch (err) {
      setError('An error occurred while stamping the PDF.');
      setStatus('error');
    }
  };

  const selectedStamp = stamps.find(s => s.id === selectedStampId);
  const pageStampCount = stamps.filter(s => s.pageIndex === currentPage - 1).length;

  return (
    <div className={`space-y-6 ${className}`.trim()}>

      {/* Pharma Compliance Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-4 dark:from-emerald-950/20 dark:to-green-950/20 dark:border-emerald-900/40">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">100% Private</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500">Files never leave your device</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <FlaskConical className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">EU GMP Annex 1</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500">Pharma-grade document control</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">GDPR Article 25</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-500">Privacy by design · HPRA governed</div>
            </div>
          </div>
          <div className="ml-auto hidden lg:block">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              🇮🇪 Operated from Ireland
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {status === 'idle' && !file && (
        <Card variant="outlined" className="overflow-hidden p-0">
          <div className="border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted)/0.3)] px-6 py-4">
            <h3 className="font-semibold text-[hsl(var(--color-foreground))]">Upload Pharmaceutical Document</h3>
            <p className="mt-0.5 text-sm text-[hsl(var(--color-muted-foreground))]">
              SOPs · Batch Records · Validation Protocols · Regulatory Submissions · QMS Documents
            </p>
          </div>
          <div className="p-6">
            <FileUploader
              accept={['application/pdf', '.pdf']}
              multiple={false}
              maxFiles={1}
              onFilesSelected={handleFilesSelected}
              onError={(msg) => setError(msg)}
              disabled={status !== 'idle'}
              label="Drop your pharma PDF here"
              description="PDF files only · Processed entirely in your browser · No server upload"
            />
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 dark:bg-blue-950/20 dark:border-blue-900/40">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>Designed for controlled documents.</strong> Apply GMP status stamps (APPROVED, DRAFT, SUPERSEDED, etc.) to any pharmaceutical PDF. All stamping occurs locally — your document never touches any server.
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {status === 'uploading' && (
        <div className="flex items-center justify-center py-10">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[hsl(var(--color-primary))] border-t-transparent" />
            <p className="text-sm font-medium text-[hsl(var(--color-muted-foreground))]">Loading document…</p>
          </div>
        </div>
      )}

      {status === 'processing' && (
        <ProcessingProgress progress={progress} status={status} />
      )}

      {/* Success State */}
      {status === 'complete' && outputFile && (
        <Card variant="outlined" className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Stamps Applied Successfully</h4>
                <p className="text-sm text-emerald-100">Your document was processed entirely in your browser</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-[hsl(var(--color-muted)/0.5)] p-3">
                <div className="text-xl font-bold text-[hsl(var(--color-foreground))]">{stamps.length}</div>
                <div className="text-xs text-[hsl(var(--color-muted-foreground))]">Stamps applied</div>
              </div>
              <div className="rounded-lg bg-[hsl(var(--color-muted)/0.5)] p-3">
                <div className="text-xl font-bold text-[hsl(var(--color-foreground))]">{totalPages}</div>
                <div className="text-xs text-[hsl(var(--color-muted-foreground))]">Pages processed</div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                <div className="text-xl font-bold text-emerald-600">0</div>
                <div className="text-xs text-emerald-600">Files uploaded</div>
              </div>
            </div>
            <div className="flex gap-3">
              <DownloadButton file={outputFile.blob} filename={outputFile.filename} />
              <Button variant="outline" onClick={handleClear}>Start Over</Button>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900/40">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                This document was processed using client-side WebAssembly. No data was transmitted. Compliant with GDPR Article 25 and the Irish Data Protection Act 2018.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Editor */}
      {file && status === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Stamp Selector */}
            <Card variant="outlined" className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--color-primary))]" />
                <h4 className="text-sm font-bold text-[hsl(var(--color-foreground))]">GMP Stamp Presets</h4>
              </div>

              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {GMP_PRESET_STAMPS.map((preset, idx) => {
                  const styles = COLOR_STYLES[preset.color];
                  const isActive = activePreset.text === preset.text;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePreset(preset)}
                      className={`w-full flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-all ${
                        isActive
                          ? `${styles.border} ${styles.bg} ring-1 ring-offset-0 ${styles.selectedBorder}`
                          : 'border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-muted)/0.5)]'
                      }`}
                    >
                      <span className="flex-shrink-0">{getPresetIcon(preset.text)}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isActive ? styles.text : 'text-[hsl(var(--color-foreground))]'}`}>
                          {preset.text}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--color-muted-foreground))] truncate">{preset.desc}</div>
                      </div>
                      <span className={`flex-shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles.badge}`}>
                        {preset.color}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 pt-1 border-t border-[hsl(var(--color-border))]">
                {/* Style toggle */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-[hsl(var(--color-muted-foreground))]">Stamp Style</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStyleChange('box')}
                      className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${activeStyle === 'box' ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]' : 'border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted)/0.5)]'}`}
                    >
                      ☐ Box
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStyleChange('text-only')}
                      className={`flex-1 rounded-lg border py-1.5 text-[11px] font-semibold transition-all ${activeStyle === 'text-only' ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]' : 'border-[hsl(var(--color-border))] text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted)/0.5)]'}`}
                    >
                      T Text Only
                    </button>
                  </div>
                </div>

                {/* Size slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[hsl(var(--color-muted-foreground))]">Size</span>
                    <span className="font-bold text-[hsl(var(--color-foreground))]">{Math.round(activeScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={activeScale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[hsl(var(--color-border))]"
                  />
                  <div className="flex justify-between text-[9px] text-[hsl(var(--color-muted-foreground))]">
                    <span>50%</span><span>100%</span><span>200%</span><span>300%</span>
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[hsl(var(--color-muted-foreground))]">Opacity</span>
                    <span className="font-bold text-[hsl(var(--color-foreground))]">{Math.round(activeOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={activeOpacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-[hsl(var(--color-border))]"
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full font-semibold" onClick={addStamp} disabled={!canvasDim.width}>
                <Pin className="mr-1.5 h-4 w-4" /> Place Stamp on Page {currentPage}
              </Button>
            </Card>

            {/* Selected Stamp Controls */}
            {selectedStamp && (
              <Card variant="outlined" className={`p-3.5 border-2 ${COLOR_STYLES[selectedStamp.color].border} ${COLOR_STYLES[selectedStamp.color].bg}`}>
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-bold ${COLOR_STYLES[selectedStamp.color].text}`}>
                      Active: {selectedStamp.text}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--color-muted-foreground))] mt-0.5">Drag to reposition</div>
                  </div>
                  <button
                    onClick={() => deleteStamp(selectedStamp.id)}
                    className="rounded-md border border-red-200 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            )}

            {/* Page Stamp Summary */}
            {stamps.length > 0 && (
              <Card variant="outlined" className="p-3.5 bg-[hsl(var(--color-muted)/0.3)]">
                <div className="text-xs font-bold text-[hsl(var(--color-foreground))] mb-2">Document Stamps</div>
                <div className="space-y-1">
                  {stamps.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between text-[10px]">
                      <span className={`font-semibold ${COLOR_STYLES[s.color].text}`}>{s.text}</span>
                      <span className="text-[hsl(var(--color-muted-foreground))]">p.{s.pageIndex + 1}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Save Button */}
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full py-3 font-bold shadow-lg text-base"
                onClick={handleSave}
                disabled={stamps.length === 0}
              >
                <Save className="mr-1.5 h-4 w-4" /> Save Stamped PDF
              </Button>
              {stamps.length === 0 && (
                <p className="text-center text-[10px] text-[hsl(var(--color-muted-foreground))]">Add at least one stamp to save</p>
              )}
              <Button variant="outline" className="w-full text-sm" onClick={handleClear}>
                Remove PDF
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-3 space-y-3">

            {/* Page Navigation Bar */}
            <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-muted)/0.4)] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[hsl(var(--color-foreground))]">
                  Page {currentPage} / {totalPages}
                </span>
                {pageStampCount > 0 && (
                  <span className="rounded-full bg-[hsl(var(--color-primary)/0.1)] border border-[hsl(var(--color-primary)/0.2)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--color-primary))]">
                    {pageStampCount} stamp{pageStampCount !== 1 ? 's' : ''} on this page
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document Preview Area */}
            <div className="rounded-xl border border-[hsl(var(--color-border))] bg-slate-100 dark:bg-slate-900/50 overflow-auto">
              <div
                ref={containerRef}
                className="relative flex items-start justify-center p-6 min-h-[500px]"
              >
                <div className="relative shadow-2xl border border-slate-200 dark:border-slate-700 bg-white select-none">
                  <canvas ref={canvasRef} className="block" />

                  {/* Stamp Overlays */}
                  {stamps
                    .filter(s => s.pageIndex === currentPage - 1)
                    .map(stamp => {
                      const styles = COLOR_STYLES[stamp.color];
                      const isSelected = stamp.id === selectedStampId;
                      return (
                        <div
                          key={stamp.id}
                          onMouseDown={(e) => handleStampMouseDown(e, stamp)}
                          className={`absolute font-bold cursor-move flex items-center justify-center tracking-widest uppercase select-none transition-shadow ${styles.text} ${stamp.style === 'box' ? `border-[3px] ${styles.border}` : ''} ${isSelected ? 'ring-2 ring-offset-2 ring-[hsl(var(--color-primary))] shadow-xl' : stamp.style === 'box' ? 'shadow-md' : ''}`}
                          style={{
                            left: `${stamp.x}px`,
                            top: `${stamp.y}px`,
                            width: `${stamp.width}px`,
                            height: `${stamp.height}px`,
                            opacity: stamp.opacity,
                            fontSize: `${Math.round(13 * stamp.scale)}px`,
                            letterSpacing: '1.5px',
                            backgroundColor: stamp.style === 'box'
                              ? stamp.color === 'green'
                                ? 'rgba(5,150,105,0.06)'
                                : stamp.color === 'blue'
                                ? 'rgba(37,99,235,0.06)'
                                : 'rgba(220,38,38,0.06)'
                              : 'transparent',
                          }}
                        >
                          {stamp.text}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[hsl(var(--color-muted-foreground))]">
              Click a stamp preset then "Place Stamp" to add it. Drag stamps to reposition.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
