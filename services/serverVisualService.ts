import { Resvg } from '@resvg/resvg-js';

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

  const resvg = new Resvg(rawSvg, {
    fitTo: { mode: 'width', value: 1200 },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  if (!pngBuffer || pngBuffer.length === 0) {
    throw new Error('Failed to rasterize SVG: output PNG buffer is empty');
  }

  return pngBuffer;
}
