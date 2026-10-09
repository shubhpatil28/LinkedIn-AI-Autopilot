/**
 * Unit tests for Quality Validation & Sanitization Engine
 */

import fs from 'fs';
import path from 'path';
import { runQualityCheck } from './qualityCheckService';
import { sanitizePostContent, generateLinkedInPostContent } from './aiService';
import { ContentItem } from '../types';

const logPath = path.join(process.cwd(), 'services', 'qualityCheckService.test.log');
fs.writeFileSync(logPath, 'STARTING QUALITY CHECK TESTS\n');

function log(msg: string) {
  fs.appendFileSync(logPath, msg + '\n');
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
  // ---------------------------------------------------------------------------
  // Test 1: sanitizePostContent removes demo markers & caps hashtags
  // ---------------------------------------------------------------------------
  log('\n--- Test 1: Post Sanitization ---');
  {
    const dirty = {
      hook: '⚡ [AUTOPILOT DEMO 2026-10-09] How automated AI works.',
      body: 'This post was generated and scheduled by LinkedIn AI Autopilot at 6:10 PM IST.\n\nGood developer content.',
      cta: 'Comment below!',
      hashtags: ['#AUTOPILOTDEMO', '#AI', '#React', '#Coding', '#WebDev', '#Tech', '#ExtraTag'],
    };

    const sanitized = sanitizePostContent(dirty);
    assert(!sanitized.hook.includes('AUTOPILOT DEMO'), 'Hook free of AUTOPILOT DEMO');
    assert(!sanitized.body.includes('LinkedIn AI Autopilot'), 'Body free of demo template');
    assert(sanitized.hashtags.length <= 5, `Hashtags capped at <= 5 (got ${sanitized.hashtags.length})`);
    assert(!sanitized.hashtags.includes('#AUTOPILOTDEMO'), 'Hashtags free of #AUTOPILOTDEMO');
  }

  // ---------------------------------------------------------------------------
  // Test 2: runQualityCheck rejects forbidden internal demo markers
  // ---------------------------------------------------------------------------
  log('\n--- Test 2: Quality Check Rejects Demo Markers ---');
  {
    const item: ContentItem = {
      id: 'post_1',
      userId: 'user_1',
      topicId: 'topic_1',
      topic: 'AI',
      hook: '⚡ [AUTOPILOT DEMO] How AI works.',
      body: 'Clean engineering body text.',
      cta: 'Drop your thoughts!',
      hashtags: ['#AI', '#Tech', '#Coding'],
      imageUrl: 'https://example.com/image.png',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(!res.passed, 'Rejects post containing [AUTOPILOT DEMO]');
    assert(res.reason?.includes('forbidden internal demo') === true, 'Reason mentions forbidden demo metadata');
  }

  // ---------------------------------------------------------------------------
  // Test 3: runQualityCheck rejects > 5 hashtags
  // ---------------------------------------------------------------------------
  log('\n--- Test 3: Quality Check Rejects Excessive Hashtags ---');
  {
    const item: ContentItem = {
      id: 'post_2',
      userId: 'user_1',
      topicId: 'topic_1',
      topic: 'React',
      hook: '💡 Modern React State Management Principles.',
      body: 'Keep local UI state local, and let the data layer handle caching.',
      cta: 'What is your preferred approach?',
      hashtags: ['#React', '#WebDev', '#JavaScript', '#Frontend', '#Coding', '#Tech'], // 6 hashtags
      imageUrl: 'https://example.com/image.png',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(!res.passed, 'Rejects post with 6 hashtags');
    assert(res.reason?.includes('Excessive hashtags') === true, 'Reason cites excessive hashtags');
  }

  // ---------------------------------------------------------------------------
  // Test 4: runQualityCheck rejects placeholders
  // ---------------------------------------------------------------------------
  log('\n--- Test 4: Quality Check Rejects Placeholders ---');
  {
    const item: ContentItem = {
      id: 'post_3',
      userId: 'user_1',
      topicId: 'topic_1',
      topic: 'TypeScript',
      hook: '⚡ TODO: Insert clever TypeScript hook here.',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      cta: 'Comment below!',
      hashtags: ['#TypeScript', '#Coding', '#WebDev'],
      imageUrl: 'https://example.com/image.png',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(!res.passed, 'Rejects post with TODO / Lorem ipsum');
    assert(res.reason?.includes('placeholder') === true, 'Reason cites placeholder');
  }

  // ---------------------------------------------------------------------------
  // Test 5: runQualityCheck approves clean developer post (AI / React)
  // ---------------------------------------------------------------------------
  log('\n--- Test 5: Quality Check Approves Clean React Post ---');
  {
    const item: ContentItem = {
      id: 'post_4',
      userId: 'user_1',
      topicId: 'topic_react',
      topic: 'React & Next.js',
      hook: '💡 React 19 is fundamentally changing how we handle server state and rendering.',
      body: 'If you are still writing manual useMemo and useCallback hooks everywhere, React 19 simplifies your codebase significantly.\n\nKey architectural upgrades:\n1. React Compiler: Auto-memoizes components under the hood.\n2. Server Actions: Type-safe server mutations.',
      cta: 'Are you using React 19 in production yet?',
      hashtags: ['#ReactJS', '#NextJS', '#WebDevelopment', '#FrontendDev'],
      imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(res.passed, 'Approves clean React post');
  }

  // ---------------------------------------------------------------------------
  // Test 6: Sample Post 1 (AI & LLMs) generated content quality check
  // ---------------------------------------------------------------------------
  log('\n--- Test 6: Sample Post 1 (AI & LLMs) Generation & Validation ---');
  {
    const generated = await generateLinkedInPostContent('AI & LLMs', {
      query: 'AI & LLMs query',
      summary: 'Production AI architectures require strict schema validation and semantic caching.',
      sourceUrls: [],
    });

    log(`Sample 1 Hook: "${generated.hook}"`);
    log(`Sample 1 Body:\n${generated.body}`);
    log(`Sample 1 CTA: "${generated.cta}"`);
    log(`Sample 1 Hashtags: [${generated.hashtags.join(', ')}]`);

    const item: ContentItem = {
      id: 'sample_1',
      userId: 'user_1',
      topicId: 'topic_ai',
      topic: 'AI & LLMs',
      ...generated,
      imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(res.passed, 'Generated AI & LLMs sample post passes quality check');
    assert(generated.hashtags.length >= 3 && generated.hashtags.length <= 5, 'Hashtags count between 3 and 5');
    assert(!generated.body.includes('AUTOPILOT DEMO'), 'Body contains zero demo text');
  }

  // ---------------------------------------------------------------------------
  // Test 7: Sample Post 2 (Debugging & Architecture) generated content quality check
  // ---------------------------------------------------------------------------
  log('\n--- Test 7: Sample Post 2 (Debugging & Architecture) Generation & Validation ---');
  {
    const generated = await generateLinkedInPostContent('Debugging & Architecture', {
      query: 'Debugging query',
      summary: 'Systematic isolation and minimal reproduction cases lead to faster bug resolution.',
      sourceUrls: [],
    });

    log(`Sample 2 Hook: "${generated.hook}"`);
    log(`Sample 2 Body:\n${generated.body}`);
    log(`Sample 2 CTA: "${generated.cta}"`);
    log(`Sample 2 Hashtags: [${generated.hashtags.join(', ')}]`);

    const item: ContentItem = {
      id: 'sample_2',
      userId: 'user_1',
      topicId: 'topic_debug',
      topic: 'Debugging & Architecture',
      ...generated,
      imageUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      sourceUrls: [],
      status: 'APPROVED',
      scheduledAt: null,
      publishedAt: null,
      linkedinPostId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = runQualityCheck(item, []);
    assert(res.passed, 'Generated Debugging & Architecture sample post passes quality check');
    assert(generated.hashtags.length >= 3 && generated.hashtags.length <= 5, 'Hashtags count between 3 and 5');
    assert(!generated.body.includes('AUTOPILOT DEMO'), 'Body contains zero demo text');
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
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
