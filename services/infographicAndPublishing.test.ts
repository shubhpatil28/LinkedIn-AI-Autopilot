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
  // Test 9: Total Absence of foreignObject Across All Topics
  // ---------------------------------------------------------------------------
  log('\n--- Test 9: Strict Absence of foreignObject in All Generated SVGs ---');
  {
    const topicsToTest = [
      'AI & LLMs',
      'React & Next.js',
      'TypeScript & JavaScript',
      'Backend & Databases',
      'Debugging & Architecture',
      'DevOps & Automation',
      'Unknown Custom Topic',
    ];

    for (const topic of topicsToTest) {
      const svg = generateTopicVisualSvg(topic, `Deep dive into ${topic}`);
      assert(!svg.includes('<foreignObject'), `No <foreignObject tag in ${topic} SVG`);
      assert(!svg.includes('foreignObject>'), `No foreignObject closing tag in ${topic} SVG`);
    }
  }

  // ---------------------------------------------------------------------------
  // Test 10: Content-Aware AI Agent Safety Layout & Required Labels
  // ---------------------------------------------------------------------------
  log('\n--- Test 10: AI Agent Safety Diagram Architecture & Required Labels ---');
  {
    const aiSafetyHook = '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.';
    const aiSafetyBody = 'Autonomous AI workflows sound incredible until an unhandled edge case causes infinite API loops.\n\n3 safety practices for building production-ready AI tools:\n1. Deterministic Guardrails: Set hard upper bounds on execution steps.\n2. Human-in-the-Loop Triggers: Require explicit user approval.\n3. Comprehensive Audit Tracing: Log prompt inputs and tool arguments.';

    const svg = generateTopicVisualSvg('AI & LLMs', aiSafetyHook, aiSafetyBody);

    assert(svg.includes('User Request'), 'Contains "User Request" stage');
    assert(svg.includes('Agent Orchestrator'), 'Contains "Agent Orchestrator" stage');
    assert(svg.includes('Tool Execution'), 'Contains "Tool Execution" stage');
    assert(svg.includes('Safety Guardrails'), 'Contains "Safety Guardrails" governance node');
    assert(svg.includes('Human Approval'), 'Contains "Human Approval" governance node');
    assert(svg.includes('Audit Logs'), 'Contains "Audit Logs" observability stage');
    assert(svg.includes('AI AGENT ARCHITECTURE &amp; SAFETY CONTROLS'), 'Contains AI safety badge');
    assert(!svg.includes('<foreignObject'), 'Zero foreignObject in AI Safety diagram');
  }

  // ---------------------------------------------------------------------------
  // Test 11: SVG Validation Guardrail (validateSvgOutput)
  // ---------------------------------------------------------------------------
  log('\n--- Test 11: SVG Validation Guardrail ---');
  {
    const validSvg = generateTopicVisualSvg('AI & LLMs', 'Test Headline');
    const { validateSvgOutput } = await import('./serverVisualService');

    let threwForValid = false;
    try {
      validateSvgOutput(validSvg);
    } catch {
      threwForValid = true;
    }
    assert(!threwForValid, 'validateSvgOutput passes for generated SVG');

    let threwForForeignObject = false;
    try {
      validateSvgOutput('<svg width="1200" height="630"><foreignObject><div>test</div></foreignObject><text>1</text><text>2</text><text>3</text><text>4</text><text>5</text></svg>');
    } catch (err: any) {
      threwForForeignObject = err.message.includes('foreignObject detected');
    }
    assert(threwForForeignObject, 'validateSvgOutput rejects foreignObject');
  }

  // ---------------------------------------------------------------------------
  // Test 12: Topic-Specific Layout Verification
  // ---------------------------------------------------------------------------
  log('\n--- Test 12: Topic-Specific Layout Specialization ---');
  {
    const tsSvg = generateTopicVisualSvg('TypeScript & JavaScript', 'Type Guard Patterns');
    assert(tsSvg.includes('typescript-pattern.ts'), 'TypeScript generates code editor layout');
    assert(tsSvg.includes('Discriminated Result Union'), 'TypeScript contains code comment callouts');

    const devopsSvg = generateTopicVisualSvg('DevOps & Automation', 'CI/CD Pipeline Flow');
    assert(devopsSvg.includes('AUTOMATION &amp; CI/CD RELEASE PIPELINES'), 'DevOps generates pipeline layout');

    const debugSvg = generateTopicVisualSvg('Debugging & Architecture', 'Root Cause Analysis');
    assert(debugSvg.includes('SYSTEM DIAGNOSTICS &amp; ROOT CAUSE ANALYSIS'), 'Debugging generates diagnostic layout');
  }

  // ---------------------------------------------------------------------------
  // Test 13: PNG Buffer Validation for AI Safety Infographic
  // ---------------------------------------------------------------------------
  log('\n--- Test 13: High-Quality PNG Conversion for AI Agent Safety ---');
  {
    const aiSafetyHook = '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.';
    const aiSafetyBody = 'Autonomous AI workflows sound incredible until an unhandled edge case causes infinite API loops.';
    const svg = generateTopicVisualSvg('AI & LLMs', aiSafetyHook, aiSafetyBody);
    const pngBuffer = await convertSvgToPngBuffer(svg);

    assert(Buffer.isBuffer(pngBuffer), 'PNG output is valid Buffer');
    assert(pngBuffer.length > 10000, `AI Safety PNG has rich graphic density (${pngBuffer.length} bytes > 10KB)`);

    // PNG signature check: 89 50 4E 47 0D 0A 1A 0A
    const isPngHeader = pngBuffer[0] === 0x89 && pngBuffer[1] === 0x50 && pngBuffer[2] === 0x4E && pngBuffer[3] === 0x47;
    assert(isPngHeader, 'Valid PNG binary signature header');
  }

  // ---------------------------------------------------------------------------
  // Test 14: SVG text elements have non-empty content for all 4 layout types
  // ---------------------------------------------------------------------------
  log('\n--- Test 14: SVG Text Content Non-Empty Across All Layout Types ---');
  {
    const { validateSvgTextContent } = await import('./serverVisualService');

    const layouts = [
      { topic: 'AI & LLMs', hook: 'Production AI agent safety and guardrails', body: 'Deterministic guardrails and human-in-the-loop triggers for AI safety.' },
      { topic: 'TypeScript & JavaScript', hook: 'Advanced TypeScript type patterns', body: '' },
      { topic: 'React & Next.js', hook: 'React 19 Server Actions', body: '' },
      { topic: 'Backend & Databases', hook: 'Idempotent API processing pipeline', body: '' },
    ];

    for (const { topic, hook, body } of layouts) {
      const svg = generateTopicVisualSvg(topic, hook, body);

      // Every <text> element must have visible content
      let threw = false;
      try {
        validateSvgTextContent(svg);
      } catch (e: any) {
        threw = true;
        log(`  ERROR in ${topic}: ${e.message}`);
      }
      assert(!threw, `No empty <text> elements in "${topic}" SVG`);

      // Keyword spot-checks: confirm actual expected strings exist in SVG text
      if (topic.includes('AI')) {
        assert(svg.includes('User Request'), `AI Safety SVG contains "User Request" text`);
        assert(svg.includes('Safety Guardrails'), `AI Safety SVG contains "Safety Guardrails" text`);
      }
      if (topic.includes('TypeScript')) {
        assert(svg.includes('Result'), `TypeScript SVG contains code content`);
        assert(svg.includes('Principle'), `TypeScript SVG contains principle sidebar`);
      }
      if (topic.includes('React')) {
        assert(svg.includes('Server Component'), `React SVG contains "Server Component" node`);
        assert(svg.includes('Optimistic UI'), `React SVG contains "Optimistic UI" node`);
      }
      if (topic.includes('Backend')) {
        assert(svg.includes('API Gateway'), `Backend SVG contains "API Gateway" node`);
        assert(svg.includes('Redis Cache Lock'), `Backend SVG contains "Redis Cache Lock" node`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Test 15: PNG pixel non-uniformity — rendered PNG must not be a solid color
  // (A solid-color PNG means all text/graphics were dropped during rasterization)
  // ---------------------------------------------------------------------------
  log('\n--- Test 15: PNG Pixel Diversity — Rendered PNG Must Have Multiple Colors ---');
  {
    const parsePngIhdr = (buf: Buffer): { width: number; height: number } => {
      // PNG: 8-byte sig + 4-byte chunk length + 4-byte 'IHDR' + 4-byte W + 4-byte H
      if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
        throw new Error('Not a valid PNG file');
      }
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    };

    const testTopics = [
      { topic: 'AI & LLMs', hook: 'Production AI safety architecture', body: 'Safety guardrails and human-in-the-loop.' },
      { topic: 'TypeScript & JavaScript', hook: 'TypeScript design patterns', body: '' },
      { topic: 'React & Next.js', hook: 'React Server Components', body: '' },
      { topic: 'Backend & Databases', hook: 'Distributed API processing', body: '' },
    ];

    for (const { topic, hook, body } of testTopics) {
      const svg = generateTopicVisualSvg(topic, hook, body);
      const pngBuffer = await convertSvgToPngBuffer(svg);

      // Check dimensions via IHDR
      const { width, height } = parsePngIhdr(pngBuffer);
      assert(width === 1200, `"${topic}" PNG width is 1200px (got ${width})`);
      assert(height === 630, `"${topic}" PNG height is 630px (got ${height})`);

      // Sample raw bytes from different regions of the PNG IDAT data
      // A blank/text-invisible PNG will have very few unique byte patterns.
      // Count distinct byte values across a sample of 512 bytes deep in the data.
      const sampleStart = Math.floor(pngBuffer.length * 0.3); // skip PNG header
      const sampleEnd = Math.min(sampleStart + 512, pngBuffer.length);
      const sample = pngBuffer.slice(sampleStart, sampleEnd);
      const uniqueBytes = new Set(Array.from(sample)).size;

      // A solid-color or near-blank PNG will have very few unique byte values
      // (IDAT is zlib-compressed so even blank images have some entropy,
      // but rendered text + gradients produce significantly higher byte diversity)
      assert(uniqueBytes >= 20,
        `"${topic}" PNG has sufficient byte diversity (${uniqueBytes} unique byte values, indicating rendered content)`
      );

      // Size sanity: fonts + text + gradient should produce at least 50KB
      assert(pngBuffer.length > 50000,
        `"${topic}" PNG file size indicates real content (${pngBuffer.length} bytes > 50KB)`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Test 16: Font presence detection — render two PNGs, one with font and one
  // without (using an invalid font path), and assert they differ. This directly
  // verifies that the font loading code path is active and affects the output.
  // ---------------------------------------------------------------------------
  log('\n--- Test 16: Font Loading Has Observable Effect on PNG Output ---');
  {
    const { Resvg } = await import('@resvg/resvg-js');
    const svg = generateTopicVisualSvg('React & Next.js', 'Server Components Architecture');

    // Render WITH fonts (production path via convertSvgToPngBuffer)
    const withFontBuffer = await convertSvgToPngBuffer(svg);

    // Render WITHOUT fonts (no font options — what old code did)
    const resvgNoFont = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { loadSystemFonts: false }, // empty font DB — simulates Vercel before fix
    });
    const noFontPngData = resvgNoFont.render();
    const withoutFontBuffer = noFontPngData.asPng();

    // The two PNGs must differ because text renders differently with vs without fonts
    const areDifferent = !withFontBuffer.equals(withoutFontBuffer);
    assert(areDifferent,
      'PNG rendered with bundled font differs from PNG rendered without font ' +
      '(proves font loading has a real effect on output)'
    );

    // The with-font version should be larger (text adds pixel variation → less compression)
    const sizeDiffBytes = withFontBuffer.length - withoutFontBuffer.length;
    log(`  Font effect: with-font=${withFontBuffer.length}B, without-font=${withoutFontBuffer.length}B, diff=${sizeDiffBytes}B`);
    assert(withFontBuffer.length !== withoutFontBuffer.length,
      `With-font PNG size (${withFontBuffer.length}B) differs from without-font PNG size (${withoutFontBuffer.length}B)`
    );
  }

  // ---------------------------------------------------------------------------
  // Test 17: No empty <text> tags guard in validateSvgTextContent
  // ---------------------------------------------------------------------------
  log('\n--- Test 17: validateSvgTextContent Rejects Empty Text Elements ---');
  {
    const { validateSvgTextContent } = await import('./serverVisualService');

    // Should pass on valid generated SVG
    const validSvg = generateTopicVisualSvg('DevOps & Automation', 'CI/CD Pipeline Architecture');
    let threwForValid = false;
    try { validateSvgTextContent(validSvg); } catch { threwForValid = true; }
    assert(!threwForValid, 'validateSvgTextContent passes for fully-populated generated SVG');

    // Should reject SVG with a blank <text> element
    const svgWithEmptyText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <text x="100" y="100" font-family="Inter">Hello</text>
      <text x="200" y="200" font-family="Inter"></text>
    </svg>`;
    let threwForEmpty = false;
    try { validateSvgTextContent(svgWithEmptyText); } catch { threwForEmpty = true; }
    assert(threwForEmpty, 'validateSvgTextContent rejects SVG containing empty <text></text> element');

    // Should reject SVG with whitespace-only <text> element
    const svgWithWhitespaceText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <text x="100" y="100" font-family="Inter">STEP 01</text>
      <text x="200" y="200" font-family="Inter">   </text>
    </svg>`;
    let threwForWhitespace = false;
    try { validateSvgTextContent(svgWithWhitespaceText); } catch { threwForWhitespace = true; }
    assert(threwForWhitespace, 'validateSvgTextContent rejects SVG containing whitespace-only <text> element');
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

