export interface ResearchResult {
  query: string;
  summary: string;
  sourceUrls: string[];
}

export async function performTopicResearch(topic: string): Promise<ResearchResult> {
  const query = `Latest technical advancements, developer updates, and best practices in ${topic}`;
  const apiKey = process.env.TAVILY_API_KEY || process.env.RESEARCH_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: 3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        const sourceUrls = results.map((r: any) => r.url).filter(Boolean);
        const combinedSummary = results.map((r: any) => r.content).join('\n\n');

        if (combinedSummary && sourceUrls.length > 0) {
          return {
            query,
            summary: combinedSummary.substring(0, 800),
            sourceUrls,
          };
        }
      }
    } catch (err) {
      console.warn('Tavily research API error, falling back to domain research context:', err);
    }
  }

  // Curated domain technical research context per topic
  const topicResearchMap: Record<string, { summary: string; sources: string[] }> = {
    AI: {
      summary:
        'Recent developments in AI focus on lightweight LLM inference optimization, multimodal reasoning models, tool-use agents, and enterprise AI safety benchmarks.',
      sources: [
        'https://ai.google.dev/news',
        'https://github.com/trending?spoken_language_code=en',
      ],
    },
    JavaScript: {
      summary:
        'Modern JavaScript ECMAScript updates highlight top-level await, explicit resource management (using statement), fast JavaScript runtimes like Bun and Node.js v22, and improved TypeScript 5.x performance.',
      sources: [
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        'https://tc39.es/',
      ],
    },
    React: {
      summary:
        'React 19 features Server Actions, React Compiler (auto-memoization), asset loading hooks (useOptimistic, useFormStatus), and async transition enhancements eliminating manual useMemo boilerplate.',
      sources: [
        'https://react.dev/blog',
        'https://github.com/facebook/react/releases',
      ],
    },
    'Web Development': {
      summary:
        'Web development trends emphasize Core Web Vitals (INP - Interaction to Next Paint), modern CSS subgrid & container queries, HTTP/3, and edge computing for minimal latency API delivery.',
      sources: [
        'https://web.dev/blog/',
        'https://w3.org/',
      ],
    },
    Coding: {
      summary:
        'Software engineering practices emphasize clean code architecture, type-safe API contracts, automated CI/CD guardrails, robust error boundaries, and developer productivity tools.',
      sources: [
        'https://github.blog/category/engineering/',
        'https://news.ycombinator.com/',
      ],
    },
  };

  const defaultResearch = {
    summary: `Current technical insight and engineering patterns related to ${topic}, emphasizing architectural best practices and developer experience.`,
    sources: [
      `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`,
      `https://github.com/topics/${encodeURIComponent(topic.toLowerCase())}`,
    ],
  };

  const matchedData = topicResearchMap[topic] || defaultResearch;

  return {
    query,
    summary: matchedData.summary,
    sourceUrls: matchedData.sources,
  };
}
