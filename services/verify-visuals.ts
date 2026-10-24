/**
 * Visual verification: generates a PNG for each diagram layout using the
 * production renderer path, and saves them to tmp/ for visual inspection.
 */
import fs from 'fs';
import path from 'path';
import { generateTopicVisualSvg } from './visualService';
import { convertSvgToPngBuffer } from './serverVisualService';

const tmpDir = path.resolve(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const tests = [
  { topic: 'AI & LLMs',              hook: 'Production AI agent safety guardrails', body: 'Deterministic guardrails and human-in-the-loop triggers for AI safety.' },
  { topic: 'TypeScript & JavaScript', hook: 'Advanced TypeScript design patterns',  body: '' },
  { topic: 'React & Next.js',         hook: 'React 19 Server Components Architecture', body: '' },
  { topic: 'Backend & Databases',     hook: 'Idempotent API processing pipeline',   body: '' },
];

async function main() {
  for (const { topic, hook, body } of tests) {
    const svg = generateTopicVisualSvg(topic, hook, body);
    const pngBuffer = await convertSvgToPngBuffer(svg);
    const slug = topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const outPath = path.join(tmpDir, `infographic-${slug}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`SAVED: ${topic} — ${pngBuffer.length} bytes → ${outPath}`);
  }
  console.log('\nAll PNGs generated. Open tmp/ to inspect text visibility.');
}

main().catch((err) => {
  console.error('ERROR:', String(err));
  process.exit(1);
});
