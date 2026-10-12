import { ResearchResult } from './researchService';

export interface GeneratedContentPayload {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

/**
 * Safely sanitizes generated content to ensure zero internal demo markers,
 * system timestamps, or internal IDs leak into public content, and enforces 3-5 hashtags max.
 */
export function sanitizePostContent(payload: GeneratedContentPayload): GeneratedContentPayload {
  let { hook, body, cta, hashtags } = payload;

  // 1. Remove internal demo markers and system tags
  const removeMarkers = (text: string): string => {
    return text
      .replace(/\[AUTOPILOT DEMO[^\]]*\]/gi, '')
      .replace(/AUTOPILOT DEMO/gi, '')
      .replace(/\[DEMO\]/gi, '')
      .replace(/demo_post_\w+/gi, '')
      .replace(/This post was generated and scheduled by LinkedIn AI Autopilot at[^\n]*/gi, '')
      .replace(/scheduledAt UTC:[^\n]*/gi, '')
      .replace(/scheduledAt IST:[^\n]*/gi, '')
      .replace(/[ \t]+$/gm, '')
      .trim();
  };

  hook = removeMarkers(hook);
  body = removeMarkers(body);
  cta = removeMarkers(cta);

  // 2. Sanitize hashtags array
  const sanitizedHashtags: string[] = [];
  if (Array.isArray(hashtags)) {
    for (const rawTag of hashtags) {
      const cleanTag = rawTag
        .replace(/\[AUTOPILOT DEMO\]/gi, '')
        .replace(/#AUTOPILOTDEMO\w*/gi, '')
        .trim();
      
      if (cleanTag && cleanTag.startsWith('#') && cleanTag.length > 2) {
        if (!sanitizedHashtags.includes(cleanTag)) {
          sanitizedHashtags.push(cleanTag);
        }
      }
    }
  }

  // 3. Guarantee strictly 3 to 5 hashtags
  let finalHashtags = sanitizedHashtags.slice(0, 5);
  if (finalHashtags.length < 3) {
    const defaultTags = ['#SoftwareEngineering', '#Coding', '#TechCommunity', '#WebDevelopment', '#SoftwareArchitecture'];
    for (const tag of defaultTags) {
      if (!finalHashtags.includes(tag)) {
        finalHashtags.push(tag);
      }
      if (finalHashtags.length >= 3) break;
    }
  }

  return {
    hook,
    body,
    cta,
    hashtags: finalHashtags,
  };
}

export async function generateLinkedInPostContent(
  topic: string,
  research: ResearchResult,
  writingStyle: string = 'Professional & Technical',
  language: string = 'English',
  existingPosts: { hook?: string; body?: string }[] = []
): Promise<GeneratedContentPayload> {
  const apiKey = process.env.AI_API_KEY;

  // Extract recent hooks to explicitly forbid duplicate content
  const recentHooks = existingPosts
    .map((p) => p.hook?.trim())
    .filter((h): h is string => Boolean(h && h.length > 5))
    .slice(0, 10);

  if (apiKey) {
    try {
      const forbiddenContext = recentHooks.length > 0
        ? `\nCRITICAL ANTI-DUPLICATION RULE: You MUST NOT repeat, paraphrase, or closely match any of these existing post hooks:\n${recentHooks.map((h) => `- "${h}"`).join('\n')}\n`
        : '';

      const prompt = `You are a top-tier senior software engineer and technical leader writing an authentic, high-value LinkedIn post about "${topic}".
Language: ${language}
Writing Style: ${writingStyle}
Research Context: "${research.summary}"
${forbiddenContext}
REQUIREMENTS:
1. First line (hook): Must be a strong, engaging opening that grabs attention. Avoid AI clichés like "In today's fast-paced world", "Unlocking the power of...", "Game-changer", or "Deep dive".
2. Body: Write short, readable paragraphs (1-3 sentences) separated by clean line breaks. Use bullet points or numbered lists to highlight practical engineering lessons, architectural principles, or code tips.
3. Call to Action (cta): End with a thoughtful, conversational question that invites software developers and engineers to share their experiences in the comments.
4. Hashtags: Provide strictly 3 to 5 highly relevant tech hashtags starting with #.
5. Voice: Authentic, professional developer. Do not invent fake personal metrics, fake company achievements, or system demo text.

Return STRICT JSON with keys: "hook", "body", "cta", "hashtags" (array of strings).`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanedText = text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

          const parsed = JSON.parse(cleanedText);
          const rawPayload: GeneratedContentPayload = {
            hook: parsed.hook || `Key architectural lessons when working with ${topic}.`,
            body: parsed.body || research.summary,
            cta: parsed.cta || `What has been your experience with ${topic}? Let's discuss below!`,
            hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0
              ? parsed.hashtags
              : [`#${topic.replace(/\s+/g, '')}`, '#SoftwareEngineering', '#Coding'],
          };

          const sanitized = sanitizePostContent(rawPayload);

          // Verify sanitized output is not a duplicate of existing posts
          const isDuplicate = existingPosts.some(
            (p) =>
              (p.hook && p.hook.trim().toLowerCase() === sanitized.hook.trim().toLowerCase()) ||
              (p.body && p.body.trim().toLowerCase() === sanitized.body.trim().toLowerCase())
          );

          if (!isDuplicate) {
            return sanitized;
          }
          console.warn('[AI Service] AI generated content matched an existing post. Falling back to unique curated tech engine.');
        }
      } else {
        console.warn(`AI API returned status ${res.status}. Utilizing curated tech engine.`);
      }
    } catch (err) {
      console.warn('AI API call exception, utilizing research-backed generator fallback:', err);
    }
  }

  return generateCuratedTechPost(topic, research, writingStyle, existingPosts);
}

export function generateCuratedTechPost(
  topic: string,
  research: ResearchResult,
  writingStyle: string = 'Professional & Technical',
  existingPosts: { hook?: string; body?: string }[] = []
): GeneratedContentPayload {
  const normTopic = topic.trim().toLowerCase();

  // Multi-variant curated templates per topic category
  const templates: Record<string, GeneratedContentPayload[]> = {
    ai: [
      {
        hook: '⚡ Most engineering teams misuse LLMs in production. Here is how robust AI architecture works in 2026.',
        body: `Building reliable AI products is 20% model selection and 80% system design.\n\n4 architectural layers every production AI app needs:\n\n1. Strict Schema Enforcement: Guaranteeing JSON output contracts so downstream services never break.\n2. Semantic Caching: Caching query embeddings to reduce API latency by 75% and cut costs.\n3. Context & RAG Pipelines: Grounding responses with vector search to eliminate hallucinations.\n4. Graceful Fallbacks: Retrying with fallback models when primary endpoints hit rate limits.`,
        cta: 'How is your team handling output validation for LLMs in production?',
        hashtags: ['#AI', '#SoftwareArchitecture', '#SystemDesign', '#LLMs', '#SoftwareEngineering'],
      },
      {
        hook: '🤖 The biggest mistake developers make with AI agents is giving them unconstrained tools.',
        body: `Autonomous AI workflows sound incredible until an unhandled edge case causes infinite API loops.\n\n3 safety practices for building production-ready AI tools:\n\n1. Deterministic Guardrails: Set hard upper bounds on execution steps and token consumption.\n2. Human-in-the-Loop Triggers: Require explicit user approval for destructive or high-cost operations.\n3. Comprehensive Audit Tracing: Log prompt inputs, model responses, and tool arguments for observability.`,
        cta: 'What guardrails have you implemented in your AI agent pipelines?',
        hashtags: ['#ArtificialIntelligence', '#SoftwareEngineering', '#AIAgents', '#DeveloperExperience'],
      },
      {
        hook: '🛠️ I built and deployed an AI-powered application to production. Here is what actually worked.',
        body: `Shipping an AI application beyond a demo reveals harsh production realities quickly.\n\n3 hard-won engineering principles from our deployment:\n\n1. Deterministic Fallbacks Beat Bigger Prompts: Code-level retries and circuit breakers save more users than prompt tweaking.\n2. Streaming UI is Non-Negotiable: Users accept 4-second total latency if token streaming begins in 200ms.\n3. Continuous Evaluation Datasets: Automated golden-set regression testing caught 90% of model drift before users did.`,
        cta: 'What was your biggest surprise when taking an AI feature from prototype to production?',
        hashtags: ['#ArtificialIntelligence', '#SoftwareEngineering', '#ProductDevelopment', '#FullStack'],
      },
      {
        hook: '📊 RAG architecture in 2026: Why naive vector search is failing your enterprise data.',
        body: `Simply dumping text chunks into a vector database and doing cosine similarity yields noisy retrieval.\n\nModern retrieval pipelines require 3 essential upgrades:\n\n1. Hybrid Search: Combining sparse BM25 keyword matching with dense embeddings.\n2. Cross-Encoder Reranking: Scoring top-50 results with a reranker to filter low-relevance chunks.\n3. Parent-Document Retrieval: Indexing small chunks for accuracy, but passing larger document context to the model.`,
        cta: 'How are you optimizing retrieval precision in your RAG pipelines?',
        hashtags: ['#GenerativeAI', '#RAG', '#VectorDatabases', '#SearchArchitecture'],
      },
      {
        hook: '💰 3 pragmatic strategies that cut our production LLM API bill by 60% without hurting quality.',
        body: `High token bills are usually caused by architectural laziness, not high user traffic.\n\nWhere to optimize immediately:\n\n1. Prompt Compression: Stripping redundant system instructions and using terse few-shot examples.\n2. Tiered Model Routing: Sending 80% of routine classifications to lightweight models, reserving frontier models for reasoning.\n3. Exact and Semantic Caching: Serving repeated user queries directly from Redis key-value cache.`,
        cta: 'What methods has your team used to manage AI operational costs?',
        hashtags: ['#FinOps', '#LLMOps', '#SoftwareArchitecture', '#CloudComputing'],
      },
    ],
    react: [
      {
        hook: '💡 React 19 is fundamentally changing how we handle server state and rendering.',
        body: `If you are still writing manual useMemo and useCallback hooks everywhere, React 19 simplifies your codebase significantly.\n\nKey architectural upgrades:\n\n1. React Compiler: Auto-memoizes components and hooks under the hood.\n2. Server Actions: Direct, type-safe server mutations without boilerplate endpoint handlers.\n3. Optimistic Updates: Built-in hooks for instant client UI updates before network confirmation.`,
        cta: 'Are you using React 19 in production yet, or planning an upgrade soon?',
        hashtags: ['#ReactJS', '#NextJS', '#WebDevelopment', '#FrontendDev'],
      },
      {
        hook: '🎨 Stop over-complicating client-side state management in modern React applications.',
        body: `Before adding another heavy state library to your bundle, ask: is this server state or local UI state?\n\n3 rules for clean React state:\n\n1. Server State Belongs to the Data Layer: Let React Query or Server Components handle caching.\n2. Derive UI State: If a value can be computed from props, compute it during rendering.\n3. Keep State Local: Lift state up only as far as necessary to share between sibling components.`,
        cta: 'What is your preferred approach for state management in React today?',
        hashtags: ['#ReactJS', '#WebDev', '#CleanCode', '#SoftwareArchitecture'],
      },
      {
        hook: '⚡ How to achieve 95+ Lighthouse performance scores in Next.js App Router applications.',
        body: `Fast web apps are built by disciplined architectural choices, not post-launch patches.\n\n3 rules for peak frontend performance:\n\n1. Zero Client JS for Static Content: Leverage React Server Components as the default boundary.\n2. Font & Image Optimization: Use next/font and next/image with explicit layout sizes to avoid layout shift (CLS).\n3. Dynamic Imports for Heavy Modals: Lazy-load charts, editors, and rich components until user interaction.`,
        cta: 'What is your highest-impact performance tweak for modern web apps?',
        hashtags: ['#NextJS', '#WebPerformance', '#FrontendEngineering', '#WebDev'],
      },
    ],
    typescript: [
      {
        hook: '⚡ 4 advanced TypeScript patterns that make your codebase self-documenting.',
        body: `Strong type safety isn't about pleasing the compiler—it's about catching logic errors before runtime.\n\nEssential TS techniques:\n\n1. Discriminated Unions: Ensuring every state variation is explicitly handled in switch statements.\n2. Template Literal Types: Enforcing exact string patterns like API endpoints or CSS units.\n3. satisfies Operator: Validating object structures without losing type inference for literal values.\n4. Brand Types: Preventing accidental mixing of primitive IDs (e.g. UserId vs PostId).`,
        cta: 'Which TypeScript feature has saved you from the most production bugs?',
        hashtags: ['#TypeScript', '#JavaScript', '#WebDev', '#CodingTips'],
      },
      {
        hook: '🛡️ Stop using `any` and `as unknown as`: How to write truly resilient TypeScript.',
        body: `Type assertions bypass the compiler's guarantees and turn compile-time errors into runtime exceptions.\n\n3 safer alternatives:\n\n1. Type Guards (is): Write narrow runtime assertion functions that prove data shape.\n2. Zod Runtime Parsing: Validate external API payloads at boundaries and infer types automatically.\n3. unknown with Exhaustive Checking: Force explicit branches before accessing unknown properties.`,
        cta: 'How strictly does your team enforce no-explicit-any in ESLint rules?',
        hashtags: ['#TypeScript', '#CleanCode', '#SoftwareEngineering', '#CodeQuality'],
      },
    ],
    backend: [
      {
        hook: '🔒 Designing resilient APIs: Why idempotency keys are non-negotiable for payment and POST endpoints.',
        body: `Network drops and automatic client retries happen every day. Without idempotency, users get billed twice or duplicate records get created.\n\nHow to implement robust idempotency:\n\n1. Pass Unique Header: Require client-generated 'Idempotency-Key' headers on state-mutating requests.\n2. Cache Initial Response: Store the request fingerprint and status in Redis for 24 hours.\n3. Return Cached Result on Retry: If a duplicate key arrives, return the stored response without re-executing logic.`,
        cta: 'How do you handle API request retry safety in your backend services?',
        hashtags: ['#BackendDev', '#APIDesign', '#SystemDesign', '#SoftwareEngineering'],
      },
      {
        hook: '⚙️ Database connection pooling: The silent bottleneck crashing your serverless microservices.',
        body: `Spinning up hundreds of serverless functions during traffic spikes exhausts database connection limits instantly.\n\n3 production patterns for serverless database stability:\n\n1. Connection Poolers: Use PgBouncer or Supabase transaction poolers to queue requests.\n2. Client Reuse: Cache database connections in global execution context across lambda invocations.\n3. Short Connection Timeouts: Fail fast instead of holding connections open during downstream delays.`,
        cta: 'How do you manage database connections in high-throughput serverless systems?',
        hashtags: ['#BackendEngineering', '#Databases', '#Serverless', '#SystemArchitecture'],
      },
    ],
    debugging: [
      {
        hook: "🔍 The difference between junior and senior debugging isn't speed—it's systematic isolation.",
        body: `When production breaks under pressure, random trial-and-error changes usually make things worse.\n\nA proven 4-step debugging protocol:\n\n1. Reproduce Consistently: Create a minimal test case before writing any fix code.\n2. Formulate & Test Hypotheses: Change exactly one variable at a time.\n3. Verify Root Cause: Prove why the bug occurred, not just that it went away.\n4. Write Regression Tests: Ensure the exact bug scenario is tested automatically in CI/CD.`,
        cta: 'What is the most memorable debugging lesson you learned the hard way?',
        hashtags: ['#SoftwareEngineering', '#Debugging', '#DeveloperExperience', '#TechTips'],
      },
    ],
    devops: [
      {
        hook: "🚀 Automated CI/CD pipelines shouldn't just run tests—they should enforce production quality standards.",
        body: `A great continuous integration pipeline gives engineering teams total deployment confidence.\n\nCore pipeline checks every PR should pass:\n\n1. Type Safety & Static Analysis: Block builds on TypeScript errors or ESLint violations.\n2. Fast Unit & Integration Testing: Execute targeted test suites in parallel under 2 minutes.\n3. Ephemeral Staging Previews: Test changes in an isolated environment matching production.\n4. Zero-Downtime Rolling Deploys: Automatically roll back if health check endpoints report errors.`,
        cta: 'What check in your CI/CD pipeline has saved your team from deploying bad code?',
        hashtags: ['#DevOps', '#CICD', '#SoftwareEngineering', '#Automation'],
      },
    ],
  };

  // Find matching key
  let selectedCategory = 'ai';
  if (normTopic.includes('ai') || normTopic.includes('llm') || normTopic.includes('agent')) selectedCategory = 'ai';
  else if (normTopic.includes('react') || normTopic.includes('next')) selectedCategory = 'react';
  else if (normTopic.includes('typescript') || normTopic.includes('javascript') || normTopic.includes('js')) selectedCategory = 'typescript';
  else if (normTopic.includes('backend') || normTopic.includes('database') || normTopic.includes('api')) selectedCategory = 'backend';
  else if (normTopic.includes('debug') || normTopic.includes('architecture')) selectedCategory = 'debugging';
  else if (normTopic.includes('devops') || normTopic.includes('automation') || normTopic.includes('deploy')) selectedCategory = 'devops';

  const categoryList = templates[selectedCategory] || templates['ai'];

  // Helper to test if a candidate matches any existing post
  const isDuplicateOfExisting = (candidate: GeneratedContentPayload): boolean => {
    return existingPosts.some(
      (existing) =>
        (existing.hook && existing.hook.trim().toLowerCase() === candidate.hook.trim().toLowerCase()) ||
        (existing.body && existing.body.trim().toLowerCase() === candidate.body.trim().toLowerCase())
    );
  };

  // 1. First attempt: Find an unused template in the selected category
  const availableInCategory = categoryList.filter((item) => !isDuplicateOfExisting(item));

  if (availableInCategory.length > 0) {
    const templateIndex = Math.floor(Math.random() * availableInCategory.length);
    return sanitizePostContent(availableInCategory[templateIndex]);
  }

  // 2. Second attempt: Find any unused template across all categories
  const allTemplates = Object.values(templates).flat();
  const availableGlobal = allTemplates.filter((item) => !isDuplicateOfExisting(item));

  if (availableGlobal.length > 0) {
    const templateIndex = Math.floor(Math.random() * availableGlobal.length);
    return sanitizePostContent(availableGlobal[templateIndex]);
  }

  // 3. Fallback: Synthesize a completely unique post derived from the topic and research summary
  const uniquePayload: GeneratedContentPayload = {
    hook: `💡 Engineering perspective: Real-world architectural takeaways on "${topic}".`,
    body: `${research.summary || `When architecting reliable systems around ${topic}, focus on decoupling dependencies, rigorous input validation, and comprehensive automated observability.`}\n\n3 key lessons:\n\n1. Design for resilience over complexity.\n2. Isolate failure domains early.\n3. Ground every implementation with automated regression testing.`,
    cta: `What is your primary architectural principle when implementing ${topic}?`,
    hashtags: [`#${topic.replace(/[^a-zA-Z0-9]/g, '')}`, '#SoftwareEngineering', '#SystemArchitecture', '#TechLead'],
  };

  return sanitizePostContent(uniquePayload);
}
