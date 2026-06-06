import { describe, it, expect } from 'vitest';
import { compressWithPureEngine } from '@/lib/pdf/processors/compress-engine';
import { PDFDocument } from 'pdf-lib';

describe('compressWithPureEngine', () => {
  it('should compress a simple PDF document structurally', async () => {
    // Create a real minimal PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([612, 792]);
    const pdfBytes = await pdfDoc.save();
    const ab = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer;

    const result = await compressWithPureEngine(ab, {
      algorithm: 'standard',
      quality: 'medium',
      removeMetadata: true,
      optimizeImages: true,
      removeUnusedObjects: true,
    });

    expect(result).toBeDefined();
    expect(result.pdfBytes).toBeInstanceOf(ArrayBuffer);
    expect(result.compressedSize).toBeGreaterThan(0);

    // Verify it is a valid PDF
    const parsedDoc = await PDFDocument.load(result.pdfBytes);
    expect(parsedDoc.getPageCount()).toBe(1);
  });
});
