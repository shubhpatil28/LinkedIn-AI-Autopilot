/**
 * Comprehensive Verification Test for LinkedIn AI Autopilot Root-Cause Fixes
 *
 * Verifies:
 * 1. Gemini AI model generation with live API key
 * 2. Diverse fallback generation for repeated topics
 * 3. Strict duplicate content prevention
 * 4. Topic cursor retention on generation failure
 */

import fs from 'fs';
import path from 'path';
import { generateLinkedInPostContent, generateCuratedTechPost } from './aiService';
import { runQualityCheck } from './qualityCheckService';
import { getCandidateTopic } from './autoGenerationService';
import { ContentItem, Topic, UserSettings } from '../types';

// Load .env.local for live API test if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, '');
      }
    }
  });
}

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

async function runVerification() {
  console.log('\n============================================================');
  console.log('RUNNING ROOT-CAUSE FIX VERIFICATION SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Actual Gemini Model Generation with Server-Side Key
  // -------------------------------------------------------------------------
  console.log('--- Test 1: Live Gemini AI Model Generation ---');
  if (process.env.AI_API_KEY) {
    const topic = 'Event-Driven Architecture in Node.js';
    const research = {
      query: 'Event-driven Node.js best practices',
      summary: 'Event-driven architecture in Node.js relies on asynchronous event emitters, message queues like RabbitMQ or Kafka, and idempotent consumer workers to achieve high throughput under distributed loads.',
      sourceUrls: ['https://nodejs.org'],
    };

    const generated = await generateLinkedInPostContent(
      topic,
      research,
      'Professional & Technical',
      'English',
      []
    );

    assert(Boolean(generated.hook && generated.hook.length > 10), 'Generated post has non-empty hook');
    assert(Boolean(generated.body && generated.body.length > 50), 'Generated post has substantial body');
    assert(Boolean(generated.cta && generated.cta.length > 5), 'Generated post has conversational CTA');
    assert(Array.isArray(generated.hashtags) && generated.hashtags.length >= 3 && generated.hashtags.length <= 5, 'Hashtags strictly between 3 and 5');
    console.log(`  Sample Generated Hook: "${generated.hook}"`);
    console.log(`  Sample Hashtags: ${generated.hashtags.join(' ')}`);
  } else {
    console.log('  SKIP: AI_API_KEY not found in environment, skipping network call.');
  }

  // -------------------------------------------------------------------------
  // Test 2: Fallback Generator Produces Diverse Content For Repeated Topics
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Diverse Fallback for Repeated Topic Generations ---');
  {
    const repeatedTopic = 'From Writing Code to Building Products: The Mindset Shift Every Developer Needs.';
    const mockResearch = {
      query: 'From writing code to building products',
      summary: 'Shifting from individual coding tasks to product thinking requires understanding customer value metrics, prioritizing architectural simplicity, and measuring outcomes over lines of code.',
      sourceUrls: [],
    };

    // First generation
    const post1 = generateCuratedTechPost(repeatedTopic, mockResearch, 'Professional & Technical', []);

    // Second generation passing post 1 as existing
    const post2 = generateCuratedTechPost(repeatedTopic, mockResearch, 'Professional & Technical', [
      { hook: post1.hook, body: post1.body },
    ]);

    // Third generation passing post 1 and post 2 as existing
    const post3 = generateCuratedTechPost(repeatedTopic, mockResearch, 'Professional & Technical', [
      { hook: post1.hook, body: post1.body },
      { hook: post2.hook, body: post2.body },
    ]);

    assert(post1.hook !== post2.hook, 'Post 2 produces different hook from Post 1 for the exact same topic');
    assert(post2.hook !== post3.hook, 'Post 3 produces different hook from Post 2 for the exact same topic');
    assert(post1.body !== post2.body, 'Post 2 produces different body from Post 1');

    console.log(`  Angle 1 Hook: "${post1.hook}"`);
    console.log(`  Angle 2 Hook: "${post2.hook}"`);
    console.log(`  Angle 3 Hook: "${post3.hook}"`);
  }

  // -------------------------------------------------------------------------
  // Test 3: Duplicate Protection Remains Strictly Active
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Strict Duplicate Content Protection ---');
  {
    const existingPost: ContentItem = {
      id: 'existing_post_100',
      userId: 'test_user',
      topicId: 't1',
      topic: 'React 19',
      hook: '💡 React 19 is fundamentally changing how we handle server state and rendering.',
      body: 'If you are still writing manual useMemo and useCallback hooks everywhere...',
      cta: 'Are you using React 19 in production yet?',
      hashtags: ['#ReactJS', '#NextJS', '#WebDev'],
      imageUrl: 'https://example.com/img.png',
      sourceUrls: [],
      status: 'PUBLISHED',
      scheduledAt: '2026-11-09T03:30:00.000Z',
      publishedAt: '2026-11-09T04:15:20.000Z',
      linkedinPostId: 'urn:li:share:12345',
      failureReason: null,
      createdAt: '2026-11-08T04:15:20.000Z',
      updatedAt: '2026-11-09T04:15:20.000Z',
    };

    // Duplicate candidate
    const duplicateCandidate: ContentItem = {
      ...existingPost,
      id: 'candidate_post_200',
      status: 'SCHEDULED',
      publishedAt: null,
      linkedinPostId: null,
    };

    const duplicateCheck = runQualityCheck(duplicateCandidate, [existingPost]);
    assert(!duplicateCheck.passed, 'Duplicate candidate is strictly rejected');
    assert(
      duplicateCheck.reason?.includes('duplicate') === true,
      'Failure reason explicitly cites duplicate content'
    );

    // Genuinely distinct candidate
    const distinctCandidate: ContentItem = {
      ...existingPost,
      id: 'candidate_post_300',
      hook: '⚡ Next.js 15 Server Actions: 3 performance patterns for high-concurrency apps.',
      body: 'Optimizing server action throughput requires disciplined memory and concurrency boundaries...',
      status: 'SCHEDULED',
      publishedAt: null,
      linkedinPostId: null,
    };

    const distinctCheck = runQualityCheck(distinctCandidate, [existingPost]);
    assert(distinctCheck.passed, 'Distinct candidate passes duplicate check');
  }

  // -------------------------------------------------------------------------
  // Test 4: Topic Cursor Retention on Failure & Offset Candidate Rotation
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Topic Cursor Retention & Controlled Rotation ---');
  {
    const mockTopics: Topic[] = [
      { id: 'top_0', name: 'Topic Zero', enabled: true, userId: 'u1', createdAt: '', updatedAt: '' },
      { id: 'top_1', name: 'Topic One', enabled: true, userId: 'u1', createdAt: '', updatedAt: '' },
      { id: 'top_2', name: 'Topic Two', enabled: true, userId: 'u1', createdAt: '', updatedAt: '' },
    ];

    const mockSettings: UserSettings = {
      userId: 'u1',
      lastTopicIndex: 1, // Cursor pointing at index 1
      publishingMode: 'Full Auto',
      postingTime: '09:00',
      timezone: 'Asia/Kolkata',
      language: 'English',
      writingStyle: 'Professional & Technical',
      postsPerDay: 1,
      topics: [],
      updatedAt: '',
    };

    // Candidate at offset 0 (primary target)
    const primaryCandidate = getCandidateTopic(mockSettings, mockTopics, 0);
    assert(primaryCandidate?.topic.name === 'Topic One', 'Primary candidate matches cursor index 1');
    assert(primaryCandidate?.nextIndex === 2, 'Primary candidate targets nextIndex 2');

    // Candidate at offset 1 (fallback retry target)
    const retryCandidate = getCandidateTopic(mockSettings, mockTopics, 1);
    assert(retryCandidate?.topic.name === 'Topic Two', 'Retry candidate selects next enabled topic (offset 1)');
    assert(retryCandidate?.nextIndex === 0, 'Retry candidate wraps around to nextIndex 0');

    // Confirm getCandidateTopic did not mutate mockSettings
    assert(mockSettings.lastTopicIndex === 1, 'Cursor in settings remains unchanged prior to successful generation');
  }

  console.log('\n============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
