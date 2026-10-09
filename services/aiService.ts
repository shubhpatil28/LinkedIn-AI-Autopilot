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
  language: string = 'English'
): Promise<GeneratedContentPayload> {
  const apiKey = process.env.AI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a top-tier senior software engineer and technical leader writing an authentic, high-value LinkedIn post about "${topic}".
Language: ${language}
Writing Style: ${writingStyle}
Research Context: "${research.summary}"

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

          return sanitizePostContent(rawPayload);
        }
      } else {
        console.warn(`AI API returned status ${res.status}. Utilizing curated tech engine.`);
      }
    } catch (err) {
      console.warn('AI API call exception, utilizing research-backed generator fallback:', err);
    }
  }

  return generateCuratedTechPost(topic, research, writingStyle);
}

function generateCuratedTechPost(
  topic: string,
  research: ResearchResult,
  writingStyle: string
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
    ],
    typescript: [
      {
        hook: '⚡ 4 advanced TypeScript patterns that make your codebase self-documenting.',
        body: `Strong type safety isn't about pleasing the compiler—it's about catching logic errors before runtime.\n\nEssential TS techniques:\n\n1. Discriminated Unions: Ensuring every state variation is explicitly handled in switch statements.\n2. Template Literal Types: Enforcing exact string patterns like API endpoints or CSS units.\n3. satisfies Operator: Validating object structures without losing type inference for literal values.\n4. Brand Types: Preventing accidental mixing of primitive IDs (e.g. UserId vs PostId).`,
        cta: 'Which TypeScript feature has saved you from the most production bugs?',
        hashtags: ['#TypeScript', '#JavaScript', '#WebDev', '#CodingTips'],
      },
    ],
    backend: [
      {
        hook: '🔒 Designing resilient APIs: Why idempotency keys are non-negotiable for payment and POST endpoints.',
        body: `Network drops and automatic client retries happen every day. Without idempotency, users get billed twice or duplicate records get created.\n\nHow to implement robust idempotency:\n\n1. Pass Unique Header: Require client-generated 'Idempotency-Key' headers on state-mutating requests.\n2. Cache Initial Response: Store the request fingerprint and status in Redis for 24 hours.\n3. Return Cached Result on Retry: If a duplicate key arrives, return the stored response without re-executing logic.`,
        cta: 'How do you handle API request retry safety in your backend services?',
        hashtags: ['#BackendDev', '#APIDesign', '#SystemDesign', '#SoftwareEngineering'],
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
  let selectedCategory = 'coding';
  if (normTopic.includes('ai') || normTopic.includes('llm')) selectedCategory = 'ai';
  else if (normTopic.includes('react') || normTopic.includes('next')) selectedCategory = 'react';
  else if (normTopic.includes('typescript') || normTopic.includes('javascript') || normTopic.includes('js')) selectedCategory = 'typescript';
  else if (normTopic.includes('backend') || normTopic.includes('database') || normTopic.includes('api')) selectedCategory = 'backend';
  else if (normTopic.includes('debug') || normTopic.includes('architecture')) selectedCategory = 'debugging';
  else if (normTopic.includes('devops') || normTopic.includes('automation')) selectedCategory = 'devops';

  const categoryList = templates[selectedCategory] || templates['ai'];
  const templateIndex = Math.floor(Math.random() * categoryList.length);
  const rawPost = categoryList[templateIndex];

  return sanitizePostContent(rawPost);
}
