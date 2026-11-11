/**
 * Generation & Verification Script for Premium AI Visual Generation Engine 2.0
 * Generates 8 distinct sample images across the 8 required technical topic categories,
 * validates their SVG and rasterized PNG outputs, and builds a comprehensive contact sheet.
 */

import fs from 'fs';
import path from 'path';
import { generateEnrichedTopicVisualSvg } from '../services/visualService';
import { convertSvgToPngBuffer, validateSvgOutput, validateSvgTextContent } from '../services/serverVisualService';
import { generatePostImage } from '../services/imageProviderService';
import { validateVisualQuality } from '../services/visualValidationService';

interface TopicSample {
  id: string;
  topic: string;
  hook: string;
  body: string;
  expectedStyle: string;
  targetCategory: string;
}

const SAMPLE_TOPICS: TopicSample[] = [
  {
    id: '01_ai_agents',
    topic: 'AI & LLMs',
    hook: '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.',
    body: 'Autonomous AI workflows sound incredible until an unhandled edge case causes infinite API loops.\n\n3 safety practices for building production-ready AI tools:\n1. Deterministic Guardrails: Set hard upper bounds on execution steps and token consumption.\n2. Human-in-the-Loop Triggers: Require explicit user approval for destructive or high-cost operations.\n3. Comprehensive Audit Tracing: Log prompt inputs, model responses, and tool arguments for observability.',
    expectedStyle: 'futuristic_ai',
    targetCategory: 'AI / LLM / AI Agents',
  },
  {
    id: '02_rag_vector_db',
    topic: 'RAG & Vector Search Systems',
    hook: '📊 RAG architecture in 2026: Why naive vector search is failing your enterprise data.',
    body: 'Vector embeddings are great at finding semantic similarity, but terrible at exact keywords and domain constraints.\n\nHow modern enterprise RAG systems fix this:\n1. Hybrid Dense + Lexical Search\n2. Semantic Caching\n3. Re-ranking & Deduplication.',
    expectedStyle: 'data_visualization',
    targetCategory: 'RAG / MCP / Vector Databases',
  },
  {
    id: '03_react_typescript',
    topic: 'TypeScript & Next.js Architecture',
    hook: '⚡ Advanced TypeScript & Next.js patterns for type-safe scalable frontend architecture.',
    body: 'Modern React and Next.js applications require robust type-level contracts and discriminated unions.\n\nKey architectural pillars:\n1. Discriminated Result Unions: Eliminate unsafe runtime casts\n2. Satisfies Operator: Strict structure validation\n3. Brand Types: Prevent primitive ID collisions\n4. Server Component Boundaries: Zero client bundle overhead.',
    expectedStyle: 'code_developer',
    targetCategory: 'React / Next.js / TypeScript',
  },
  {
    id: '04_system_design',
    topic: 'System Design & Microservices',
    hook: '🏗️ Designing resilient distributed microservices: Event streaming, partitioned brokers, and failure domains.',
    body: 'Asynchronous decoupled events prevent cascading network failures across distributed services.\n\n3 key design rules:\n1. Partitioned Kafka event brokers\n2. Stateless autoscaling worker fleet\n3. Multi-region sharded replica storage.',
    expectedStyle: 'isometric_tech',
    targetCategory: 'System Design / Microservices',
  },
  {
    id: '05_backend_apis',
    topic: 'Backend & Databases',
    hook: '⚡ Idempotent API processing: How to prevent duplicate billing and race conditions on retries.',
    body: 'Network timeouts cause clients to retry requests, which can lead to double billing.\n\n4-stage pipeline:\n1. API Gateway: Idempotency Key validation\n2. Redis Cache Lock: Atomic distributed lock\n3. Core Processor: ACID DB transaction\n4. Response Cache: 24h deduplication TTL.',
    expectedStyle: 'premium_3d',
    targetCategory: 'Backend / APIs / Databases',
  },
  {
    id: '06_devops_k8s',
    topic: 'DevOps & Kubernetes',
    hook: '🚀 Production-grade CI/CD and canary rollouts: Promoting immutable container artifacts with zero downtime.',
    body: 'Modern software delivery requires automated verification gates before code reaches production.\n\n4 pipeline stages:\n1. Static Analysis: TypeScript & ESLint gates\n2. Parallel Tests: Fast unit and integration tests\n3. Ephemeral Staging: Isolated preview environments\n4. Canary Rollout: Automatic instant rollback if errors spike.',
    expectedStyle: 'isometric_tech',
    targetCategory: 'DevOps / Docker / Kubernetes',
  },
  {
    id: '07_cybersecurity',
    topic: 'Cybersecurity & Zero Trust',
    hook: '🛡️ Zero-Trust Architecture in production: Never trust, always verify every single RPC call.',
    body: 'Perimeter-based network security is dead. Modern defense assumes the internal network is already breached.\n\n4 zero-trust controls:\n1. Identity Attestation: Short-lived mTLS & ephemeral tokens\n2. Policy Engine: Continuous dynamic authorization\n3. Threat Filtering: Automated anomaly interception\n4. Audit Vault: Cryptographically signed immutable logs.',
    expectedStyle: 'premium_3d',
    targetCategory: 'Cybersecurity',
  },
  {
    id: '08_engineering_leadership',
    topic: 'Engineering Leadership & Career',
    hook: '🧭 Core engineering principles for Staff Engineers: Why simplicity in design creates operational resilience at scale.',
    body: 'Senior engineering is about choosing what NOT to build.\n\n3 timeless principles:\n1. Optimize for mean-time-to-recovery (MTTR) over MTBF\n2. Interface boundaries matter infinitely more than internal details\n3. Boring, battle-tested technology compounds reliability over time.',
    expectedStyle: 'modern_editorial',
    targetCategory: 'Engineering / Career',
  },
  {
    id: '09_runtime_deployment',
    topic: 'Cloud Infrastructure & Kubernetes',
    hook: "Deploying a simple web service to production shouldn't require a master's degree in cluster management.",
    body: 'Modern cloud deployments should be predictable, resilient, and simple to operate.\n\nKey architecture components:\n1. Edge Gateway & Ingress\n2. High-availability Load Balancer\n3. Container Orchestration & Pod scheduling\n4. Application Microservices\n5. Distributed ACID Database\n6. Real-time Telemetry & Monitoring.',
    expectedStyle: 'isometric_tech',
    targetCategory: 'Cloud Infrastructure / Runtime Deployment',
  },
];

async function main() {
  console.log('============================================================');
  console.log('PREMIUM AI VISUAL GENERATION ENGINE 2.0 - VERIFICATION');
  console.log('============================================================\n');

  const tmpPreviewDir = path.join(process.cwd(), 'tmp', 'previews');
  if (!fs.existsSync(tmpPreviewDir)) {
    fs.mkdirSync(tmpPreviewDir, { recursive: true });
  }

  // Conversation artifact directory
  const artifactDir = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\9720e352-cbdb-490d-bdee-22b676d02bfb';
  const artifactPreviewDir = path.join(artifactDir, 'previews');
  if (fs.existsSync(artifactDir)) {
    if (!fs.existsSync(artifactPreviewDir)) {
      fs.mkdirSync(artifactPreviewDir, { recursive: true });
    }
  }

  const generatedRecords: Array<{
    sample: TopicSample;
    visualStyle: string;
    visualTemplate: string;
    pngSize: number;
    svgSize: number;
    pngPath: string;
    svgPath: string;
    dimensions: string;
  }> = [];

  for (const sample of SAMPLE_TOPICS) {
    console.log(`[Engine 2.0] Generating visual for "${sample.topic}" (${sample.targetCategory})...`);

    // 1. Generate via image provider service
    const result = await generatePostImage({
      topic: sample.topic,
      hook: sample.hook,
      body: sample.body,
    });

    // 2. Validate SVG content & Visual Engine 3.0 Quality Layer
    let rawSvg = result.imageUrl;
    if (rawSvg.startsWith('data:image/svg+xml')) {
      const commaIdx = rawSvg.indexOf(',');
      rawSvg = decodeURIComponent(rawSvg.substring(commaIdx + 1));
    }
    validateSvgOutput(rawSvg);
    validateSvgTextContent(rawSvg);
    const qualityReport = validateVisualQuality(rawSvg);
    if (!qualityReport.valid) {
      throw new Error(`Visual Quality audit failed for ${sample.id}:\n${qualityReport.errors.join('\n')}`);
    }

    // 3. Convert to PNG buffer
    const pngBuffer = await convertSvgToPngBuffer(rawSvg);

    // Verify PNG binary signature header: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      pngBuffer[0] === 0x89 &&
      pngBuffer[1] === 0x50 &&
      pngBuffer[2] === 0x4e &&
      pngBuffer[3] === 0x47;
    if (!isPng) {
      throw new Error(`Output for ${sample.id} is not a valid PNG binary file`);
    }

    if (pngBuffer.length < 15000) {
      throw new Error(`PNG size for ${sample.id} (${pngBuffer.length} bytes) is suspiciously small`);
    }

    // 4. Save PNG & SVG to tmp/previews
    const pngFileName = `${sample.id}.png`;
    const svgFileName = `${sample.id}.svg`;
    const tmpPngPath = path.join(tmpPreviewDir, pngFileName);
    const tmpSvgPath = path.join(tmpPreviewDir, svgFileName);

    fs.writeFileSync(tmpPngPath, pngBuffer);
    fs.writeFileSync(tmpSvgPath, rawSvg, 'utf8');

    // 5. Also copy to brain artifact previews directory
    if (fs.existsSync(artifactPreviewDir)) {
      fs.writeFileSync(path.join(artifactPreviewDir, pngFileName), pngBuffer);
      fs.writeFileSync(path.join(artifactPreviewDir, svgFileName), rawSvg, 'utf8');
    }

    console.log(
      `  -> OK: Saved ${pngFileName} (${pngBuffer.length.toLocaleString()} bytes, style: ${result.visualStyle}, template: ${result.visualTemplate})`
    );

    generatedRecords.push({
      sample,
      visualStyle: result.visualStyle,
      visualTemplate: result.visualTemplate,
      pngSize: pngBuffer.length,
      svgSize: Buffer.byteLength(rawSvg, 'utf8'),
      pngPath: tmpPngPath,
      svgPath: tmpSvgPath,
      dimensions: '1200 x 630',
    });
  }

  // 6. Build HTML Contact Sheet
  console.log('\n[Engine 3.0] Building visual contact sheet...');
  const contactSheetHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LinkedIn AI Autopilot - Premium Visual Engine 3.0 Contact Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030712;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      padding: 40px 24px;
      line-height: 1.5;
    }
    header {
      max-width: 1400px;
      margin: 0 auto 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid #1F2937;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #38BDF8;
      margin-bottom: 8px;
    }
    p.lead {
      color: #94A3B8;
      font-size: 15px;
    }
    .badge-bar {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .pill {
      background: #111827;
      border: 1px solid #374151;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #E5E7EB;
    }
    .grid {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(620px, 1fr));
      gap: 32px;
    }
    .card {
      background: #0B1120;
      border: 1px solid #1E293B;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .img-wrapper {
      position: relative;
      background: #020617;
      border-bottom: 1px solid #1E293B;
    }
    .img-wrapper img {
      width: 100%;
      height: auto;
      display: block;
      aspect-ratio: 1200 / 630;
      object-fit: cover;
    }
    .meta {
      padding: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .meta-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .topic-tag {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #38BDF8;
    }
    .style-tag {
      background: #1E293B;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      color: #A5B4FC;
    }
    .hook-title {
      font-size: 15px;
      font-weight: 700;
      color: #F8FAFC;
      margin-bottom: 12px;
    }
    .details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid #1E293B;
      padding-top: 12px;
      margin-top: 8px;
    }
    .details span strong {
      color: #CBD5E1;
    }
  </style>
</head>
<body>
  <header>
    <h1>Premium AI Visual Generation Engine 2.0 - Contact Sheet</h1>
    <p class="lead">8 Distinct Technical Visual Archetypes Generated for LinkedIn Landscape (1200x630)</p>
    <div class="badge-bar">
      <span class="pill">Resolution: 1200 x 630</span>
      <span class="pill">Engine: Pure Vector + Bundled Fonts + resvg</span>
      <span class="pill">Styles: 6 Radical Archetypes</span>
      <span class="pill">Zero foreignObject</span>
      <span class="pill">Mobile Feed High-Contrast</span>
    </div>
  </header>

  <div class="grid">
    ${generatedRecords
      .map(
        (rec) => `
    <div class="card">
      <div class="img-wrapper">
        <img src="${rec.sample.id}.png" alt="${rec.sample.topic}" />
      </div>
      <div class="meta">
        <div>
          <div class="meta-top">
            <span class="topic-tag">${rec.sample.targetCategory}</span>
            <span class="style-tag">Style: ${rec.visualStyle}</span>
          </div>
          <div class="hook-title">${rec.sample.hook}</div>
        </div>
        <div class="details">
          <span><strong>Template:</strong> ${rec.visualTemplate}</span>
          <span><strong>PNG Size:</strong> ${(rec.pngSize / 1024).toFixed(1)} KB</span>
          <span><strong>Dimensions:</strong> ${rec.dimensions}</span>
        </div>
      </div>
    </div>`
      )
      .join('\n')}
  </div>
</body>
</html>`;

  const contactSheetPath = path.join(tmpPreviewDir, 'contact_sheet.html');
  fs.writeFileSync(contactSheetPath, contactSheetHtml, 'utf8');
  if (fs.existsSync(artifactPreviewDir)) {
    fs.writeFileSync(path.join(artifactPreviewDir, 'contact_sheet.html'), contactSheetHtml, 'utf8');
  }
  console.log(`\nContact sheet successfully written to ${contactSheetPath}`);

  // 7. Output Table
  console.log('\n============================================================');
  console.log('SUMMARY OF 8 GENERATED VISUAL ARTIFACTS:');
  console.log('============================================================');
  console.table(
    generatedRecords.map((r) => ({
      Category: r.sample.targetCategory,
      Style: r.visualStyle,
      Template: r.visualTemplate,
      'PNG (KB)': (r.pngSize / 1024).toFixed(1),
      Dimensions: r.dimensions,
    }))
  );
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('[Engine 2.0] Verification failed:', err);
  process.exit(1);
});
