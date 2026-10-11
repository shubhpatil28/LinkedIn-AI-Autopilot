import fs from 'fs';
import path from 'path';
import { generateTopicVisualSvg } from '../services/visualService';
import { convertSvgToPngBuffer } from '../services/serverVisualService';

async function main() {
  const topic = 'AI & LLMs';
  const hook = '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.';
  const body = `Autonomous AI workflows sound incredible until an unhandled edge case causes infinite API loops.

3 safety practices for building production-ready AI tools:

1. Deterministic Guardrails: Set hard upper bounds on execution steps and token consumption.
2. Human-in-the-Loop Triggers: Require explicit user approval for destructive or high-cost operations.
3. Comprehensive Audit Tracing: Log prompt inputs, model responses, and tool arguments for observability.`;

  console.log('Generating SVG for AI Agent Safety post...');
  const svg = generateTopicVisualSvg(topic, hook, body);

  console.log('Converting SVG to PNG Buffer via resvg...');
  const pngBuffer = await convertSvgToPngBuffer(svg);

  // 1. Ensure tmp directory exists and save
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpOutPath = path.join(tmpDir, 'preview_infographic.png');
  fs.writeFileSync(tmpOutPath, pngBuffer);
  console.log(`Saved PNG to ${tmpOutPath} (${pngBuffer.length} bytes)`);

  // 2. Also save to current brain artifact directory if accessible
  const artifactDir = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\3577233a-dec0-44f6-87a5-9aebb34557cc';
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'preview_infographic.png'), pngBuffer);
    console.log(`Saved PNG artifact to ${path.join(artifactDir, 'preview_infographic.png')}`);
  }

  // 3. Save raw SVG for reference
  fs.writeFileSync(path.join(tmpDir, 'preview_infographic.svg'), svg);
  console.log('Saved SVG preview to tmp/preview_infographic.svg');

  // Also test TypeScript code layout
  const tsSvg = generateTopicVisualSvg(
    'TypeScript & JavaScript',
    '⚡ 4 Advanced TypeScript Patterns for Robust Architecture',
    'Here are 4 advanced TypeScript patterns every senior developer should know: discriminated unions, satisfies operator, and brand types.'
  );
  const tsPng = await convertSvgToPngBuffer(tsSvg);
  fs.writeFileSync(path.join(tmpDir, 'preview_typescript.png'), tsPng);
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'preview_typescript.png'), tsPng);
  }
  console.log('Saved TypeScript preview to tmp/preview_typescript.png');

  // Also test React layout
  const reactSvg = generateTopicVisualSvg(
    'React & Next.js',
    '💡 React 19 Server Actions & Server Components Architecture',
    'React 19 Server Actions fundamentally simplify client-server communication without REST boilerplate.'
  );
  const reactPng = await convertSvgToPngBuffer(reactSvg);
  fs.writeFileSync(path.join(tmpDir, 'preview_react.png'), reactPng);
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'preview_react.png'), reactPng);
  }
  console.log('Saved React preview to tmp/preview_react.png');
}

main().catch((err) => {
  console.error('Failed to generate preview:', err);
  process.exit(1);
});
