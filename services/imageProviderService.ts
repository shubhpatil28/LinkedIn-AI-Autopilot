/**
 * Free-Only Image Provider Service
 * 
 * STRICT COST & SAFETY POLICY:
 *  - Option B (In-House SVG-to-PNG Vector Engine 2.0) is the EXCLUSIVE active engine.
 *  - Option A (Paid external image APIs: Google Imagen, OpenAI DALL-E, Stability, etc.)
 *    are PERMANENTLY DISABLED AND BLOCKED.
 *  - No environment configuration can activate a paid provider. Even if `IMAGE_PROVIDER=imagen`
 *    or `IMAGE_PROVIDER=openai-dalle` is set in .env, this service strictly blocks invocation
 *    and routes exclusively to the free in-house vector engine.
 *  - Zero external paid network calls are permitted.
 * 
 * Strictly server-side: Never exposes API keys or credentials to the client.
 * Truthful attribution: Accurately identifies `provider: 'svg-engine'`.
 */

import { VisualStyle } from '@/types';
import { generateEnrichedTopicVisualSvg, VisualEngineOptions } from './visualService';
import { convertSvgToPngBuffer, validateSvgOutput, validateSvgTextContent } from './serverVisualService';

export type FreeImageProviderId = 'svg-engine';
export type BlockedPaidProviderId = 'gemini-imagen' | 'imagen' | 'openai-dalle' | 'dalle' | 'stability';
export type ImageProviderId = FreeImageProviderId;

export const BLOCKED_PAID_PROVIDERS: readonly string[] = [
  'gemini-imagen',
  'imagen',
  'openai-dalle',
  'dalle',
  'stability',
  'custom-paid',
];

export interface ImageGenerationOptions extends VisualEngineOptions {
  topic: string;
  hook: string;
  body?: string;
  width?: number;
  height?: number;
  promptOverride?: string;
}

export interface GeneratedImageResult {
  imageUrl: string;
  buffer: Buffer;
  visualStyle: VisualStyle;
  visualTemplate: string;
  provider: ImageProviderId;
  dimensions: { width: number; height: number };
  contentType: 'image/png' | 'image/jpeg' | 'image/svg+xml';
}

export interface ImageProviderStatus {
  activeProvider: FreeImageProviderId;
  configuredProviderName: string;
  isPaidBlocked: boolean;
  model: string;
  fallbackAvailable: boolean;
  costNote: string;
}

/**
 * Checks whether a given provider name is a paid provider that must be blocked.
 */
export function isPaidProviderBlocked(providerName: string): boolean {
  if (!providerName) return false;
  const norm = providerName.toLowerCase().trim();
  return BLOCKED_PAID_PROVIDERS.some((p) => norm.includes(p) || p.includes(norm));
}

/**
 * Returns current configuration status.
 * Enforces that activeProvider is ALWAYS 'svg-engine' (zero-cost).
 */
export function getImageProviderStatus(): ImageProviderStatus {
  const rawConfigured = (process.env.IMAGE_PROVIDER || 'none').toLowerCase().trim();
  const isPaid = isPaidProviderBlocked(rawConfigured);

  if (isPaid) {
    console.warn(
      `[ImageProvider:Security] POLICY ENFORCED: Paid image provider "${rawConfigured}" is permanently blocked. ` +
      'Routing exclusively to in-house Free Vector Visual Engine 2.0 to prevent accidental billing.'
    );
  }

  return {
    activeProvider: 'svg-engine',
    configuredProviderName: rawConfigured,
    isPaidBlocked: isPaid,
    model: 'in-house-vector-engine-2.0',
    fallbackAvailable: true,
    costNote: '100% Free & Zero-Cost: In-House Vector Visual Engine 2.0 (Paid APIs permanently disabled)',
  };
}

/**
 * Main Image Generation Entrypoint
 * Exclusively executes the in-house Premium Vector Visual Engine 2.0 (Option B).
 * Paid providers cannot be invoked under any circumstances.
 */
export async function generatePostImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
  const status = getImageProviderStatus();
  const { topic, hook, body, recentHistory } = options;

  if (status.isPaidBlocked) {
    console.warn(
      `[ImageProvider] Intercepted attempt to use blocked paid provider "${status.configuredProviderName}". ` +
      'Generating with in-house Free Vector Visual Engine 2.0.'
    );
  }

  // Option B: Premium Vector Visual Engine 2.0 (Free, deterministic, 1200x630 resvg PNG)
  const enriched = generateEnrichedTopicVisualSvg(topic, hook, body, {
    style: options.style,
    template: options.template,
    recentHistory,
  });

  validateSvgOutput(enriched.svg);
  validateSvgTextContent(enriched.svg);

  const pngBuffer = await convertSvgToPngBuffer(enriched.svg);
  if (!pngBuffer || pngBuffer.length < 10000) {
    throw new Error(`Generated PNG buffer is unexpectedly small (${pngBuffer?.length || 0} bytes).`);
  }

  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enriched.svg)}`;

  return {
    imageUrl,
    buffer: pngBuffer,
    visualStyle: enriched.visualStyle,
    visualTemplate: enriched.visualTemplate,
    provider: 'svg-engine',
    dimensions: { width: 1200, height: 630 },
    contentType: 'image/svg+xml',
  };
}
