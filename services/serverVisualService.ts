import { Resvg } from '@resvg/resvg-js';

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

  if (!rawSvg.includes('<svg')) {
    throw new Error('Invalid SVG content: missing <svg element');
  }

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
