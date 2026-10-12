/**
 * Unit tests for Duplicate Prevention, Template Diversity, and Content Uniqueness Guardrails
 */

import fs from 'fs';
import path from 'path';
import { runQualityCheck } from './qualityCheckService';
import { generateCuratedTechPost, generateLinkedInPostContent } from './aiService';
import { ContentItem } from '../types';

const logPath = path.join(process.cwd(), 'services', 'duplicatePrevention.test.log');
fs.writeFileSync(logPath, 'STARTING DUPLICATE PREVENTION & DIVERSITY TESTS\n');

function log(msg: string) {
  fs.appendFileSync(logPath, msg + '\n');
  console.log(msg);
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    log(`  PASS: ${label}`);
  } else {
    failed++;
    log(`  FAIL: ${label}`);
  }
}

async function runTests() {
  log('\n--- Test 1: Fallback Generator Filters Out Duplicate Templates ---');
  {
    const existingOct11 = {
      hook: '⚡ Most engineering teams misuse LLMs in production. Here is how robust AI architecture works in 2026.',
      body: `Building reliable AI products is 20% model selection and 80% system design.\n\n4 architectural layers every production AI app needs:\n\n1. Strict Schema Enforcement: Guaranteeing JSON output contracts so downstream services never break.\n2. Semantic Caching: Caching query embeddings to reduce API latency by 75% and cut costs.\n3. Context & RAG Pipelines: Grounding responses with vector search to eliminate hallucinations.\n4. Graceful Fallbacks: Retrying with fallback models when primary endpoints hit rate limits.`,
    };

    // When generating a new AI post with existing Oct 11 post passed
    const generated = generateCuratedTechPost(
      'I built an AI-powered application — what actually worked',
      {
        query: 'production ai lessons',
        summary: 'Lessons learned shipping production AI applications.',
        sourceUrls: [],
      },
      'Professional & Technical',
      [existingOct11]
    );

    assert(
      generated.hook.trim().toLowerCase() !== existingOct11.hook.trim().toLowerCase(),
      'Generated hook is not identical to existing post hook'
    );
    assert(
      generated.body.trim().toLowerCase() !== existingOct11.body.trim().toLowerCase(),
      'Generated body is not identical to existing post body'
    );
    log(`Generated new hook: "${generated.hook}"`);
  }

  log('\n--- Test 2: Multi-Template Diversity in AI Category ---');
  {
    const generatedPosts: Array<{ hook: string; body: string }> = [];

    // Simulate 3 consecutive generations, passing previously generated posts each time
    for (let i = 0; i < 3; i++) {
      const post = generateCuratedTechPost(
        'AI & LLMs in production',
        {
          query: 'ai architecture',
          summary: 'Modern software engineering principles for production AI.',
          sourceUrls: [],
        },
        'Professional & Technical',
        generatedPosts
      );

      // Verify this post is unique compared to all previous
      const hasDuplicate = generatedPosts.some(
        (prev) => prev.hook === post.hook || prev.body === post.body
      );
      assert(!hasDuplicate, `Consecutive AI post #${i + 1} is unique from predecessors`);
      generatedPosts.push({ hook: post.hook, body: post.body });
    }

    assert(generatedPosts.length === 3, 'Successfully generated 3 diverse, non-colliding AI posts');
  }

  log('\n--- Test 3: Quality Check Rejects Obvious Duplicate Posts ---');
  {
    const basePost: ContentItem = {
      id: 'post_oct11',
      userId: 'user_1',
      topicId: 't1',
      topic: 'AI Architecture',
      hook: '⚡ Most engineering teams misuse LLMs in production.',
      body: 'Building reliable AI products requires strict schema enforcement.',
      cta: 'How do you handle output validation?',
      hashtags: ['#AI', '#SoftwareEngineering', '#Coding'],
      imageUrl: 'https://example.com/image.png',
      sourceUrls: [],
      status: 'PUBLISHED',
      scheduledAt: '2026-10-11T03:30:00.000Z',
      publishedAt: '2026-10-11T03:30:15.000Z',
      linkedinPostId: 'urn:li:share:123',
      failureReason: null,
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-11T03:30:15.000Z',
    };

    const duplicateCandidate: ContentItem = {
      ...basePost,
      id: 'post_oct12_duplicate',
      status: 'SCHEDULED',
      scheduledAt: '2026-10-12T03:30:00.000Z',
      publishedAt: null,
      linkedinPostId: null,
    };

    const checkResult = runQualityCheck(duplicateCandidate, [basePost]);
    assert(!checkResult.passed, 'Quality check flags duplicate candidate as failure');
    assert(
      Boolean(checkResult.reason && checkResult.reason.toLowerCase().includes('duplicate')),
      'Quality check reason explicitly cites duplicate content'
    );
  }

  log('\n--- Test 4: Quality Check Passes Unique Post Against Existing ---');
  {
    const existingPost: ContentItem = {
      id: 'post_oct11',
      userId: 'user_1',
      topicId: 't1',
      topic: 'AI Architecture',
      hook: '⚡ Most engineering teams misuse LLMs in production.',
      body: 'Building reliable AI products requires strict schema enforcement.',
      cta: 'How do you handle output validation?',
      hashtags: ['#AI', '#SoftwareEngineering', '#Coding'],
      imageUrl: 'https://example.com/image.png',
      sourceUrls: [],
      status: 'PUBLISHED',
      scheduledAt: '2026-10-11T03:30:00.000Z',
      publishedAt: '2026-10-11T03:30:15.000Z',
      linkedinPostId: 'urn:li:share:123',
      failureReason: null,
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-11T03:30:15.000Z',
    };

    const uniqueCandidate: ContentItem = {
      id: 'post_oct12_unique',
      userId: 'user_1',
      topicId: 't2',
      topic: 'I built an AI-powered application — what actually worked',
      hook: '🛠️ I built and deployed an AI-powered application to production. Here is what actually worked.',
      body: 'Shipping an AI application beyond a demo reveals harsh production realities quickly.\n\n3 hard-won principles:\n1. Deterministic fallbacks beat prompt tweaking.\n2. Streaming UI is non-negotiable for low perceived latency.\n3. Continuous automated evaluation datasets catch regression early.',
      cta: 'What was your biggest surprise when taking an AI feature to production?',
      hashtags: ['#ArtificialIntelligence', '#SoftwareEngineering', '#ProductDevelopment'],
      imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      sourceUrls: [],
      status: 'SCHEDULED',
      scheduledAt: '2026-10-12T03:30:00.000Z',
      publishedAt: null,
      linkedinPostId: null,
      failureReason: null,
      createdAt: '2026-10-11T12:00:00.000Z',
      updatedAt: '2026-10-11T12:00:00.000Z',
    };

    const checkResult = runQualityCheck(uniqueCandidate, [existingPost]);
    assert(checkResult.passed, 'Quality check passes completely unique candidate');
    assert(checkResult.reason === undefined, 'No failure reason reported on passing post');
  }

  log('\n========================================');
  log(`Results: ${passed} passed, ${failed} failed`);
  log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  log('EXCEPTION IN TESTS: ' + String(err));
  process.exit(1);
});
