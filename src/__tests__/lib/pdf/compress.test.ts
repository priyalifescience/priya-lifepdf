import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompressPDFProcessor, createCompressProcessor, compressPDF } from '@/lib/pdf/processors/compress';
import { PDFErrorCode } from '@/types/pdf';

// Polyfill arrayBuffer for Node/jsdom environments where it might be missing
if (typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Response(this).arrayBuffer();
  };
}
if (typeof File.prototype.arrayBuffer !== 'function') {
  File.prototype.arrayBuffer = function (this: File) {
    return new Response(this).arrayBuffer();
  };
}

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock PyMuPDF loader
vi.mock('@/lib/pdf/pymupdf-loader', () => {
  const mockInstance = {
    compress: vi.fn().mockImplementation(async (file: File) => {
      const ab = await file.arrayBuffer();
      return new Blob([ab], { type: 'application/pdf' });
    }),
    photonCompress: vi.fn().mockImplementation(async (file: File) => {
      const ab = await file.arrayBuffer();
      return new Blob([ab], { type: 'application/pdf' });
    }),
  };
  return {
    loadPyMuPDF: vi.fn().mockResolvedValue(mockInstance),
    resetPyMuPDF: vi.fn(),
  };
});

// Mock the pure-JS engine (replaces QPDF in standard path)
// Avoids needing canvas / OffscreenCanvas in jsdom
vi.mock('@/lib/pdf/processors/compress-engine', () => ({
  compressWithPureEngine: vi.fn().mockImplementation(
    async (pdfData: ArrayBuffer, _options: any, onProgress?: any) => {
      onProgress?.(100, 'Complete!');
      return { pdfBytes: pdfData, compressedSize: pdfData.byteLength };
    }
  ),
}));

// Stub Worker so tests don't fail on missing worker files
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  postMessage(data: any) {
    setTimeout(() => {
      this.onmessage?.({
        data: {
          status: 'success',
          pdfBytes: data.pdfData,
          originalSize: data.pdfData?.byteLength ?? 0,
          compressedSize: data.pdfData?.byteLength ?? 0,
        },
      } as MessageEvent);
    }, 10);
  }
  terminate = vi.fn();
}
vi.stubGlobal('Worker', MockWorker);

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Create a real minimal PDF using pdf-lib */
async function createRealPDFFile(name: string, pageCount = 1): Promise<File> {
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) pdfDoc.addPage([612, 792]);
  const pdfBytes = await pdfDoc.save();
  const ab = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  const file = new File([ab], name, { type: 'application/pdf' });
  if (typeof file.arrayBuffer !== 'function') {
    Object.defineProperty(file, 'arrayBuffer', { value: async () => ab });
  }
  return file;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CompressPDFProcessor', () => {
  let processor: CompressPDFProcessor;
  let mockFile: File;

  beforeEach(async () => {
    vi.clearAllMocks();
    processor = createCompressProcessor();
    mockFile = await createRealPDFFile('test_doc.pdf', 2);
  });

  // ── Input validation ──────────────────────────────────────────────────────

  describe('process - input validation', () => {
    it('should return error when no files are provided', async () => {
      const result = await processor.process({
        files: [],
        options: { algorithm: 'condense' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PDFErrorCode.INVALID_OPTIONS);
      expect(result.error?.message).toContain('one PDF file');
    });

    it('should return error when multiple files are provided', async () => {
      const file1 = await createRealPDFFile('doc1.pdf', 1);
      const file2 = await createRealPDFFile('doc2.pdf', 1);
      const result = await processor.process({
        files: [file1, file2],
        options: { algorithm: 'condense' },
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PDFErrorCode.INVALID_OPTIONS);
    });
  });

  // ── Algorithm routing ─────────────────────────────────────────────────────

  describe('process - algorithms', () => {
    it('standard algorithm → pure-JS engine', async () => {
      const result = await processor.process({
        files: [mockFile],
        options: { algorithm: 'standard', optimizeImages: true },
      });
      expect(result.success).toBe(true);
      expect(result.result).toBeInstanceOf(Blob);
      expect(result.filename).toBe('test_doc_compressed.pdf');
    });

    it('condense algorithm → PyMuPDF clean', async () => {
      const result = await processor.process({
        files: [mockFile],
        options: { algorithm: 'condense', quality: 'high', removeMetadata: true },
      });
      expect(result.success).toBe(true);
      expect(result.result).toBeInstanceOf(Blob);
      expect(result.filename).toBe('test_doc_compressed.pdf');
    });

    it('photon algorithm → PyMuPDF rasterize', async () => {
      const result = await processor.process({
        files: [mockFile],
        options: { algorithm: 'photon', photonDpi: 150 },
      });
      expect(result.success).toBe(true);
      expect(result.result).toBeInstanceOf(Blob);
      expect(result.filename).toBe('test_doc_compressed.pdf');
    });
  });

  // ── Convenience function ──────────────────────────────────────────────────

  describe('convenience function', () => {
    it('compressPDF() convenience function works', async () => {
      const result = await compressPDF(mockFile, { algorithm: 'condense' });
      expect(result.success).toBe(true);
      expect(result.result).toBeInstanceOf(Blob);
    });
  });
});
