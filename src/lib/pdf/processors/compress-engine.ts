/**
 * PDF Compression Engine — based on PDFLince (github.com/GSiesto/PDFLince)
 *
 * Key improvements over previous engine:
 *  - Uses pdfDoc.context.assign(ref, newStream) for robust stream replacement
 *  - Browser-native DecompressionStream for FlateDecode (no WASM needed)
 *  - Content-hash image caching avoids reprocessing identical images
 *  - Full PNG predictor unfiltering (filter bytes 0-4)
 *  - Handles both DCTDecode (JPEG) and FlateDecode (PNG/bitmap) streams
 */

import {
  PDFName,
  PDFDict,
  PDFRawStream,
  PDFRef,
  PDFArray,
  PDFNumber,
} from 'pdf-lib';
import { loadPdfLib } from '../loader';
import type { CompressionQuality, CompressPDFOptions } from './compress';

// ---------------------------------------------------------------------------
// Quality → DPI / JPEG quality mapping
// ---------------------------------------------------------------------------
const QUALITY_SETTINGS: Record<CompressionQuality, { dpi: number; jpegQuality: number }> = {
  low:     { dpi: 120, jpegQuality: 0.70 },
  medium:  { dpi: 150, jpegQuality: 0.80 },
  high:    { dpi: 200, jpegQuality: 0.88 },
  maximum: { dpi: 300, jpegQuality: 0.94 },
};

// ---------------------------------------------------------------------------
// Decompress FlateDecode/Zlib using browser-native DecompressionStream
// ---------------------------------------------------------------------------
async function decompressFlate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  // Try zlib wrapper first, then raw deflate
  for (const format of ['deflate', 'deflate-raw'] as CompressionFormat[]) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      writer.write(bytes as unknown as BufferSource);
      writer.close();
      const output = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(output);
    } catch { /* try next */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Undo PNG predictors (filter bytes 0-4)
// ---------------------------------------------------------------------------
function unfilterPng(bytes: Uint8Array, width: number, height: number, bpp: number): Uint8Array {
  const rowSize = width * bpp + 1;
  const result  = new Uint8Array(width * height * bpp);

  for (let y = 0; y < height; y++) {
    const rowStart    = y * rowSize;
    if (rowStart + rowSize > bytes.length) break;
    const filter      = bytes[rowStart];
    const rawRowStart = y * width * bpp;

    for (let x = 0; x < width * bpp; x++) {
      const cur    = bytes[rowStart + 1 + x];
      const left   = x >= bpp ? result[rawRowStart + x - bpp] : 0;
      const up     = y > 0   ? result[rawRowStart - width * bpp + x] : 0;
      const upLeft = (y > 0 && x >= bpp) ? result[rawRowStart - width * bpp + x - bpp] : 0;

      let val = 0;
      switch (filter) {
        case 0: val = cur; break;
        case 1: val = (cur + left) & 0xff; break;
        case 2: val = (cur + up)   & 0xff; break;
        case 3: val = (cur + Math.floor((left + up) / 2)) & 0xff; break;
        case 4: {
          const p  = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          val = (cur + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 0xff;
          break;
        }
        default: val = cur;
      }
      result[rawRowStart + x] = val;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Fast hash for image cache keying
// ---------------------------------------------------------------------------
function hashBytes(bytes: Uint8Array): string {
  let h = 0;
  for (let i = 0; i < bytes.length; i++) h = (Math.imul(h, 31) + bytes[i]) | 0;
  return h.toString(36);
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Downscale a single image
// ---------------------------------------------------------------------------
async function downscaleImage(
  bytes: Uint8Array,
  targetDpi: number,
  quality: number,
  rawParams?: { width: number; height: number; colorSpace: string }
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const hasDoc    = typeof document !== 'undefined';
  const hasOffscr = typeof OffscreenCanvas !== 'undefined';
  if (!hasDoc && !hasOffscr) return null;

  let width = 0, height = 0;
  let source: ImageBitmap | HTMLImageElement | ImageData | null = null;

  try {
    if (rawParams) {
      const { width: w, height: h, colorSpace } = rawParams;
      width = w; height = h;
      const isRGB  = colorSpace === 'DeviceRGB' || colorSpace === 'RGB';
      const isGray = colorSpace === 'DeviceGray' || colorSpace === 'Gray';
      if (!isRGB && !isGray) return null;
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        if (isRGB) {
          rgba[i*4]   = bytes[i*3];
          rgba[i*4+1] = bytes[i*3+1];
          rgba[i*4+2] = bytes[i*3+2];
        } else {
          rgba[i*4] = rgba[i*4+1] = rgba[i*4+2] = bytes[i];
        }
        rgba[i*4+3] = 255;
      }
      source = new ImageData(rgba as unknown as Uint8ClampedArray<ArrayBuffer>, w, h);
    } else {
      const blob = new Blob([bytes as BlobPart], { type: 'image/jpeg' });
      if (typeof createImageBitmap === 'function') {
        const bmp = await createImageBitmap(blob);
        width = bmp.width; height = bmp.height; source = bmp;
      } else if (hasDoc) {
        const img = await loadImageFromBlob(blob);
        width = img.width; height = img.height; source = img;
      }
    }
  } catch { return null; }

  if (!source) return null;

  const maxDim  = Math.max(width, height);
  const targetPx = Math.round(targetDpi * 8.27); // A4 long edge in inches
  // Skip JPEG images already at/below target resolution
  if (!rawParams && maxDim <= targetPx * 1.05) {
    if (source instanceof ImageBitmap) source.close();
    return null;
  }

  const scale  = targetPx > 0 ? Math.min(1, targetPx / maxDim) : 1;
  const tW     = Math.max(1, Math.round(width  * scale));
  const tH     = Math.max(1, Math.round(height * scale));

  let resultBlob: Blob | null = null;

  if (hasOffscr) {
    const cvs = new OffscreenCanvas(tW, tH);
    const ctx = cvs.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (source instanceof ImageData) {
      if (width === tW && height === tH) {
        ctx.putImageData(source, 0, 0);
      } else {
        const tmp = new OffscreenCanvas(width, height);
        (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D)!.putImageData(source, 0, 0);
        ctx.drawImage(tmp, 0, 0, tW, tH);
      }
    } else ctx.drawImage(source as ImageBitmap | HTMLImageElement, 0, 0, tW, tH);
    resultBlob = await cvs.convertToBlob({ type: 'image/jpeg', quality });
  } else if (hasDoc) {
    const cvs = document.createElement('canvas');
    cvs.width = tW; cvs.height = tH;
    const ctx = cvs.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (source instanceof ImageData) {
      const tmp = document.createElement('canvas');
      tmp.width = width; tmp.height = height;
      tmp.getContext('2d')!.putImageData(source, 0, 0);
      ctx.drawImage(tmp, 0, 0, tW, tH);
    } else ctx.drawImage(source as HTMLImageElement, 0, 0, tW, tH);
    resultBlob = await new Promise<Blob | null>(r => cvs.toBlob(r, 'image/jpeg', quality));
  }

  if (source instanceof ImageBitmap) source.close();
  if (!resultBlob) return null;
  return { bytes: new Uint8Array(await resultBlob.arrayBuffer()), width: tW, height: tH };
}

// ---------------------------------------------------------------------------
// Iterate all image XObjects and downscale/recompress them
// ---------------------------------------------------------------------------
async function downscaleDocumentImages(
  pdfDoc: any,
  targetDpi: number,
  quality: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  const allObjects   = pdfDoc.context.enumerateIndirectObjects() as [any, any][];
  const imageObjects = allObjects.filter(([, obj]) => {
    if (!(obj instanceof PDFRawStream)) return false;
    const sub = obj.dict.get(PDFName.of('Subtype'));
    return sub === PDFName.of('Image');
  });

  if (imageObjects.length === 0) return;

  const cache = new Map<string, { bytes: Uint8Array; width: number; height: number }>();

  for (let i = 0; i < imageObjects.length; i++) {
    const [ref, object] = imageObjects[i];

    if (onProgress) onProgress(Math.round(20 + (i / imageObjects.length) * 65));
    if (i % 3 === 0) await new Promise(r => setTimeout(r, 0)); // yield to React

    const filter  = object.dict.get(PDFName.of('Filter'));
    const isDCT   = filter === PDFName.of('DCTDecode') ||
      (filter instanceof PDFArray && filter.asArray().some((f: any) => f === PDFName.of('DCTDecode')));
    const isFlate = filter === PDFName.of('FlateDecode') ||
      (filter instanceof PDFArray && filter.asArray().some((f: any) => f === PDFName.of('FlateDecode')));

    if (!isDCT && !isFlate) continue;

    // Skip images with complex or CMYK colour spaces regardless of encoding
    const csEntry = object.dict.get(PDFName.of('ColorSpace'));
    if (csEntry instanceof PDFArray) continue; // Indexed / ICCBased / DeviceN arrays
    if (csEntry instanceof PDFName) {
      const csName = csEntry.asString().replace(/^\//, '');
      if (['DeviceCMYK', 'CMYK'].includes(csName)) continue;
    }

    let imageBytes = object.contents as Uint8Array;
    let rawParams: { width: number; height: number; colorSpace: string } | undefined;

    if (isFlate) {
      const decompressed = await decompressFlate(imageBytes);
      if (!decompressed) continue;

      const w   = object.dict.get(PDFName.of('Width'));
      const h   = object.dict.get(PDFName.of('Height'));
      const cs  = object.dict.get(PDFName.of('ColorSpace'));
      const bpc = object.dict.get(PDFName.of('BitsPerComponent'));
      if (!(w instanceof PDFNumber) || !(h instanceof PDFNumber) ||
          !(bpc instanceof PDFNumber) || bpc.asNumber() !== 8) continue;

      const width = w.asNumber(), height = h.asNumber();
      // Skip indexed/ICCBased/DeviceN — complex color spaces need different stride
      if (!(cs instanceof PDFName)) continue;
      const colorSpace = cs.asString().replace(/^\//, '');
      if (!['DeviceRGB', 'RGB', 'DeviceGray', 'Gray'].includes(colorSpace)) continue;
      const bpp = (colorSpace === 'DeviceRGB' || colorSpace === 'RGB') ? 3 : 1;

      const params = object.dict.get(PDFName.of('DecodeParms'));
      let predictor = 1;
      if (params instanceof PDFDict) {
        const p = params.get(PDFName.of('Predictor'));
        if (p instanceof PDFNumber) predictor = p.asNumber();
      }

      imageBytes = predictor >= 10
        ? unfilterPng(decompressed, width, height, bpp)
        : predictor > 1 ? (() => { return null as any; })() // unsupported
        : decompressed;

      if (!imageBytes) continue;
      rawParams = { width, height, colorSpace };
    }

    const hash   = hashBytes(imageBytes);
    const cached = cache.get(hash);

    const applyResult = (r: { bytes: Uint8Array; width: number; height: number }) => {
      const ns = PDFRawStream.of(object.dict, r.bytes);
      ns.dict.set(PDFName.of('Length'),           pdfDoc.context.obj(r.bytes.length));
      ns.dict.set(PDFName.of('Filter'),           PDFName.of('DCTDecode'));
      ns.dict.set(PDFName.of('Width'),            pdfDoc.context.obj(r.width));
      ns.dict.set(PDFName.of('Height'),           pdfDoc.context.obj(r.height));
      // Canvas always outputs RGB JPEG — ensure ColorSpace matches
      ns.dict.set(PDFName.of('ColorSpace'),       PDFName.of('DeviceRGB'));
      ns.dict.set(PDFName.of('BitsPerComponent'), pdfDoc.context.obj(8));
      ns.dict.delete(PDFName.of('DecodeParms'));
      pdfDoc.context.assign(ref, ns);
    };

    if (cached) { applyResult(cached); continue; }

    const result = await downscaleImage(imageBytes, targetDpi, quality, rawParams);
    if (result) { applyResult(result); cache.set(hash, result); }
  }
}

// ---------------------------------------------------------------------------
// Public entry — drop-in replacement called by compress.ts processor
// ---------------------------------------------------------------------------
export async function compressWithPureEngine(
  pdfData: ArrayBuffer,
  options: CompressPDFOptions,
  onProgress?: (pct: number, label: string) => void
): Promise<{ pdfBytes: ArrayBuffer; compressedSize: number }> {

  const report = async (pct: number, label: string) => {
    onProgress?.(pct, label);
    await new Promise(r => setTimeout(r, 0));
  };

  await report(5,  'Loading PDF library…');
  const pdfLib = await loadPdfLib();
  const { PDFDocument } = pdfLib as any;

  await report(10, 'Parsing PDF…');
  const pdfDoc = await PDFDocument.load(pdfData, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // Strip metadata
  if (options.removeMetadata) {
    await report(15, 'Removing metadata…');
    try {
      const ctx = pdfDoc.context;
      const infoEntry = ctx.trailerInfo.Info;
      if (infoEntry instanceof PDFRef) {
        const infoDict = ctx.lookupMaybe(infoEntry, PDFDict);
        if (infoDict) infoDict.keys().forEach((k: any) => infoDict.delete(k));
        ctx.delete(infoEntry);
      }
      ctx.trailerInfo.Info = undefined;
      const metaKey   = PDFName.of('Metadata');
      const metaEntry = pdfDoc.catalog.get(metaKey);
      if (metaEntry) {
        if (metaEntry instanceof PDFRef) ctx.delete(metaEntry);
        pdfDoc.catalog.delete(metaKey);
      }
    } catch { /* non-fatal */ }
  }

  // Image optimisation
  if (options.optimizeImages) {
    await report(20, 'Optimizing images…');
    const { dpi, jpegQuality } = QUALITY_SETTINGS[options.quality] ?? QUALITY_SETTINGS.medium;
    const targetDpi = options.customDpi && options.customDpi > 0 ? options.customDpi : dpi;
    const targetQuality = options.customJpegQuality && options.customJpegQuality > 0 && options.customJpegQuality <= 1.0
      ? options.customJpegQuality
      : jpegQuality;
    await downscaleDocumentImages(pdfDoc, targetDpi, targetQuality, pct => onProgress?.(pct, 'Compressing images…'));
  }

  await report(90, 'Saving PDF…');
  const objsPerTick = (options.quality === 'high' || options.quality === 'maximum') ? 500 : 50;
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: objsPerTick,
  });

  await report(100, 'Complete!');

  // Ensure we return a plain ArrayBuffer (not SharedArrayBuffer)
  const buf = (pdfBytes.buffer instanceof ArrayBuffer && !(pdfBytes.buffer instanceof SharedArrayBuffer))
    ? pdfBytes.buffer as ArrayBuffer
    : (() => { const c = new Uint8Array(pdfBytes.byteLength); c.set(pdfBytes); return c.buffer as ArrayBuffer; })();

  return { pdfBytes: buf, compressedSize: pdfBytes.byteLength };
}
