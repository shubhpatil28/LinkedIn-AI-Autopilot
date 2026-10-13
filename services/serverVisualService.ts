import { Resvg, ResvgRenderOptions } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

/**
 * Resolve the absolute path to a bundled font file under public/fonts/.
 * Returns null if the file cannot be found so callers can fail gracefully.
 */
function resolveFontPath(filename: string): string | null {
  // Vercel serverless functions run with process.cwd() = project root, and
  // the public/ directory is included via outputFileTracingIncludes.
  const candidates = [
    path.resolve(process.cwd(), 'public', 'fonts', filename),
    path.resolve(__dirname, '..', 'public', 'fonts', filename),
    path.resolve(__dirname, 'public', 'fonts', filename),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore FS errors on individual candidates
    }
  }
  return null;
}

/**
 * Build the resvg font options from fonts bundled under public/fonts/.
 *
 * Key decisions:
 *  - loadSystemFonts: false  → never rely on host OS fonts (Vercel Linux has none)
 *  - fontFiles: string[]     → resvg-js requires absolute file paths, not Buffers
 *  - sansSerifFamily / monospaceFamily → maps generic CSS families to our bundled fonts
 *
 * If a font file is missing, a warning is logged and rendering proceeds with
 * whatever fonts are available. The function never throws.
 */
function buildResvgFontOptions(): ResvgRenderOptions['font'] {
  const fontFilePaths: string[] = [];
  const missing: string[] = [];

  const wanted: Array<{ filename: string; desc: string }> = [
    { filename: 'Inter-Regular.ttf',      desc: 'Inter Regular (sans-serif)' },
    { filename: 'RobotoMono-Regular.ttf', desc: 'Roboto Mono Regular (monospace)' },
  ];

  for (const { filename, desc } of wanted) {
    const resolved = resolveFontPath(filename);
    if (resolved) {
      fontFilePaths.push(resolved);
    } else {
      missing.push(filename);
      console.warn(
        `[serverVisualService] WARNING: Bundled font not found: ${desc} (${filename}). ` +
        'Text may be invisible in the generated PNG. ' +
        'Ensure public/fonts/ is included in the Vercel serverless bundle.'
      );
    }
  }

  if (missing.length > 0 && fontFilePaths.length === 0) {
    console.error(
      '[serverVisualService] CRITICAL: No bundled fonts could be loaded. ' +
      'All SVG text will be invisible in the rendered PNG. ' +
      `Missing: ${missing.join(', ')}`
    );
  }

  return {
    fontFiles: fontFilePaths,
    loadSystemFonts: false,      // Deterministic — never depend on host OS fonts
    defaultFontFamily: 'Inter',
    sansSerifFamily: 'Inter',    // Maps font-family="sans-serif" → Inter
    monospaceFamily: 'Roboto Mono', // Maps font-family="monospace" → Roboto Mono
  };
}

export function validateSvgOutput(rawSvg: string): void {
  if (!rawSvg || typeof rawSvg !== 'string') {
    throw new Error('Invalid SVG input: expected non-empty string');
  }

  if (!rawSvg.includes('<svg')) {
    throw new Error('Invalid SVG content: missing <svg element');
  }

  if (rawSvg.includes('<foreignObject') || rawSvg.includes('foreignObject>')) {
    throw new Error('Invalid SVG content: foreignObject detected. Pure SVG text is required for resvg compatibility.');
  }

  if (!rawSvg.includes('1200') || !rawSvg.includes('630')) {
    throw new Error('Invalid SVG dimensions: 1200x630 canvas is required');
  }

  const textCount = (rawSvg.match(/<text/g) || []).length;
  if (textCount < 5) {
    throw new Error(`Invalid SVG density: expected at least 5 <text> elements, found ${textCount}`);
  }
}

/**
 * Validates that every <text> element in the SVG has non-empty text content.
 * Throws if any text element is found with blank content.
 */
export function validateSvgTextContent(rawSvg: string): void {
  // Match <text ...>CONTENT</text> — content must not be empty/whitespace only
  const emptyTextPattern = /<text[^>]*>\s*<\/text>/g;
  const empties = rawSvg.match(emptyTextPattern) || [];
  if (empties.length > 0) {
    throw new Error(
      `SVG contains ${empties.length} empty <text> element(s). ` +
      'All text elements must have non-empty visible content.'
    );
  }
}

export async function convertSvgToPngBuffer(svgStringOrDataUrl: string): Promise<Buffer> {
  if (!svgStringOrDataUrl || typeof svgStringOrDataUrl !== 'string') {
    throw new Error('Invalid SVG input: expected non-empty string or data URL');
  }

  let rawSvg = svgStringOrDataUrl.trim();
  if (rawSvg.startsWith('data:image/svg+xml')) {
    const commaIndex = rawSvg.indexOf(',');
    if (commaIndex !== -1) {
      rawSvg = decodeURIComponent(rawSvg.substring(commaIndex + 1));
    }
  }

  validateSvgOutput(rawSvg);
  validateSvgTextContent(rawSvg);

  const fontOptions = buildResvgFontOptions();

  const resvg = new Resvg(rawSvg, {
    fitTo: { mode: 'width', value: 1200 },
    font: fontOptions,
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  if (!pngBuffer || pngBuffer.length === 0) {
    throw new Error('Failed to rasterize SVG: output PNG buffer is empty');
  }

  return pngBuffer;
}
