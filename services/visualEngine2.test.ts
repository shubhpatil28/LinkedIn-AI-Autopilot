/**
 * Comprehensive Verification Suite for Premium AI Visual Generation Engine 2.0
 */

import fs from 'fs';
import path from 'path';
import {
  generateEnrichedTopicVisualSvg,
  generateTopicVisualSvg,
  determineVisualConfig,
} from './visualService';
import { convertSvgToPngBuffer, validateSvgOutput, validateSvgTextContent } from './serverVisualService';
import { getImageProviderStatus, generatePostImage } from './imageProviderService';
import { VisualStyle } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('RUNNING VISUAL GENERATION ENGINE 2.0 TEST SUITE');
  console.log('============================================================\n');

  // ---------------------------------------------------------------------------
  // Test 1: Topic-Aware Image Selection for All 8 Categories
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: Topic-Aware Visual Style Mapping ---');
  {
    const aiConfig = determineVisualConfig('AI & LLMs', 'AI Agents', 'Autonomous loops');
    assert(aiConfig.visualStyle === 'futuristic_ai', 'AI / LLM maps to futuristic_ai visual style');

    const ragConfig = determineVisualConfig('RAG & Vector Search Systems', 'Hybrid Search', 'Vector embeddings');
    assert(ragConfig.visualStyle === 'data_visualization', 'RAG / Vector DB maps to data_visualization visual style');

    const tsConfig = determineVisualConfig('TypeScript & JavaScript', 'Type Guard Patterns', 'Strict types');
    assert(tsConfig.visualStyle === 'code_developer', 'React / Next.js / TypeScript maps to code_developer visual style');

    const sysConfig = determineVisualConfig('System Design & Microservices', 'Distributed Systems', 'Kafka event broker');
    assert(sysConfig.visualStyle === 'isometric_tech', 'System Design / Microservices maps to isometric_tech visual style');

    const backendConfig = determineVisualConfig('Backend & Databases', 'Idempotency', 'Redis distributed lock');
    assert(backendConfig.visualStyle === 'premium_3d', 'Backend / APIs / Databases maps to premium_3d visual style');

    const devopsConfig = determineVisualConfig('DevOps & Kubernetes', 'CI/CD Rollouts', 'Canary deployment');
    assert(devopsConfig.visualStyle === 'isometric_tech', 'DevOps / Docker / Kubernetes maps to isometric_tech visual style');

    const secConfig = determineVisualConfig('Cybersecurity & Zero Trust', 'Zero-Trust Defense', 'mTLS ephemeral tokens');
    assert(secConfig.visualStyle === 'premium_3d', 'Cybersecurity maps to premium_3d visual style');

    const careerConfig = determineVisualConfig('Engineering Leadership & Career', 'Staff Engineer Axioms', 'Simplicity in design');
    assert(careerConfig.visualStyle === 'modern_editorial', 'Engineering / Career maps to modern_editorial visual style');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Visual Diversity & Recent History Rotation
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 2: Visual Diversity Rotation via History ---');
  {
    // If previous post used 'data_visualization' for RAG, it should rotate to 'premium_3d'
    const ragRotated = determineVisualConfig('RAG & Vector Search Systems', 'Hybrid Search', 'Vector embeddings', {
      recentHistory: [{ visualStyle: 'data_visualization', visualTemplate: 'vector_rag_pipeline' }],
    });
    assert(ragRotated.visualStyle === 'premium_3d', 'Rotates away from recently used data_visualization to premium_3d');

    // If previous post used 'premium_3d' for Backend, it rotates to 'data_visualization'
    const backendRotated = determineVisualConfig('Backend & Databases', 'Idempotency', 'Redis lock', {
      recentHistory: [{ visualStyle: 'premium_3d', visualTemplate: 'idempotent_backend_flow' }],
    });
    assert(backendRotated.visualStyle === 'data_visualization', 'Rotates away from recently used premium_3d to data_visualization');

    // If previous post used 'isometric_tech' for System Design, it rotates to 'premium_3d'
    const sysRotated = determineVisualConfig('System Design & Microservices', 'Microservices', 'Distributed architecture', {
      recentHistory: [{ visualStyle: 'isometric_tech', visualTemplate: 'isometric_distributed_stack' }],
    });
    assert(sysRotated.visualStyle === 'premium_3d', 'Rotates away from recently used isometric_tech to premium_3d');
  }

  // ---------------------------------------------------------------------------
  // Test 3: Free-Only Enforcement & Permanent Paid Provider Disablement
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 3: Free-Only Enforcement & Permanent Paid Provider Disablement ---');
  {
    const originalEnv = { ...process.env };

    // Baseline: svg-engine is active and free
    const status = getImageProviderStatus();
    assert(status.fallbackAvailable === true, 'Fallback engine is always available');
    assert(status.activeProvider === 'svg-engine', 'Exclusively enforces zero-cost svg-engine');
    assert(status.costNote.includes('100% Free & Zero-Cost'), 'Cost note documents free in-house policy');

    // Attempt 1: Malicious or accidental configuration with Google Imagen
    process.env.IMAGE_PROVIDER = 'gemini-imagen';
    process.env.IMAGE_API_KEY = 'paid_test_secret_key_123';
    const imagenStatus = getImageProviderStatus();
    assert(imagenStatus.activeProvider === 'svg-engine', 'Google Imagen is strictly blocked and activeProvider remains svg-engine');
    assert(imagenStatus.isPaidBlocked === true, 'isPaidBlocked flags true for gemini-imagen');

    // Attempt 2: Malicious or accidental configuration with OpenAI DALL-E
    process.env.IMAGE_PROVIDER = 'openai-dalle';
    const dalleStatus = getImageProviderStatus();
    assert(dalleStatus.activeProvider === 'svg-engine', 'OpenAI DALL-E is strictly blocked and activeProvider remains svg-engine');
    assert(dalleStatus.isPaidBlocked === true, 'isPaidBlocked flags true for openai-dalle');

    // Attempt 3: Shorthand 'stability' or other paid services
    process.env.IMAGE_PROVIDER = 'stability';
    const stabilityStatus = getImageProviderStatus();
    assert(stabilityStatus.activeProvider === 'svg-engine', 'Stability AI is strictly blocked and activeProvider remains svg-engine');
    assert(stabilityStatus.isPaidBlocked === true, 'isPaidBlocked flags true for stability');

    // Actual generation with paid env configured must NOT call network and must return svg-engine
    const generated = await generatePostImage({
      topic: 'AI & LLMs',
      hook: 'Autonomous AI workflows require deterministic bounds.',
    });
    assert(generated.provider === 'svg-engine', 'Truthfully identifies provider as "svg-engine" even when paid provider was configured in env');
    assert(generated.buffer && generated.buffer.length > 20000, 'PNG buffer is rich and non-empty');
    assert(generated.dimensions.width === 1200 && generated.dimensions.height === 630, 'Enforces 1200x630 dimensions');

    // Restore env
    process.env = originalEnv;
  }

  // ---------------------------------------------------------------------------
  // Test 4: All 6 Visual Styles Generate Valid SVGs Without foreignObject
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 4: Pure SVG Compliance Across All 6 Styles ---');
  {
    const styles: VisualStyle[] = [
      'premium_3d',
      'modern_editorial',
      'isometric_tech',
      'futuristic_ai',
      'code_developer',
      'data_visualization',
    ];

    for (const style of styles) {
      const res = generateEnrichedTopicVisualSvg('Test Topic', 'Test Hook Headline', 'Test body content', { style });
      assert(!res.svg.includes('<foreignObject'), `No foreignObject in style "${style}"`);
      assert(res.svg.includes('1200') && res.svg.includes('630'), `1200x630 dimensions in style "${style}"`);
      assert(res.visualStyle === style, `Returns matching visualStyle "${style}"`);

      let validationThrew = false;
      try {
        validateSvgOutput(res.svg);
        validateSvgTextContent(res.svg);
      } catch (err: any) {
        validationThrew = true;
        console.error(`Validation error in ${style}:`, err.message);
      }
      assert(!validationThrew, `validateSvgOutput and validateSvgTextContent pass for "${style}"`);
    }
  }

  // ---------------------------------------------------------------------------
  // Test 5: High-Density PNG Rasterization for All 6 Styles
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 5: High-Density PNG Rasterization for All 6 Styles ---');
  {
    const styles: VisualStyle[] = [
      'premium_3d',
      'modern_editorial',
      'isometric_tech',
      'futuristic_ai',
      'code_developer',
      'data_visualization',
    ];

    for (const style of styles) {
      const res = generateEnrichedTopicVisualSvg('System Architecture', 'High Performance Systems', 'Production lessons', { style });
      const pngBuf = await convertSvgToPngBuffer(res.svg);

      assert(Buffer.isBuffer(pngBuf), `Rasterized PNG for "${style}" is a valid Buffer`);
      assert(pngBuf.length > 25000, `Rasterized PNG for "${style}" has rich graphic density (${pngBuf.length} bytes > 25KB)`);

      // Verify PNG magic header: 89 50 4E 47
      const isPng = pngBuf[0] === 0x89 && pngBuf[1] === 0x50 && pngBuf[2] === 0x4e && pngBuf[3] === 0x47;
      assert(isPng, `Rasterized PNG for "${style}" has valid binary PNG signature header`);
    }
  }

  // ---------------------------------------------------------------------------
  // Test 6: AI Safety Governance Pipeline Structure
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 6: AI Safety Governance Diagram Completeness ---');
  {
    const safetySvg = generateTopicVisualSvg(
      'AI & LLMs',
      '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.',
      'Deterministic guardrails and human-in-the-loop triggers for production AI.'
    );

    assert(safetySvg.includes('User Request'), 'Contains "User Request" stage');
    assert(safetySvg.includes('Agent Orchestrator'), 'Contains "Agent Orchestrator" stage');
    assert(safetySvg.includes('Tool Execution'), 'Contains "Tool Execution" stage');
    assert(safetySvg.includes('Safety Guardrails'), 'Contains "Safety Guardrails" governance node');
    assert(safetySvg.includes('Human Approval'), 'Contains "Human Approval" governance node');
    assert(safetySvg.includes('Audit Logs'), 'Contains "Audit Logs" observability stage');
    assert(safetySvg.includes('Zero Trust Tools'), 'Contains "Zero Trust Tools" principle');
  }

  // ---------------------------------------------------------------------------
  // Test 7: Editorial Typography & High-Contrast Axioms
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 7: Modern Editorial Typography & Axioms ---');
  {
    const editorialSvg = generateTopicVisualSvg(
      'Engineering Leadership & Career',
      '🧭 Core engineering principles for Staff Engineers',
      'Simplicity in system design creates operational resilience at scale.'
    );

    assert(editorialSvg.includes('Simplicity in system design creates operational resilience at scale.'), 'Contains editorial pull quote');
    assert(editorialSvg.includes('Principle 01'), 'Contains numbered editorial principle 01');
    assert(editorialSvg.includes('Principle 02'), 'Contains numbered editorial principle 02');
    assert(editorialSvg.includes('Principle 03'), 'Contains numbered editorial principle 03');
  }

  // ---------------------------------------------------------------------------
  // Test 8: Code Developer Workstation & Benchmark Metrics
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 8: Code Developer Workstation & Syntax Highlighting ---');
  {
    const codeSvg = generateTopicVisualSvg(
      'TypeScript & JavaScript',
      '⚡ 4 Advanced TypeScript Patterns for Robust Architecture',
      'Discriminated unions and satisfies operator'
    );

    assert(codeSvg.includes('typescript-pattern.ts'), 'Contains file tab header');
    assert(codeSvg.includes('Discriminated Result Union'), 'Contains code syntax comments');
    assert(codeSvg.includes('0.4ms TTFT'), 'Contains performance benchmark pill');
  }

  // ---------------------------------------------------------------------------
  // Test 9: Data Visualization Dashboard & Hero Metrics
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 9: Data Visualization Dashboard & Hero Metrics ---');
  {
    const dataSvg = generateTopicVisualSvg(
      'RAG & Vector Search Systems',
      '📊 Enterprise RAG in 2026',
      'Semantic caching and hybrid vector retrieval'
    );

    assert(dataSvg.includes('75%'), 'Contains high-impact 75% cost reduction metric');
    assert(dataSvg.includes('&lt; 18ms'), 'Contains escaped < 18ms vector latency metric');
    assert(dataSvg.includes('99.4%'), 'Contains 99.4% retrieval recall metric');
  }

  // ---------------------------------------------------------------------------
  // Test 10: Metadata Persistence & Idempotent Attachment
  // ---------------------------------------------------------------------------
  console.log('\n--- Test 10: Metadata Persistence & Idempotent Attachment ---');
  {
    const enriched = generateEnrichedTopicVisualSvg('Cybersecurity & Zero Trust', 'Zero-Trust Defense');
    assert(Boolean(enriched.visualStyle), 'visualStyle is set in returned metadata');
    assert(Boolean(enriched.visualTemplate), 'visualTemplate is set in returned metadata');
    assert(enriched.visualStyle === 'premium_3d', 'Correct visualStyle for cybersecurity');
    assert(enriched.visualTemplate === 'security_shield_defense', 'Correct visualTemplate for cybersecurity');
  }

  console.log('\n============================================================');
  console.log(`ENGINE 2.0 VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

