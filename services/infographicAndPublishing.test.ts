/**
 * Comprehensive Test Suite for Technical Infographics & LinkedIn API Image Publishing
 */

import fs from 'fs';
import path from 'path';
import { generateTopicVisualSvg, generateTopicVisual } from './visualService';
import { convertSvgToPngBuffer } from './serverVisualService';
import { publishToLinkedIn, uploadLinkedInImage } from './linkedinPublishingService';
import { ContentItem, LinkedInConnection } from '../types';

const logPath = path.join(process.cwd(), 'services', 'infographicAndPublishing.test.log');
fs.writeFileSync(logPath, 'STARTING INFOGRAPHIC & LINKEDIN PUBLISHING TESTS\n');

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

const mockConnection: LinkedInConnection = {
  userId: 'user_123',
  memberId: '123456789',
  memberName: 'Alex Dev',
  accessToken: 'real_access_token_abc123',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPostItem: ContentItem = {
  id: 'post_test_001',
  userId: 'user_123',
  topicId: 'topic_ai',
  topic: 'AI & LLMs',
  hook: '⚡ Production AI architecture requires strict schema validation and semantic caching.',
  body: 'Building reliable AI products is 20% model selection and 80% system design.\n\n4 architectural layers every production AI app needs:\n1. Strict Schema Enforcement\n2. Semantic Caching\n3. RAG Pipelines\n4. Graceful Fallbacks.',
  cta: 'How is your team handling output validation for LLMs in production?',
  hashtags: ['#AI', '#SoftwareArchitecture', '#SystemDesign', '#LLMs'],
  imageUrl: '',
  sourceUrls: [],
  status: 'SCHEDULED',
  scheduledAt: new Date().toISOString(),
  publishedAt: null,
  linkedinPostId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function runTests() {
  // ---------------------------------------------------------------------------
  // Test 1: SVG Rendering for Technical Infographics
  // ---------------------------------------------------------------------------
  log('\n--- Test 1: Technical Infographic SVG Generation ---');
  {
    const svg = generateTopicVisualSvg('React & Next.js', '💡 React 19 Server Actions & Server Components');
    assert(svg.includes('<svg'), 'Generates valid SVG string containing <svg tag');
    assert(svg.includes('viewBox="0 0 1200 630"'), 'Enforces 1200x630 resolution');
    assert(svg.includes('STEP 01'), 'Contains 4-node workflow STEP 01');
    assert(svg.includes('STEP 04'), 'Contains 4-node workflow STEP 04');
    assert(svg.includes('REACT 19 &amp; NEXT.JS APP ROUTER'), 'Contains escaped badge category text');
    assert(svg.includes('SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE'), 'Contains clean engineering footer');
    assert(!svg.includes('AUTOPILOT DEMO'), 'Zero demo markers in SVG');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Invalid Image Output Handling in convertSvgToPngBuffer
  // ---------------------------------------------------------------------------
  log('\n--- Test 2: Invalid SVG Input Handling ---');
  {
    try {
      await convertSvgToPngBuffer('');
      assert(false, 'Should throw on empty SVG string');
    } catch (err: any) {
      assert(err.message.includes('Invalid SVG input'), 'Throws clear error for empty string');
    }

    try {
      await convertSvgToPngBuffer('not_an_svg_string');
      assert(false, 'Should throw on invalid SVG markup');
    } catch (err: any) {
      assert(err.message.includes('Invalid SVG content'), 'Throws clear error for invalid SVG markup');
    }
  }

  // ---------------------------------------------------------------------------
  // Test 3: SVG to PNG Buffer Conversion
  // ---------------------------------------------------------------------------
  log('\n--- Test 3: SVG to PNG Buffer Conversion ---');
  {
    const svg = generateTopicVisualSvg('TypeScript & JavaScript', '⚡ 4 Advanced TypeScript Patterns');
    const pngBuffer = await convertSvgToPngBuffer(svg);
    assert(Buffer.isBuffer(pngBuffer), 'Returns a valid Node.js Buffer');
    assert(pngBuffer.length > 5000, `Buffer size is non-empty (${pngBuffer.length} bytes)`);
  }

  // ---------------------------------------------------------------------------
  // Test 4: Upload Initialization Failure Handling
  // ---------------------------------------------------------------------------
  log('\n--- Test 4: LinkedIn Image Upload Initialization Failure ---');
  {
    const originalFetch = global.fetch;
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('initializeUpload')) {
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal LinkedIn Server Error',
        } as Response;
      }
      return originalFetch(url);
    }) as typeof fetch;

    const dummyBuffer = Buffer.from('dummy_png_data');
    const res = await uploadLinkedInImage(dummyBuffer, mockConnection, 'Test Hook');
    assert(!res.success, 'Fails gracefully when initializeUpload returns 500');
    assert(res.errorReason?.includes('initialization failed') === true, 'Error reason cites initialization failure');

    global.fetch = originalFetch;
  }

  // ---------------------------------------------------------------------------
  // Test 5: Binary Image Upload PUT Failure Handling
  // ---------------------------------------------------------------------------
  log('\n--- Test 5: Binary Image PUT Failure Handling ---');
  {
    const originalFetch = global.fetch;
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('initializeUpload')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            value: {
              uploadUrl: 'https://upload.linkedin.com/image-binary',
              image: 'urn:li:image:C999999999',
            },
          }),
        } as Response;
      }
      if (urlStr.includes('upload.linkedin.com')) {
        return {
          ok: false,
          status: 403,
          text: async () => 'Forbidden image payload size',
        } as Response;
      }
      return originalFetch(url);
    }) as typeof fetch;

    const dummyBuffer = Buffer.from('dummy_png_data');
    const res = await uploadLinkedInImage(dummyBuffer, mockConnection, 'Test Hook');
    assert(!res.success, 'Fails gracefully when binary PUT returns 403');
    assert(res.errorReason?.includes('PUT failed') === true, 'Error reason cites PUT failure');

    global.fetch = originalFetch;
  }

  // ---------------------------------------------------------------------------
  // Test 6: Image Attachment Payload & Successful Publication
  // ---------------------------------------------------------------------------
  log('\n--- Test 6: Image Attachment Payload & Successful LinkedIn Publication ---');
  {
    const originalFetch = global.fetch;
    let postBodyCaptured: any = null;

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes('initializeUpload')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            value: {
              uploadUrl: 'https://upload.linkedin.com/image-binary',
              image: 'urn:li:image:C123456789',
            },
          }),
        } as Response;
      }
      if (urlStr.includes('upload.linkedin.com')) {
        return {
          ok: true,
          status: 201,
          text: async () => 'Uploaded',
        } as Response;
      }
      if (urlStr.includes('/rest/posts')) {
        postBodyCaptured = JSON.parse((init?.body as string) || '{}');
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'x-restli-id': 'urn:li:share:987654321' }),
          json: async () => ({ id: 'urn:li:share:987654321' }),
        } as Response;
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const svgUrl = await generateTopicVisual('AI & LLMs', mockPostItem.hook);
    const postWithImage = { ...mockPostItem, imageUrl: svgUrl };

    const publishRes = await publishToLinkedIn(postWithImage, mockConnection);
    assert(publishRes.success, 'Successfully publishes post with image');
    assert(publishRes.linkedinPostId === 'urn:li:share:987654321', 'Returns real LinkedIn post ID');
    assert(publishRes.imageUrn === 'urn:li:image:C123456789', 'Returns uploaded image URN');
    assert(postBodyCaptured?.content?.media?.id === 'urn:li:image:C123456789', 'Attached image URN in REST content.media.id payload');

    global.fetch = originalFetch;
  }

  // ---------------------------------------------------------------------------
  // Test 7: Default Fail-Fast Behavior when Required Image Upload Fails
  // ---------------------------------------------------------------------------
  log('\n--- Test 7: Fail-Fast Behavior when Required Image Fails ---');
  {
    const originalFetch = global.fetch;
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('initializeUpload')) {
        return {
          ok: false,
          status: 400,
          text: async () => 'Invalid member URN',
        } as Response;
      }
      return originalFetch(url);
    }) as typeof fetch;

    const svgUrl = await generateTopicVisual('AI & LLMs', mockPostItem.hook);
    const postWithImage = { ...mockPostItem, imageUrl: svgUrl };

    const publishRes = await publishToLinkedIn(postWithImage, mockConnection);
    assert(!publishRes.success, 'Marks post as FAILED by default when image upload fails');
    assert(publishRes.errorReason?.includes('required image attachment failure') === true, 'Error message cites required image attachment failure');

    global.fetch = originalFetch;
  }

  // ---------------------------------------------------------------------------
  // Test 8: Configurable Allow Text Fallback Behavior
  // ---------------------------------------------------------------------------
  log('\n--- Test 8: Configurable Allow Text Fallback ---');
  {
    const originalFetch = global.fetch;
    let textOnlyPostPayload: any = null;

    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes('initializeUpload')) {
        return {
          ok: false,
          status: 500,
          text: async () => 'Service Unavailable',
        } as Response;
      }
      if (urlStr.includes('/rest/posts')) {
        textOnlyPostPayload = JSON.parse((init?.body as string) || '{}');
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'x-restli-id': 'urn:li:share:fallback_123' }),
          json: async () => ({ id: 'urn:li:share:fallback_123' }),
        } as Response;
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const svgUrl = await generateTopicVisual('AI & LLMs', mockPostItem.hook);
    const postWithImage = { ...mockPostItem, imageUrl: svgUrl };

    const publishRes = await publishToLinkedIn(postWithImage, mockConnection, { allowTextFallback: true });
    assert(publishRes.success, 'Publishes text-only when allowTextFallback is true');
    assert(publishRes.linkedinPostId === 'urn:li:share:fallback_123', 'Returns real post ID for fallback post');
    assert(textOnlyPostPayload?.content === undefined, 'No media attached when fallback is used');

    global.fetch = originalFetch;
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
