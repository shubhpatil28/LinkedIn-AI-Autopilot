import { ResearchResult } from './researchService';

export interface GeneratedContentPayload {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
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
      const prompt = `You are a top 1% tech creator on LinkedIn. Generate an impactful, highly professional LinkedIn post about "${topic}".
Language: ${language}
Writing Style: ${writingStyle}
Research Context: "${research.summary}"

Rules:
1. Focus strictly on real software engineering & tech principles.
2. Structure output strictly as JSON with keys: "hook", "body", "cta", "hashtags" (array of strings starting with #).
3. The hook must be catchy, professional, and developer-focused.
4. The body must contain clear, useful technical insights or best practices.
5. The CTA must invite meaningful professional discussion in the comments.

Output format JSON:
{
  "hook": "...",
  "body": "...",
  "cta": "...",
  "hashtags": ["#Topic", "#Coding"]
}`;

      // Support Gemini API when key is set
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
          // Clean markdown code blocks if present in response
          const cleanedText = text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

          const parsed = JSON.parse(cleanedText);
          return {
            hook: parsed.hook || `Unlocking the Power of ${topic} in Modern Tech`,
            body: parsed.body || research.summary,
            cta: parsed.cta || `What's your experience with ${topic}? Let's connect in the comments!`,
            hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0
              ? parsed.hashtags
              : [`#${topic.replace(/\s+/g, '')}`, '#Tech', '#SoftwareEngineering'],
          };
        }
      } else {
        console.warn(`AI API returned status ${res.status}. Falling back to curated tech engine.`);
      }
    } catch (err) {
      console.warn('AI API call exception, utilizing research-backed generator fallback:', err);
    }
  }

  // Fallback curated tech engine when AI_API_KEY is not set or during network offline
  return generateCuratedTechPost(topic, research, writingStyle);
}

function generateCuratedTechPost(
  topic: string,
  research: ResearchResult,
  writingStyle: string
): GeneratedContentPayload {
  const curatedTemplates: Record<string, GeneratedContentPayload> = {
    AI: {
      hook: '⚡ Most developers build AI apps wrong. Here is how modern AI architecture actually works in 2026.',
      body: `Building scalable AI products isn't just about calling an API endpoint—it's about robust system design.\n\nHere are 4 critical layers top engineering teams implement:\n\n1. Structured Output Schema: Guaranteeing strict JSON contracts for reliable downstream processing.\n2. Context & RAG Pipelines: Grounding LLMs with real-time vector search to eliminate hallucinations.\n3. Latency & Caching: Caching semantic queries to reduce API costs and lower latency by 80%.\n4. Failover & Guardrails: Graceful degradation when AI models encounter rate limits.\n\n${research.summary}`,
      cta: 'How is your team handling LLM output validation in production? Let me know below!',
      hashtags: ['#AI', '#ArtificialIntelligence', '#SoftwareArchitecture', '#MachineLearning', '#TechInnovation'],
    },
    JavaScript: {
      hook: '🚀 5 JavaScript concepts that separate senior developers from beginners.',
      body: `Writing clean JavaScript is about understanding the runtime engine, memory management, and asynchronous flow control.\n\nKey takeaways every JS developer must master:\n\n1. Event Loop & Microtask Queue: Knowing why Promise callbacks take priority over setTimeout.\n2. Closures & Lexical Scope: Harnessing clean encapsulation without leaking memory.\n3. Explicit Resource Management: Utilizing modern 'using' statements for deterministic cleanup.\n4. Immutability & Pure Functions: Avoiding side effects in state management pipelines.\n5. Structured Clone API: Performing deep clones efficiently without JSON hacks.\n\n${research.summary}`,
      cta: 'Which JavaScript feature improved your workflow the most recently? Comment your thoughts!',
      hashtags: ['#JavaScript', '#WebDev', '#Coding', '#Frontend', '#SoftwareEngineering'],
    },
    React: {
      hook: '💡 Stop over-complicating React state management. Here is how modern React 19 simplifies everything.',
      body: `React 19 marks a major shift in how we think about rendering, component state, and asynchronous server boundaries.\n\n3 Game-Changing Improvements:\n\n1. React Compiler: Auto-memoizes components, rendering manual useMemo and useCallback boilerplate obsolete.\n2. Server Actions: Direct type-safe server mutations without boilerplate API handlers.\n3. Optimistic UI Updates: Built-in hooks for instant user response before network confirmation.\n\n${research.summary}`,
      cta: 'Are you planning to upgrade to React 19 in your next production release?',
      hashtags: ['#ReactJS', '#NextJS', '#WebDevelopment', '#FrontendDev', '#React19'],
    },
    'Web Development': {
      hook: '🌐 Web performance is no longer optional—it is a core business feature.',
      body: `A 100ms delay in page load time directly impacts user engagement and conversion rates.\n\nCore Pillars of High-Performance Web Architecture:\n\n1. Interaction to Next Paint (INP): Optimizing main-thread responsiveness.\n2. Modern CSS (Container Queries & Subgrid): Eliminating heavy JS layout calculations.\n3. Edge Server Rendering: Serving dynamic HTML from edge nodes closest to the user.\n4. Asset Optimization: Utilizing next-gen WebP/AVIF formats and responsive image sets.\n\n${research.summary}`,
      cta: 'What is your top strategy for optimizing Core Web Vitals this year?',
      hashtags: ['#WebDevelopment', '#WebPerformance', '#CoreWebVitals', '#Frontend', '#UXDesign'],
    },
    Coding: {
      hook: '🛠️ Writing code is easy. Writing maintainable software is an art form.',
      body: `Good code explains itself. Great code prevents bugs before they ever reach production.\n\n4 Engineering Principles to Live By:\n\n1. Single Responsibility: Every function and module should do one thing exceptionally well.\n2. Type Safety & Contracts: Catching interface bugs at build time rather than runtime.\n3. Idempotency & Resiliency: Designing APIs that safely retry failures without duplicating state.\n4. Comprehensive Test Guardrails: Automated regression checks on every pull request.\n\n${research.summary}`,
      cta: 'What coding principle has saved you the most headache during late-night deployments?',
      hashtags: ['#Coding', '#SoftwareEngineering', '#CleanCode', '#DeveloperExperience', '#TechTips'],
    },
  };

  const defaultPost: GeneratedContentPayload = {
    hook: `📌 The Future of ${topic}: Key Engineering Insights Every Developer Should Know.`,
    body: `Technology is evolving rapidly, and staying ahead in ${topic} requires focusing on fundamentals, clean abstractions, and scalability.\n\nKey Insights:\n1. Focus on architectural clarity over trend-chasing.\n2. Optimize for developer experience and maintainability.\n3. Implement robust testing and automated CI/CD guardrails.\n\n${research.summary}`,
    cta: `What are your thoughts on where ${topic} is heading next? Drop a comment!`,
    hashtags: [`#${topic.replace(/\s+/g, '')}`, '#SoftwareDevelopment', '#Engineering', '#TechCommunity'],
  };

  return curatedTemplates[topic] || defaultPost;
}
