/**
 * QPDF WebAssembly Loader
 *
 * Loads the QPDF Emscripten module for PDF structural compression.
 * Uses a private module key (not window.Module) to avoid conflicts with
 * other QPDF consumers (encrypt.ts, decrypt.ts, remove-restrictions.ts)
 * which all share the global window.Module slot.
 */

let qpdfInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Resolve the public root URL for the application, respecting sub-path deployments.
 * Returns a full URL string ending in '/'.
 */
function resolveBaseUrl(): string {
  if (typeof window === 'undefined') return '/';

  // Check for a _next script to detect the base path
  const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
  const nextScript = scripts.find((s) => s.src.includes('/_next/'));

  if (nextScript) {
    try {
      const scriptUrl = new URL(nextScript.src);
      const nextIndex = scriptUrl.pathname.indexOf('/_next/');
      if (nextIndex > 0) {
        const basePath = scriptUrl.pathname.slice(0, nextIndex);
        return `${scriptUrl.origin}${basePath}/`;
      }
    } catch {
      // fall through
    }
  }

  return `${window.location.origin}/`;
}

/**
 * Dynamically inject a <script> tag and wait for it to load.
 */
function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already injected
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load and initialise the QPDF WASM module.
 *
 * Key design decisions:
 * - We use a dedicated `__QPDFCompressModule` key on window rather than
 *   the shared `Module` to avoid clobbering encrypt/decrypt/remove-restrictions.
 * - callMain() throws an Emscripten `ExitStatus` object on normal exit — we
 *   catch that and treat exit code 0 (or 3 = warnings) as success.
 * - We slice the output Uint8Array to detach it from the shared WASM heap before
 *   unlink so the bytes stay valid after cleanup.
 */
export async function loadQPDF(): Promise<any> {
  if (qpdfInstance) return qpdfInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const baseUrl = resolveBaseUrl();
      const qpdfJsUrl = `${baseUrl}qpdf.js`;
      const qpdfWasmUrl = `${baseUrl}qpdf.wasm`;

      // Inject the script if not already present
      await injectScript(qpdfJsUrl);

      // The qpdf.js script assigns its factory to the global `Module`.
      // We capture it and immediately clear the global so other consumers
      // (encrypt, decrypt, remove-restrictions) can use window.Module for
      // their own fresh instantiation without interference.
      const factory = (window as any).Module;
      if (typeof factory !== 'function') {
        throw new Error(
          'QPDF factory not found after script load. ' +
          'Expected window.Module to be a function.'
        );
      }

      // Immediately remove from global so it does not clash with other users
      delete (window as any).Module;

      // Instantiate a private module instance
      const ModuleInstance = await factory({
        noInitialRun: true,
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) return qpdfWasmUrl;
          return path;
        },
      });

      qpdfInstance = {
        _mod: ModuleInstance,

        /**
         * Compress a PDF using QPDF structural compression.
         *
         * @param pdfData - Input PDF as Uint8Array
         * @param options - Compression options
         * @returns Compressed PDF as a new, heap-independent Uint8Array
         */
        async compress(
          pdfData: Uint8Array,
          options: { linearize?: boolean; compressStreams?: boolean } = {}
        ): Promise<Uint8Array> {
          const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const inputPath = `/qpdf_in_${uid}.pdf`;
          const outputPath = `/qpdf_out_${uid}.pdf`;

          // Write input to WASM virtual FS
          ModuleInstance.FS.writeFile(inputPath, pdfData);

          // Build QPDF CLI arguments
          const args: string[] = [];
          if (options.compressStreams !== false) {
            args.push('--compress-streams=y');
          }
          args.push('--object-streams=generate');
          if (options.linearize) {
            args.push('--linearize');
          }
          args.push(inputPath, outputPath);

          // callMain throws an ExitStatus exception on both success and failure.
          // Exit code 0 = success, 3 = warnings only (both acceptable).
          let exitCode = 0;
          try {
            exitCode = ModuleInstance.callMain(args);
          } catch (ex: any) {
            // Emscripten throws { name: 'ExitStatus', status: N }
            if (ex && ex.name === 'ExitStatus') {
              exitCode = ex.status ?? ex.code ?? 0;
            } else {
              // Real unexpected error — clean up and rethrow
              try { ModuleInstance.FS.unlink(inputPath); } catch { /* ignore */ }
              try { ModuleInstance.FS.unlink(outputPath); } catch { /* ignore */ }
              throw ex;
            }
          }

          // Read result — QPDF exit codes: 0 = success, 3 = warnings
          let rawResult: Uint8Array | null = null;
          try {
            rawResult = ModuleInstance.FS.readFile(outputPath);
          } catch {
            // output file absent means compression truly failed
          }

          // Cleanup virtual FS
          try { ModuleInstance.FS.unlink(inputPath); } catch { /* ignore */ }
          try { ModuleInstance.FS.unlink(outputPath); } catch { /* ignore */ }

          if (!rawResult || rawResult.byteLength === 0) {
            throw new Error(
              `QPDF compression failed (exit code ${exitCode}). ` +
              `Output file was not produced.`
            );
          }

          // IMPORTANT: rawResult is a view onto the shared WASM heap (HEAPU8).
          // We must slice() to get an independent ArrayBuffer before the heap
          // can be grown/moved or the file unlinked.
          return rawResult.slice();
        },
      };

      return qpdfInstance;
    } catch (error) {
      // Allow retrying on next call
      loadingPromise = null;
      qpdfInstance = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Reset loader state (for testing).
 */
export function resetQPDF(): void {
  qpdfInstance = null;
  loadingPromise = null;
}
