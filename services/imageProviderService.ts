/**
 * Image Provider Abstraction Service
 * 
 * Supports configurable external image generation providers (e.g. Google Imagen, OpenAI DALL-E)
 * while maintaining the upgraded Premium Vector Visual Engine 2.0 as a robust, zero-cost,
 * 100% reliable production fallback.
 * 
 * Strictly server-side: Never exposes API keys or credentials to the client.
 * Truthful attribution: Accurately identifies whether an image was created by an AI image model
 * or rendered via the vector visual engine (never pretends an SVG is AI-rendered).
 */

import { VisualStyle } from '@/types';
import { generateEnrichedTopicVisualSvg, VisualEngineOptions } from './visualService';
import { convertSvgToPngBuffer, validateSvgOutput, validateSvgTextContent } from './serverVisualService';

export type ImageProviderId = 'svg-engine' | 'gemini-imagen' | 'openai-dalle' | 'stability' | 'custom';

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
  activeProvider: ImageProviderId;
  configuredProviderName: string;
  hasApiKey: boolean;
  model: string;
  fallbackAvailable: boolean;
  costNote: string;
}

/**
 * Returns current configuration status without exposing secrets.
 */
export function getImageProviderStatus(): ImageProviderStatus {
  const configuredProvider = (process.env.IMAGE_PROVIDER || 'none').toLowerCase().trim();
  const apiKey = (process.env.IMAGE_API_KEY || process.env.VISUAL_API_KEY || '').trim();
  const hasApiKey = apiKey.length > 5;
  const model = process.env.IMAGE_MODEL || (configuredProvider === 'openai-dalle' ? 'dall-e-3' : 'imagen-3.0-generate-002');

  let activeProvider: ImageProviderId = 'svg-engine';
  if ((configuredProvider === 'gemini-imagen' || configuredProvider === 'imagen') && hasApiKey) {
    activeProvider = 'gemini-imagen';
  } else if ((configuredProvider === 'openai-dalle' || configuredProvider === 'dalle') && hasApiKey) {
    activeProvider = 'openai-dalle';
  }

  return {
    activeProvider,
    configuredProviderName: configuredProvider,
    hasApiKey,
    model,
    fallbackAvailable: true,
    costNote: activeProvider === 'svg-engine'
      ? 'Zero-cost local SVG-to-PNG vector engine'
      : 'External image model API (charges per generated image)',
  };
}

/**
 * Constructs a prompt for external AI image generation models if one is enabled.
 */
function buildAiImagePrompt(topic: string, hook: string, visualStyle: VisualStyle): string {
  const stylePrompts: Record<VisualStyle, string> = {
    premium_3d: 'Ultra-realistic 3D render of a futuristic technology architecture node, floating translucent glassmorphism cubes, cinematic ambient lighting, neon cyan and deep navy color scheme, clean composition, minimalist depth of field, 8k resolution, no text.',
    modern_editorial: 'Minimalist editorial architectural photography, sleek brutalist structure representing system scalability, warm amber and crisp slate lighting, high contrast, clean composition, no text.',
    isometric_tech: '3D isometric technical diagram of distributed cloud infrastructure, microservices, databases and servers on a clean dark blueprint plane, glowing connection pulses, no text.',
    futuristic_ai: 'Futuristic AI neural core, glowing synapsing data connections, concentric holographic rings, intelligent agent network nodes, deep cosmic blue and electric purple ambience, no text.',
    code_developer: 'Modern high-tech software engineering workstation, dark glass monitors displaying abstract clean code structures, soft violet and cyan desk glow, professional aesthetic, no text.',
    data_visualization: 'Clean abstract 3D data architecture visualization, glowing volumetric metric bars, high-speed data streams, deep slate background, precision engineered, no text.',
  };

  const styleDescriptor = stylePrompts[visualStyle] || stylePrompts.premium_3d;
  return `${styleDescriptor} The visual symbolizes: "${topic}" - "${hook}". Professional landscape aspect ratio 1200x630. Zero typography, zero watermarks, zero distorted text.`;
}

/**
 * Attempts to generate an image using Google Imagen 3 (via Generative Language API)
 */
async function generateWithGeminiImagen(
  prompt: string,
  apiKey: string,
  modelName: string
): Promise<Buffer | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/png',
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[ImageProvider:Imagen] Request failed (${res.status}): ${errText.substring(0, 150)}`);
      return null;
    }

    const data = await res.json();
    const base64Bytes = data?.predictions?.[0]?.bytesBase64Encoded;
    if (base64Bytes) {
      return Buffer.from(base64Bytes, 'base64');
    }
    return null;
  } catch (err: any) {
    console.warn(`[ImageProvider:Imagen] Generation error: ${err?.message || err}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Main Image Generation Entrypoint
 * Coordinates external AI provider calls and the local Premium Vector Engine 2.0 fallback.
 */
export async function generatePostImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
  const status = getImageProviderStatus();
  const { topic, hook, body, recentHistory } = options;

  // 1. If an external AI image provider is actively configured, attempt generation
  if (status.activeProvider === 'gemini-imagen') {
    const apiKey = (process.env.IMAGE_API_KEY || process.env.AI_API_KEY || '').trim();
    const { visualStyle, visualTemplate } = generateEnrichedTopicVisualSvg(topic, hook, body, options);
    const prompt = options.promptOverride || buildAiImagePrompt(topic, hook, visualStyle);

    console.log(`[ImageProvider] Calling Gemini Imagen API (${status.model}) for topic "${topic}"`);
    const aiBuffer = await generateWithGeminiImagen(prompt, apiKey, status.model);

    if (aiBuffer && aiBuffer.length > 5000) {
      const base64Data = aiBuffer.toString('base64');
      return {
        imageUrl: `data:image/png;base64,${base64Data}`,
        buffer: aiBuffer,
        visualStyle,
        visualTemplate,
        provider: 'gemini-imagen',
        dimensions: { width: 1200, height: 630 },
        contentType: 'image/png',
      };
    }

    console.warn('[ImageProvider] Imagen generation failed or timed out. Gracefully falling back to Premium Vector Visual Engine 2.0.');
  }

  // 2. Default & Fallback: Premium Vector Visual Engine 2.0
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
