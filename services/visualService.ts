/**
 * Visual Generation Engine 3.0 — Content-to-Visual Intelligence Edition
 * Produces 1200x630 topic-aware, high-contrast, visually distinctive graphics using pure SVG.
 * Strictly avoids foreignObject for 100% reliable resvg/PNG conversion.
 * 
 * Features:
 *  - Content-Aware Topic Classification with weighted scoring and priority rules.
 *  - Semantic coherence: Badge, headline, visual archetype, and diagram components 100% aligned.
 *  - Bespoke component flows for CI/CD, RAG, AI Agents, React/Next.js, Backend, and System Design.
 *  - Concise, punchy headline formatting with zero awkward ellipses.
 *  - Strictly zero fabricated metrics (no arbitrary percentages or fake latencies).
 *  - Automated visual quality validation (AABB collision detection, canvas boundary guard, min 14px font).
 */

import { VisualStyle } from '@/types';
import { estimateTextWidth, validateVisualQuality } from './visualValidationService';

export type TechnicalArchetype =
  | 'devops_cicd'
  | 'rag_retrieval'
  | 'ai_agents'
  | 'react_nextjs'
  | 'backend_apis'
  | 'system_design'
  | 'typescript_code'
  | 'cybersecurity'
  | 'engineering_leadership'
  | 'ai_general';

export interface VisualNode {
  step: string;
  title: string;
  subtitle?: string;
  color: string;
  iconType?: 'user' | 'brain' | 'shield' | 'tool' | 'check' | 'log' | 'code' | 'db' | 'arrow' | 'cloud' | 'network' | 'sparkle';
}

export interface MetricCard {
  value: string;
  label: string;
  subtext: string;
  badge?: string;
  color: string;
}

export interface VisualConfig {
  badge: string;
  title: string;
  archetype: TechnicalArchetype;
  visualStyle: VisualStyle;
  visualTemplate: string;
  category: 'ai_safety' | 'workflow' | 'code' | 'debug' | 'pipeline' | 'isometric' | 'editorial' | 'data_vis';
  nodes?: VisualNode[];
  codeLines?: Array<{ code: string; comment?: string }>;
  takeaways?: string[];
  metrics?: MetricCard[];
  editorialQuote?: { quote: string; authorOrAxiom: string };
  bgGrad: [string, string];
  accentColor: string;
  secondaryColor: string;
}

export interface VisualEngineOptions {
  style?: VisualStyle;
  template?: string;
  recentHistory?: Array<{ visualStyle?: string; visualTemplate?: string }>;
  accentColor?: string;
}

export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats a clean, concise headline for visual banner presentation.
 * Strips emoji clutter, meta framing (e.g. "System design perspective: "), and
 * avoids awkward mid-sentence ellipses.
 */
export function formatCleanHeadline(rawHeadline: string): string {
  if (!rawHeadline) return 'Engineering Architecture & System Design';

  let clean = rawHeadline.trim();

  // 1. Remove meta prefixes that distract from the core technical topic
  const metaPrefixRegex = /^(system design perspective|engineering perspective|architectural perspective|production lessons|tech deep dive|deep dive|in-depth guide|quick tip|pro tip|case study)\s*[:|-]\s*/i;
  while (metaPrefixRegex.test(clean)) {
    clean = clean.replace(metaPrefixRegex, '').trim();
  }

  // 2. Strip emojis, symbols, and formatting artifacts
  try {
    const emojiRegex = new RegExp('[\\p{Extended_Pictographic}\\p{Emoji}#⚡🤖📊🏗️🚀🧭🛡️💡💰]+', 'gu');
    clean = clean.replace(emojiRegex, '').trim();
  } catch {
    clean = clean.replace(/[#⚡🤖📊🏗️🚀🧭🛡️💡💰]+/g, '').trim();
  }

  // 3. Remove trailing period or exclamation
  clean = clean.replace(/[.!]+$/, '').trim();

  // 4. If headline is still long (> 68 chars) and contains a colon, em-dash, or spaced hyphen, split at clause
  if (clean.length > 68 && (clean.includes(':') || clean.includes(' - ') || clean.includes(' — ') || clean.includes(' – '))) {
    const parts = clean.split(/(?:\s*:\s*|\s+[—–-]\s+)/);
    if (parts[0].length >= 24 && parts[0].length <= 80) {
      clean = parts[0].trim();
    } else if (parts[1] && parts[1].length >= 24 && parts[1].length <= 80) {
      clean = parts[1].trim();
    }
  }

  // 5. If still very long (> 92 chars), break cleanly at word boundary without ellipsis
  if (clean.length > 92) {
    const words = clean.split(/\s+/);
    let candidate = '';
    for (const word of words) {
      if ((candidate + ' ' + word).trim().length <= 88) {
        candidate = (candidate + ' ' + word).trim();
      } else {
        break;
      }
    }
    if (candidate.length >= 20) {
      clean = candidate;
    }
  }

  return clean;
}

/**
 * Splits text into wrapped lines bounded by pixel width rather than character count,
 * guaranteeing zero container overflow.
 */
export function wrapTextToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number = 2,
  isMonospace: boolean = false
): string[] {
  if (!text) return [''];
  const clean = text.replace(/^[^\w\s"']+/g, '').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = estimateTextWidth(candidate, fontSize, isMonospace);

    if (candidateWidth <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (lines.length === maxLines - 1) {
        // Last line: append words that fit cleanly without forcing awkward ellipsis
        let lastLine = word;
        for (let j = i + 1; j < words.length; j++) {
          const nextCandidate = `${lastLine} ${words[j]}`;
          if (estimateTextWidth(nextCandidate, fontSize, isMonospace) <= maxWidth) {
            lastLine = nextCandidate;
          } else {
            break;
          }
        }
        lines.push(lastLine);
        return lines;
      }
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [clean.substring(0, 30)];
}

/**
 * Backward-compatible character-based wrapper calling wrapTextToWidth
 */
export function wrapText(text: string, maxCharsPerLine: number = 46, maxLines: number = 2): string[] {
  return wrapTextToWidth(text, maxCharsPerLine * 22, 44, maxLines);
}

/**
 * Weighted Keyword Rule for Topic Classification
 */
interface KeywordRule {
  terms: string[];
  weight: number;
}

const ARCHETYPE_RULES: Record<TechnicalArchetype, KeywordRule[]> = {
  devops_cicd: [
    {
      terms: [
        'ci/cd', 'cicd', 'pipeline', 'pipelines', 'continuous integration', 'continuous delivery',
        'github actions', 'gitlab ci', 'docker', 'dockerfile', 'container', 'containers',
        'kubernetes', 'k8s', 'helm', 'argocd', 'jenkins', 'canary rollout', 'canary deployment',
        'blue-green', 'artifact registry', 'container registry', 'build pipeline', 'deploy pipeline',
        'release pipeline', 'gitops', 'infrastructure as code', 'iac', 'terraform',
      ],
      weight: 12,
    },
    { terms: ['devops', 'cluster', 'deployment', 'staging env', 'preview env', 'production rollout'], weight: 5 },
  ],

  rag_retrieval: [
    {
      terms: [
        'rag', 'retrieval-augmented', 'retrieval augmented', 'vector search', 'vector db',
        'vector database', 'embedding', 'embeddings', 'hnsw', 'pinecone', 'qdrant', 'milvus',
        'chromadb', 'weaviate', 'cross-encoder', 'rerank', 'reranker', 'dense retrieval',
        'semantic search', 'chunking', 'hybrid search', 'bm25',
      ],
      weight: 12,
    },
    { terms: ['retrieval', 'vector space', 'document chunking', 'semantic similarity', 'cosine similarity'], weight: 5 },
  ],

  ai_agents: [
    {
      terms: [
        'ai agent', 'ai agents', 'autonomous agent', 'autonomous agents', 'agentic', 'multi-agent',
        'react loop', 'tool calling', 'function calling', 'agent orchestrator', 'agent loop',
        'langchain', 'langgraph', 'crewai', 'autogen', 'model context protocol', 'mcp server',
        'tool execution', 'unconstrained tools', 'human-in-the-loop', 'safety guardrails',
        'guardrail', 'guardrails', 'prompt injection',
      ],
      weight: 12,
    },
    { terms: ['agent workflow', 'tool dispatch', 'reasoning loop', 'step bound', 'autonomous loop'], weight: 5 },
  ],

  react_nextjs: [
    {
      terms: [
        'react', 'next.js', 'nextjs', 'server component', 'server components', 'rsc',
        'server action', 'server actions', 'app router', 'useoptimistic', 'usememo',
        'usecallback', 'usestate', 'usereducer', 'client component', 'react compiler',
        'hydration', 'zustand', 'tanstack',
      ],
      weight: 12,
    },
    { terms: ['frontend architecture', 'ui state', 'client bundle', 'virtual dom', 'frontend'], weight: 5 },
  ],

  backend_apis: [
    {
      terms: [
        'idempotent', 'idempotency', 'api gateway', 'redis lock', 'distributed lock', 'redlock',
        'acid transaction', 'database transaction', 'postgres', 'postgresql', 'mysql',
        'write-ahead log', 'wal', 'two-phase commit', 'rate limiter', 'deduplication ttl',
        'graphql', 'grpc', 'connection pool',
      ],
      weight: 12,
    },
    { terms: ['backend', 'rest api', 'api request', 'database', 'transaction', 'caching layer'], weight: 4 },
  ],

  system_design: [
    {
      terms: [
        'microservice', 'microservices', 'kafka', 'rabbitmq', 'message broker', 'event streaming',
        'event-driven', 'pub/sub', 'load balancer', 'sharding', 'database sharding',
        'read replica', 'circuit breaker', 'service mesh', 'raft consensus', 'paxos',
        'eventual consistency', 'cap theorem', 'fault domain', 'failure domain',
      ],
      weight: 12,
    },
    { terms: ['system design', 'distributed systems', 'scalability', 'horizontal scaling', 'throughput'], weight: 5 },
  ],

  typescript_code: [
    {
      terms: [
        'typescript', 'type safety', 'type guard', 'discriminated union', 'type narrowing',
        'brand type', 'satisfies operator', 'generic type', 'generics', 'utility types',
        'type system', 'type-level', 'type-safe',
      ],
      weight: 12,
    },
    { terms: ['strict types', 'static typing', 'clean code', 'refactoring', 'code quality'], weight: 4 },
  ],

  cybersecurity: [
    {
      terms: [
        'zero-trust', 'zero trust', 'mtls', 'jwt', 'oauth', 'waf', 'penetration testing',
        'cryptographic', 'vulnerability', 'cve', 'sql injection', 'xss', 'csrf',
        'threat interception', 'identity attestation', 'security vault', 'audit vault',
      ],
      weight: 12,
    },
    { terms: ['cybersecurity', 'security', 'authentication', 'authorization', 'audit trail'], weight: 4 },
  ],

  engineering_leadership: [
    {
      terms: [
        'staff engineer', 'engineering leadership', 'principal engineer', 'architectural tradeoffs',
        'architectural tradeoff', 'mttr', 'mean-time-to-recovery', 'technical debt', 'tech debt',
        'engineering culture', 'engineering axioms', 'software craft', 'debugging', 'diagnostics',
        'root cause', 'post-mortem', 'incident analysis',
      ],
      weight: 12,
    },
    { terms: ['engineering excellence', 'simplicity in design', 'boring technology', 'senior engineer', 'debugging & architecture'], weight: 5 },
  ],

  ai_general: [
    {
      terms: [
        'llm', 'large language model', 'foundation model', 'gpt-4', 'claude', 'gemini',
        'prompt engineering', 'context window', 'token limit', 'fine-tuning', 'hallucination',
      ],
      weight: 8,
    },
    { terms: ['artificial intelligence', 'ai & llms', 'model evaluation', 'neural network'], weight: 3 },
  ],
};

/**
 * Classifies post content into the optimal TechnicalArchetype using weighted scoring.
 * Headline receives 5x weight, topic receives 3x weight, and post body receives 1x weight.
 * Highly specific technical terms strictly outscore umbrella terms (AI, system, architecture).
 */
export function classifyVisualTopic(
  topic: string,
  hookTitle?: string,
  postBody?: string
): TechnicalArchetype {
  const normTopic = (topic || '').toLowerCase();
  const normHook = (hookTitle || '').toLowerCase();
  const normBody = (postBody || '').toLowerCase();

  const scores: Record<TechnicalArchetype, number> = {
    devops_cicd: 0,
    rag_retrieval: 0,
    ai_agents: 0,
    react_nextjs: 0,
    backend_apis: 0,
    system_design: 0,
    typescript_code: 0,
    cybersecurity: 0,
    engineering_leadership: 0,
    ai_general: 0,
  };

  for (const [archetypeKey, ruleList] of Object.entries(ARCHETYPE_RULES)) {
    const archetype = archetypeKey as TechnicalArchetype;
    for (const rule of ruleList) {
      for (const term of rule.terms) {
        // Headline matches receive 5x priority
        if (normHook.includes(term)) {
          scores[archetype] += rule.weight * 5;
        }
        // Topic parameter matches receive 3x priority
        if (normTopic.includes(term)) {
          scores[archetype] += rule.weight * 3;
        }
        // Body matches receive 1x priority
        if (normBody.includes(term)) {
          scores[archetype] += rule.weight * 1;
        }
      }
    }
  }

  // Find archetype with the highest score
  let maxScore = -1;
  let winningArchetype: TechnicalArchetype = 'system_design';

  for (const [archetypeKey, score] of Object.entries(scores)) {
    const archetype = archetypeKey as TechnicalArchetype;
    if (score > maxScore) {
      maxScore = score;
      winningArchetype = archetype;
    }
  }

  // Fallback: If no specific scores were triggered, infer from general topic
  if (maxScore <= 0) {
    if (normTopic.includes('ai') || normTopic.includes('llm')) return 'ai_general';
    if (normTopic.includes('react') || normTopic.includes('next')) return 'react_nextjs';
    if (normTopic.includes('type')) return 'typescript_code';
    if (normTopic.includes('devops') || normTopic.includes('docker')) return 'devops_cicd';
    if (normTopic.includes('security')) return 'cybersecurity';
    if (normTopic.includes('lead') || normTopic.includes('career')) return 'engineering_leadership';
    if (normTopic.includes('backend') || normTopic.includes('api')) return 'backend_apis';
    return 'system_design';
  }

  return winningArchetype;
}

/**
 * Pure SVG vector icons with crisp lines and zero emojis
 */
export function renderSvgIcon(type: string, x: number, y: number, color: string): string {
  switch (type) {
    case 'shield':
      return `<path d="M ${x + 12} ${y + 2} L ${x + 22} ${y + 6} V ${y + 13} C ${x + 22} ${y + 19} ${x + 12} ${y + 23} ${x + 12} ${y + 23} C ${x + 12} ${y + 23} ${x + 2} ${y + 19} ${x + 2} ${y + 13} V ${y + 6} Z" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M ${x + 8} ${y + 12} L ${x + 11} ${y + 15} L ${x + 16} ${y + 9}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case 'user':
      return `<circle cx="${x + 12}" cy="${y + 7}" r="5" fill="none" stroke="${color}" stroke-width="2"/>
              <path d="M ${x + 4} ${y + 21} C ${x + 4} ${y + 16} ${x + 8} ${y + 14} ${x + 12} ${y + 14} C ${x + 16} ${y + 14} ${x + 20} ${y + 16} ${x + 20} ${y + 21}" fill="none" stroke="${color}" stroke-width="2"/>`;
    case 'brain':
      return `<circle cx="${x + 12}" cy="${y + 12}" r="8" fill="none" stroke="${color}" stroke-width="2"/>
              <circle cx="${x + 12}" cy="${y + 12}" r="3" fill="${color}"/>
              <line x1="${x + 12}" y1="${y + 2}" x2="${x + 12}" y2="${y + 4}" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 12}" y1="${y + 20}" x2="${x + 12}" y2="${y + 22}" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 2}" y1="${y + 12}" x2="${x + 4}" y2="${y + 12}" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 20}" y1="${y + 12}" x2="${x + 22}" y2="${y + 12}" stroke="${color}" stroke-width="2"/>`;
    case 'tool':
      return `<path d="M ${x + 17} ${y + 5} L ${x + 19} ${y + 7} L ${x + 8} ${y + 18} L ${x + 5} ${y + 18} L ${x + 5} ${y + 15} Z" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
              <path d="M ${x + 15} ${y + 3} C ${x + 18} ${y + 1} ${x + 21} ${y + 4} ${x + 20} ${y + 7}" fill="none" stroke="${color}" stroke-width="2"/>`;
    case 'check':
      return `<circle cx="${x + 12}" cy="${y + 12}" r="9" fill="none" stroke="${color}" stroke-width="2"/>
              <path d="M ${x + 7} ${y + 12} L ${x + 10} ${y + 15} L ${x + 17} ${y + 8}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case 'log':
      return `<rect x="${x + 4}" y="${y + 3}" width="16" height="18" rx="2" fill="none" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 8}" y1="${y + 8}" x2="${x + 16}" y2="${y + 8}" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 8}" y1="${y + 12}" x2="${x + 16}" y2="${y + 12}" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 8}" y1="${y + 16}" x2="${x + 13}" y2="${y + 16}" stroke="${color}" stroke-width="2"/>`;
    case 'db':
      return `<ellipse cx="${x + 12}" cy="${y + 6}" rx="9" ry="4" fill="none" stroke="${color}" stroke-width="2"/>
              <path d="M ${x + 3} ${y + 6} V ${y + 18} C ${x + 3} ${y + 21} ${x + 21} ${y + 21} ${x + 21} ${y + 18} V ${y + 6}" fill="none" stroke="${color}" stroke-width="2"/>
              <path d="M ${x + 3} ${y + 12} C ${x + 3} ${y + 15} ${x + 21} ${y + 15} ${x + 21} ${y + 12}" fill="none" stroke="${color}" stroke-width="2"/>`;
    case 'code':
      return `<path d="M ${x + 8} ${y + 6} L ${x + 3} ${y + 12} L ${x + 8} ${y + 18}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
              <path d="M ${x + 16} ${y + 6} L ${x + 21} ${y + 12} L ${x + 16} ${y + 18}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
              <line x1="${x + 14}" y1="${y + 5}" x2="${x + 10}" y2="${y + 19}" stroke="${color}" stroke-width="1.8"/>`;
    case 'cloud':
      return `<path d="M ${x + 6} ${y + 18} C ${x + 3} ${y + 18} ${x + 2} ${y + 15} ${x + 3} ${y + 13} C ${x + 2} ${y + 9} ${x + 6} ${y + 7} ${x + 9} ${y + 8} C ${x + 11} ${y + 4} ${x + 16} ${y + 4} ${x + 18} ${y + 7} C ${x + 21} ${y + 7} ${x + 23} ${y + 9} ${x + 22} ${y + 13} C ${x + 23} ${y + 15} ${x + 22} ${y + 18} ${x + 18} ${y + 18} Z" fill="none" stroke="${color}" stroke-width="2"/>`;
    case 'network':
      return `<circle cx="${x + 6}" cy="${y + 12}" r="3" fill="none" stroke="${color}" stroke-width="2"/>
              <circle cx="${x + 18}" cy="${y + 6}" r="3" fill="none" stroke="${color}" stroke-width="2"/>
              <circle cx="${x + 18}" cy="${y + 18}" r="3" fill="none" stroke="${color}" stroke-width="2"/>
              <line x1="${x + 9}" y1="${y + 12}" x2="${x + 15}" y2="${y + 7}" stroke="${color}" stroke-width="1.5"/>
              <line x1="${x + 9}" y1="${y + 12}" x2="${x + 15}" y2="${y + 17}" stroke="${color}" stroke-width="1.5"/>`;
    case 'sparkle':
    default:
      return `<path d="M ${x + 12} ${y + 3} L ${x + 14} ${y + 10} L ${x + 21} ${y + 12} L ${x + 14} ${y + 14} L ${x + 12} ${y + 21} L ${x + 10} ${y + 14} L ${x + 3} ${y + 12} L ${x + 10} ${y + 10} Z" fill="none" stroke="${color}" stroke-width="2"/>`;
  }
}

/**
 * Maps topic, hook, and context to the optimal visual config using weighted scoring.
 * Guarantees that Badge, Headline, Visual Archetype, and Diagram Nodes agree 100%.
 */
export function determineVisualConfig(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): VisualConfig {
  const normTopic = (topic || '').toLowerCase();
  const normHook = (hookTitle || '').toLowerCase();
  const archetype = classifyVisualTopic(topic, hookTitle, postBody);
  const cleanTitle = formatCleanHeadline(hookTitle || topic);
  const recentHistory = options?.recentHistory || [];
  const lastStyle = recentHistory[0]?.visualStyle;

  // 1. CI/CD & DevOps Pipeline Archetype
  // Requirement 2: Source Code -> Build -> Automated Tests -> Artifact Registry -> Deployment -> Monitoring
  if (archetype === 'devops_cicd') {
    return {
      badge: 'AUTOMATION & CI/CD RELEASE PIPELINES',
      title: cleanTitle,
      archetype: 'devops_cicd',
      visualStyle: options?.style || 'isometric_tech',
      visualTemplate: 'cicd_six_stage_pipeline',
      category: 'pipeline',
      bgGrad: ['#040D17', '#082329'],
      accentColor: '#34D399',
      secondaryColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'Source Code', subtitle: 'PR Gate & Lint', color: '#38BDF8', iconType: 'code' },
        { step: '02', title: 'Build', subtitle: 'Hermetic Image', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Automated Tests', subtitle: 'Unit & Integration', color: '#C084FC', iconType: 'check' },
        { step: '04', title: 'Artifact Registry', subtitle: 'Signed OCI Image', color: '#F43F5E', iconType: 'cloud' },
        { step: '05', title: 'Deployment', subtitle: 'Canary Rollout', color: '#F59E0B', iconType: 'network' },
        { step: '06', title: 'Monitoring', subtitle: 'Auto-Rollback Gate', color: '#34D399', iconType: 'log' },
      ],
      takeaways: [
        'Automated verification gates prevent regressions from reaching production',
        'Canary rollouts verify real traffic health before full deployment promotion',
        'Immutable signed container images guarantee deployment parity across environments',
      ],
    };
  }

  // 2. RAG & Vector Retrieval Archetype
  // Requirement 2: Document Ingestion -> Chunking -> Embeddings -> Vector Search -> Reranking -> Context Generation
  if (archetype === 'rag_retrieval') {
    return {
      badge: 'RAG & HIGH-DIMENSIONAL VECTOR ARCHITECTURE',
      title: cleanTitle,
      archetype: 'rag_retrieval',
      visualStyle: options?.style || (lastStyle === 'data_visualization' ? 'premium_3d' : 'data_visualization'),
      visualTemplate: 'rag_six_stage_pipeline',
      category: 'data_vis',
      bgGrad: ['#04091A', '#0C1B3A'],
      accentColor: '#38BDF8',
      secondaryColor: '#818CF8',
      nodes: [
        { step: '01', title: 'Document Ingestion', subtitle: 'Semantic Caching', color: '#38BDF8', iconType: 'log' },
        { step: '02', title: 'Chunking', subtitle: 'Semantic Splitting', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Embeddings', subtitle: 'Dense Vectors', color: '#C084FC', iconType: 'network' },
        { step: '04', title: 'Vector Search', subtitle: 'HNSW Vector Index', color: '#34D399', iconType: 'db' },
        { step: '05', title: 'Reranking', subtitle: 'Hybrid Reranker', color: '#F59E0B', iconType: 'sparkle' },
        { step: '06', title: 'Context Generation', subtitle: 'Grounded Packing', color: '#38BDF8', iconType: 'brain' },
      ],
      metrics: [
        { value: 'STAGE 01', label: 'Semantic Caching', subtext: 'Exact & Dense Embedding Cache', color: '#38BDF8' },
        { value: 'STAGE 02', label: 'HNSW Vector Index', subtext: 'Hierarchical Navigable Graph', color: '#818CF8' },
        { value: 'STAGE 03', label: 'Hybrid Reranker', subtext: 'Cross-Encoder Reciprocal Rank', color: '#34D399' },
      ],
      takeaways: [
        'Semantic Caching prevents redundant embeddings and expensive LLM calls',
        'HNSW Vector Index enables sub-millisecond approximate nearest neighbor retrieval',
        'Hybrid Reranker combines cross-encoder reranking with reciprocal rank fusion',
      ],
    };
  }

  // 3. AI Agents & Orchestration Archetype
  // Requirement 2: User Request -> Planner -> Tool Execution -> Guardrails -> Audit
  if (archetype === 'ai_agents') {
    return {
      badge: 'AI AGENT ARCHITECTURE & SAFETY CONTROLS',
      title: cleanTitle,
      archetype: 'ai_agents',
      visualStyle: options?.style || 'futuristic_ai',
      visualTemplate: 'ai_safety_governance',
      category: 'ai_safety',
      bgGrad: ['#040817', '#0A1329'],
      accentColor: '#38BDF8',
      secondaryColor: '#EF4444',
      nodes: [
        { step: '01', title: 'User Request', subtitle: 'Natural Language Input', color: '#38BDF8', iconType: 'user' },
        { step: '02', title: 'Planner', subtitle: 'ReAct Reasoning Loop', color: '#818CF8', iconType: 'brain' },
        { step: '03', title: 'Tool Execution', subtitle: 'Sandboxed Environment', color: '#C084FC', iconType: 'tool' },
        { step: '04', title: 'Guardrails', subtitle: 'Active Safety Filter', color: '#EF4444', iconType: 'shield' },
        { step: '05', title: 'Audit', subtitle: 'Immutable Trace Store', color: '#34D399', iconType: 'log' },
      ],
      takeaways: [
        'Deterministic bounds on tool executions and step loops prevent infinite recursions',
        'Human-in-the-loop triggers intercept destructive mutations before dispatch',
        'Immutable cryptographic audit logs guarantee observability and forensic auditability',
      ],
    };
  }

  // 4. React 19 & Next.js Archetype
  // Requirement 2: Components -> Server/Client Rendering -> Data Fetching -> API -> UI
  if (archetype === 'react_nextjs') {
    return {
      badge: 'REACT 19 & NEXT.JS APP ROUTER ARCHITECTURE',
      title: cleanTitle,
      archetype: 'react_nextjs',
      visualStyle: options?.style || (lastStyle === 'premium_3d' ? 'code_developer' : 'premium_3d'),
      visualTemplate: 'react_server_actions',
      category: 'workflow',
      bgGrad: ['#04091A', '#0B2147'],
      accentColor: '#38BDF8',
      secondaryColor: '#34D399',
      nodes: [
        { step: '01', title: 'Components', subtitle: 'RSC & Client Boundaries', color: '#38BDF8', iconType: 'code' },
        { step: '02', title: 'Server Component', subtitle: 'Server Rendering', color: '#818CF8', iconType: 'brain' },
        { step: '03', title: 'Data Fetching', subtitle: 'Deduplicated Fetch Cache', color: '#C084FC', iconType: 'db' },
        { step: '04', title: 'API', subtitle: 'Type-Safe Server Actions', color: '#38BDF8', iconType: 'tool' },
        { step: '05', title: 'UI', subtitle: 'Optimistic UI', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'React Server Components eliminate client bundle overhead for static subtrees',
        'Direct Server Actions eliminate REST endpoint boilerplate and type drift',
        'useOptimistic delivers immediate local UI updates before network confirmation',
      ],
    };
  }

  // 5. Backend, APIs & Databases Archetype
  // Requirement 2: Client -> API Gateway -> Authentication -> Business Logic -> Database -> Response
  if (archetype === 'backend_apis') {
    return {
      badge: 'BACKEND API & TRANSACTION ARCHITECTURE',
      title: cleanTitle,
      archetype: 'backend_apis',
      visualStyle: options?.style || (lastStyle === 'premium_3d' ? 'data_visualization' : 'premium_3d'),
      visualTemplate: 'backend_six_stage_pipeline',
      category: 'workflow',
      bgGrad: ['#05091B', '#111C3D'],
      accentColor: '#818CF8',
      secondaryColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'Client', subtitle: 'Idempotency Key Header', color: '#38BDF8', iconType: 'user' },
        { step: '02', title: 'API Gateway', subtitle: 'Rate Limit & Routing', color: '#818CF8', iconType: 'network' },
        { step: '03', title: 'Authentication', subtitle: 'Redis Cache Lock', color: '#F43F5E', iconType: 'shield' },
        { step: '04', title: 'Business Logic', subtitle: 'Atomic Processing Unit', color: '#C084FC', iconType: 'tool' },
        { step: '05', title: 'Database', subtitle: 'PostgreSQL ACID WAL', color: '#34D399', iconType: 'db' },
        { step: '06', title: 'Response', subtitle: '24h Deduplication Cache', color: '#38BDF8', iconType: 'check' },
      ],
      metrics: [
        { value: 'MUTEX', label: 'Distributed Lock', subtext: 'Redis Redlock Lease Mutex', color: '#38BDF8' },
        { value: 'IDEMPOTENT', label: 'Request Deduplication', subtext: '24h Idempotency Cache TTL', color: '#818CF8' },
        { value: 'ISOLATION', label: 'Serializable Isolation', subtext: 'PostgreSQL WAL Replicas', color: '#34D399' },
      ],
      takeaways: [
        'Client-provided idempotency keys prevent duplicate billing on retries',
        'Distributed lock prevents race conditions on parallel requests',
        'Cached terminal response returned on duplicate network attempts',
      ],
    };
  }

  // 6. System Design & Microservices Archetype
  if (archetype === 'system_design') {
    return {
      badge: 'SYSTEM DESIGN & DISTRIBUTED MICROSERVICES',
      title: cleanTitle,
      archetype: 'system_design',
      visualStyle: options?.style || (lastStyle === 'isometric_tech' ? 'premium_3d' : 'isometric_tech'),
      visualTemplate: 'isometric_distributed_stack',
      category: 'isometric',
      bgGrad: ['#050817', '#0D1A38'],
      accentColor: '#38BDF8',
      secondaryColor: '#818CF8',
      nodes: [
        { step: '01', title: 'Edge Ingress', subtitle: 'Anycast CDN & WAF', color: '#38BDF8', iconType: 'network' },
        { step: '02', title: 'Microservice Mesh', subtitle: 'Stateless Service Fleet', color: '#818CF8', iconType: 'cloud' },
        { step: '03', title: 'Event Broker', subtitle: 'Partitioned Kafka Stream', color: '#C084FC', iconType: 'tool' },
        { step: '04', title: 'Distributed DB', subtitle: 'Multi-Region Sharding', color: '#34D399', iconType: 'db' },
      ],
      takeaways: [
        'Asynchronous decoupled events prevent cascading network failures',
        'Partitioned consumer groups guarantee in-order event processing',
        'Read replicas offload analytical workloads from primary transactions',
      ],
    };
  }

  // 7. TypeScript & Code Archetype
  if (archetype === 'typescript_code') {
    return {
      badge: 'TYPESCRIPT & TYPE SYSTEM ENGINEERING',
      title: cleanTitle,
      archetype: 'typescript_code',
      visualStyle: options?.style || 'code_developer',
      visualTemplate: 'typescript_editor',
      category: 'code',
      bgGrad: ['#050814', '#101633'],
      accentColor: '#818CF8',
      secondaryColor: '#38BDF8',
      codeLines: [
        { code: 'type Result<T, E = Error> =', comment: '// Discriminated Result Union' },
        { code: '  | { success: true; data: T }', comment: '// Type-safe payload' },
        { code: '  | { success: false; error: E };', comment: '// Strict error type' },
        { code: '', comment: '' },
        { code: 'function unwrap<T>(res: Result<T>): T {', comment: '' },
        { code: '  if (!res.success) throw res.error;', comment: '// Control flow narrowing' },
        { code: '  return res.data;', comment: '// Inferred T return' },
        { code: '}', comment: '' },
      ],
      takeaways: [
        'Discriminated unions eliminate unsafe runtime casts',
        'satisfies operator enforces structure with exact literals',
        'Brand types prevent primitive identifier collisions',
      ],
    };
  }

  // 8. Cybersecurity Archetype
  if (archetype === 'cybersecurity') {
    return {
      badge: 'CYBERSECURITY & ZERO-TRUST DEFENSE',
      title: cleanTitle,
      archetype: 'cybersecurity',
      visualStyle: options?.style || 'premium_3d',
      visualTemplate: 'security_shield_defense',
      category: 'workflow',
      bgGrad: ['#0C0617', '#200D2B'],
      accentColor: '#F43F5E',
      secondaryColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'Identity Attest', subtitle: 'mTLS & Ephemeral JWT', color: '#38BDF8', iconType: 'user' },
        { step: '02', title: 'Policy Engine', subtitle: 'Continuous Authorization', color: '#818CF8', iconType: 'shield' },
        { step: '03', title: 'Threat Filter', subtitle: 'WAF & Anomaly Detection', color: '#F43F5E', iconType: 'sparkle' },
        { step: '04', title: 'Audit Vault', subtitle: 'Cryptographic Immutable Log', color: '#34D399', iconType: 'log' },
      ],
      takeaways: [
        'Never trust, always verify every single RPC call across boundaries',
        'Short-lived signed tokens eliminate long-term credential leakage risks',
        'Immutable audit trails ensure non-repudiation and forensic visibility',
      ],
    };
  }

  // 9. Engineering Leadership Archetype
  if (archetype === 'engineering_leadership') {
    const isDebugging = normTopic.includes('debug') || normHook.includes('root cause') || normHook.includes('debug') || normHook.includes('diagnostic');
    return {
      badge: isDebugging ? 'SYSTEM DIAGNOSTICS & ROOT CAUSE ANALYSIS' : 'ENGINEERING EXCELLENCE & ARCHITECTURAL AXIOMS',
      title: cleanTitle,
      archetype: 'engineering_leadership',
      visualStyle: options?.style || 'modern_editorial',
      visualTemplate: isDebugging ? 'diagnostics_flow' : 'staff_engineering_axioms',
      category: isDebugging ? 'debug' : 'editorial',
      bgGrad: isDebugging ? ['#080C17', '#1A152E'] : ['#070A12', '#141824'],
      accentColor: isDebugging ? '#C084FC' : '#F59E0B',
      secondaryColor: '#38BDF8',
      editorialQuote: {
        quote: isDebugging
          ? 'Hypothesis verification and regression tests prevent silent defect recurrence.'
          : 'Simplicity in system design creates operational resilience at scale.',
        authorOrAxiom: isDebugging ? 'PRODUCTION ROOT CAUSE ANALYSIS' : 'PRINCIPLE OF RESILIENT SYSTEMS',
      },
      takeaways: isDebugging ? [
        'Reproduce the bug deterministically before attempting any code fix',
        'Formulate testable hypotheses and change one variable at a time',
        'Verify the root cause with automated regression tests in CI/CD',
      ] : [
        'Optimize for mean-time-to-recovery (MTTR) rather than mean-time-between-failures',
        'Clear interface boundaries matter infinitely more than internal implementation details',
        'Boring, battle-tested technology compounds reliability over time',
      ],
    };
  }

  // 10. Default General AI Archetype
  return {
    badge: 'ARTIFICIAL INTELLIGENCE & LLM SYSTEMS',
    title: cleanTitle,
    archetype: 'ai_general',
    visualStyle: options?.style || (lastStyle === 'futuristic_ai' ? 'premium_3d' : 'futuristic_ai'),
    visualTemplate: 'neural_agent_cluster',
    category: 'workflow',
    bgGrad: ['#020617', '#09132E'],
    accentColor: '#38BDF8',
    secondaryColor: '#A855F7',
    nodes: [
      { step: '01', title: 'Context Compiler', subtitle: 'Dynamic Prompt Packing', color: '#38BDF8', iconType: 'brain' },
      { step: '02', title: 'Model Routing', subtitle: 'Tiered Task Allocation', color: '#818CF8', iconType: 'network' },
      { step: '03', title: 'Tool Execution', subtitle: 'Sandboxed Isolation', color: '#C084FC', iconType: 'tool' },
      { step: '04', title: 'Verification Gate', subtitle: 'Zero Hallucination Guard', color: '#34D399', iconType: 'check' },
    ],
    takeaways: [
      'Deterministic bounds beat prompt tweaking for production reliability',
      'Tiered model routing saves compute on routine agent steps',
      'Automated golden evaluation datasets catch silent model drift',
    ],
  };
}

/**
 * Universal Flow Card Renderer supporting 4, 5, or 6 connected pipeline stages.
 * Automatically computes card widths and connector positions with zero horizontal collisions.
 */
function renderUniversalPipeline(config: VisualConfig): string {
  const nodes = config.nodes || [];
  const nodeCount = Math.max(1, nodes.length);
  const totalAvailableWidth = 1060;
  const startX = 70;
  const nodeY = 195;
  const nodeHeight = 150;

  // Determine gap and width dynamically
  const gap = nodeCount >= 6 ? 24 : nodeCount === 5 ? 28 : 26;
  const cardWidth = Math.floor((totalAvailableWidth - (nodeCount - 1) * gap) / nodeCount);

  const cardsSvg = nodes.map((node, i) => {
    const x = startX + i * (cardWidth + gap);
    const arrowSvg = i < nodes.length - 1 ? `
      <!-- Connector Arrow ${i + 1} -> ${i + 2} -->
      <line x1="${x + cardWidth + 2}" y1="${nodeY + nodeHeight / 2}" x2="${x + cardWidth + gap - 4}" y2="${nodeY + nodeHeight / 2}" stroke="${config.accentColor}" stroke-width="2" stroke-dasharray="3 3"/>
      <polygon points="${x + cardWidth + gap - 5},${nodeY + nodeHeight / 2 - 4} ${x + cardWidth + gap + 2},${nodeY + nodeHeight / 2} ${x + cardWidth + gap - 5},${nodeY + nodeHeight / 2 + 4}" fill="${config.accentColor}"/>
    ` : '';

    const titleLines = wrapTextToWidth(node.title, cardWidth - 24, 15, 2);
    const titleSvg = titleLines.map((tl, tIdx) => `
      <text x="${x + 14}" y="${nodeY + 74 + tIdx * 20}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">${escapeXml(tl)}</text>
    `).join('\n');

    const subY = nodeY + 74 + (titleLines.length) * 20 + 6;
    const subLines = wrapTextToWidth(node.subtitle || '', cardWidth - 24, 14, 2);
    const subSvg = subLines.map((sl, sIdx) => `
      <text x="${x + 14}" y="${subY + sIdx * 18}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">${escapeXml(sl)}</text>
    `).join('\n');

    return `
      <!-- Glass Stage Card ${i + 1} -->
      <g>
        <rect x="${x + 3}" y="${nodeY + 5}" width="${cardWidth}" height="${nodeHeight}" rx="12" fill="#000000" opacity="0.45"/>
        <rect x="${x}" y="${nodeY}" width="${cardWidth}" height="${nodeHeight}" rx="12" fill="#0B1329" stroke="#1E2B4D" stroke-width="1.8"/>
        <rect x="${x}" y="${nodeY}" width="${cardWidth}" height="4" rx="2" fill="${node.color}"/>
        
        <!-- Step Pill -->
        <rect x="${x + 12}" y="${nodeY + 14}" width="68" height="24" rx="12" fill="#030712" stroke="${node.color}" stroke-width="1.2"/>
        <text x="${x + 46}" y="${nodeY + 30}" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="${node.color}" text-anchor="middle" letter-spacing="0.5">STEP ${node.step}</text>
        
        <!-- Icon -->
        ${renderSvgIcon(node.iconType || 'tool', x + cardWidth - 36, nodeY + 14, node.color)}
        
        <!-- Title & Subtitle -->
        ${titleSvg}
        ${subSvg}
      </g>
      ${arrowSvg}
    `;
  }).join('\n');

  const takeaways = config.takeaways || [
    'Automated verification gates prevent regressions from reaching production',
    'Canary rollouts verify real traffic health before full deployment promotion',
    'Immutable signed container images guarantee deployment parity across environments',
  ];

  const takeawaySvg = takeaways.slice(0, 3).map((t, idx) => `
    <g>
      <circle cx="102" cy="${435 + idx * 36}" r="4.5" fill="${config.accentColor}"/>
      <text x="120" y="${440 + idx * 36}" font-family="Inter, sans-serif" font-size="15" font-weight="600" fill="#E2E8F0">${escapeXml(t)}</text>
    </g>
  `).join('\n');

  return `
    ${cardsSvg}

    <!-- Architectural Takeaway Container -->
    <rect x="74" y="375" width="1056" height="165" rx="14" fill="#000000" opacity="0.4"/>
    <rect x="70" y="370" width="1060" height="170" rx="14" fill="#080F24" stroke="#1E2B4D" stroke-width="1.8"/>
    <path d="M 84 371 L 1116 371" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1" stroke-linecap="round"/>
    
    <text x="95" y="402" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">PRODUCTION ARCHITECTURAL PRINCIPLES</text>
    ${takeawaySvg}
  `;
}

/**
 * STYLE B: MODERN EDITORIAL
 * Minimalist high-contrast typography, large headlines, architectural axioms,
 * and clean asymmetric hierarchy with safely wrapped typography.
 */
function renderModernEditorial(config: VisualConfig): string {
  const quote = config.editorialQuote?.quote || 'Simplicity in system design creates operational resilience at scale.';
  const axiom = config.editorialQuote?.authorOrAxiom || 'CORE ARCHITECTURAL PRINCIPLE';
  const takeaways = config.takeaways || [
    'Optimize for mean-time-to-recovery rather than MTBF',
    'Interface boundaries matter more than implementation details',
    'Boring, battle-tested technology compounds reliability over time',
  ];

  const quoteLines = wrapTextToWidth(quote, 440, 24, 2);
  const quoteSvg = quoteLines.map((line, i) => `
    <text x="96" y="${280 + i * 36}" font-family="Inter, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${i === 0 ? '“' : ''}${escapeXml(line)}${i === quoteLines.length - 1 ? '”' : ''}</text>
  `).join('\n');

  const takeawayRowsSvg = takeaways.slice(0, 3).map((t, idx) => {
    const y = 195 + idx * 115;
    const tLines = wrapTextToWidth(t, 420, 14, 2);
    const tTextSvg = tLines.map((line, li) => `
      <text x="700" y="${y + 58 + li * 22}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">${escapeXml(line)}</text>
    `).join('\n');

    return `
      <!-- Editorial Principle ${idx + 1} -->
      <g>
        <rect x="610" y="${y}" width="520" height="98" rx="12" fill="#0D1322" stroke="#1F293D" stroke-width="1.5"/>
        <text x="636" y="${y + 44}" font-family="Inter, sans-serif" font-size="26" font-weight="900" fill="${config.accentColor}">0${idx + 1}.</text>
        <text x="700" y="${y + 34}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Principle 0${idx + 1}</text>
        ${tTextSvg}
      </g>
    `;
  }).join('\n');

  return `
    <!-- Left Hero Column: Editorial Statement -->
    <g>
      <rect x="70" y="195" width="510" height="340" rx="14" fill="#0A0F1D" stroke="#1E2738" stroke-width="1.8"/>
      <rect x="70" y="195" width="6" height="340" rx="3" fill="${config.accentColor}"/>
      
      <!-- Axiom Category -->
      <text x="96" y="238" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">${escapeXml(axiom)}</text>
      
      <!-- Big Pull Quote -->
      ${quoteSvg}
      
      <!-- Editorial Divider -->
      <line x1="96" y1="375" x2="540" y2="375" stroke="#1F293D" stroke-width="1"/>
      
      <!-- Author / Metadata Footnote -->
      <circle cx="104" cy="415" r="4.5" fill="${config.accentColor}"/>
      <text x="120" y="420" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#E2E8F0">Verified Production Strategy</text>
      <text x="120" y="450" font-family="Inter, sans-serif" font-size="14" fill="#64748B">Engineered for long-term operational resilience and zero maintenance.</text>
    </g>

    <!-- Right Column: 3 Structured Takeaways -->
    ${takeawayRowsSvg}
  `;
}

/**
 * STYLE C: ISOMETRIC TECHNICAL ILLUSTRATION
 * 3D isometric architecture diagrams with multi-tiered servers, databases, and connected data flows.
 */
function renderIsometricTech(_config: VisualConfig): string {
  return `
    <!-- Isometric Perspective Grid Background -->
    <g opacity="0.25">
      <line x1="70" y1="420" x2="1130" y2="420" stroke="#1E2D4A" stroke-width="1"/>
      <line x1="200" y1="200" x2="400" y2="450" stroke="#1E2D4A" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="600" y1="200" x2="800" y2="450" stroke="#1E2D4A" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="1000" y1="200" x2="1130" y2="380" stroke="#1E2D4A" stroke-width="1" stroke-dasharray="4 4"/>
    </g>

    <!-- TIER 1: 3D ISOMETRIC EDGE INGRESS -->
    <g>
      <polygon points="120,380 260,300 400,380 260,460" fill="#000000" opacity="0.45"/>
      <polygon points="120,330 260,410 260,460 120,380" fill="#0369A1" stroke="#38BDF8" stroke-width="1.2"/>
      <polygon points="260,410 400,330 400,380 260,460" fill="#0284C7" stroke="#38BDF8" stroke-width="1.2"/>
      <polygon points="260,250 400,330 260,410 120,330" fill="#0EA5E9" stroke="#7DD3FC" stroke-width="1.8"/>
      
      <circle cx="260" cy="330" r="16" fill="#030712" stroke="#38BDF8" stroke-width="2"/>
      ${renderSvgIcon('network', 248, 318, '#38BDF8')}
      <text x="260" y="215" font-family="Inter, sans-serif" font-size="16" font-weight="800" fill="#F8FAFC" text-anchor="middle">Edge Gateway</text>
      <text x="260" y="240" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#38BDF8" text-anchor="middle">Anycast CDN / WAF</text>
    </g>

    <!-- Isometric Data Beam 1 -> 2 -->
    <path d="M 400 330 L 520 280" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6 3"/>
    <polygon points="516,276 528,277 521,286" fill="#38BDF8"/>
    <rect x="420" y="274" width="85" height="26" rx="13" fill="#030712" stroke="#38BDF8" stroke-width="1.2"/>
    <text x="462" y="292" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" text-anchor="middle">Edge RPC</text>

    <!-- TIER 2: 3D ISOMETRIC MICROSERVICE CLUSTER -->
    <g>
      <polygon points="460,370 600,290 740,370 600,450" fill="#000000" opacity="0.45"/>
      <polygon points="460,320 600,400 600,450 460,370" fill="#4338CA" stroke="#818CF8" stroke-width="1.2"/>
      <polygon points="600,400 740,320 740,370 600,450" fill="#4F46E5" stroke="#818CF8" stroke-width="1.2"/>
      <polygon points="600,240 740,320 600,400 460,320" fill="#6366F1" stroke="#A5B4FC" stroke-width="1.8"/>
      
      <circle cx="600" cy="320" r="16" fill="#030712" stroke="#818CF8" stroke-width="2"/>
      ${renderSvgIcon('cloud', 588, 308, '#818CF8')}
      <text x="600" y="215" font-family="Inter, sans-serif" font-size="16" font-weight="800" fill="#F8FAFC" text-anchor="middle">Microservice Mesh</text>
      <text x="600" y="240" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#818CF8" text-anchor="middle">Autoscaling Fleet</text>
    </g>

    <!-- Isometric Data Beam 2 -> 3 -->
    <path d="M 740 320 L 880 340" stroke="#34D399" stroke-width="3" stroke-dasharray="6 3"/>
    <polygon points="872,336 882,340 872,344" fill="#34D399"/>
    <rect x="765" y="274" width="90" height="26" rx="13" fill="#030712" stroke="#34D399" stroke-width="1.2"/>
    <text x="810" y="292" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#34D399" text-anchor="middle">ACID Sync</text>

    <!-- TIER 3: 3D ISOMETRIC SHARDED DATABASE -->
    <g>
      <ellipse cx="980" cy="430" rx="100" ry="40" fill="#000000" opacity="0.45"/>
      <path d="M 880 340 V 410 C 880 435 1080 435 1080 410 V 340 Z" fill="#064E3B" stroke="#34D399" stroke-width="1.5"/>
      <path d="M 880 365 C 880 390 1080 390 1080 365" fill="none" stroke="#34D399" stroke-width="1.5" stroke-dasharray="4 2"/>
      <ellipse cx="980" cy="340" rx="100" ry="40" fill="#059669" stroke="#6EE7B7" stroke-width="2"/>
      
      <circle cx="980" cy="340" r="16" fill="#030712" stroke="#34D399" stroke-width="2"/>
      ${renderSvgIcon('db', 968, 328, '#34D399')}
      <text x="980" y="255" font-family="Inter, sans-serif" font-size="16" font-weight="800" fill="#F8FAFC" text-anchor="middle">Distributed Database</text>
      <text x="980" y="280" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#34D399" text-anchor="middle">Multi-Region Replicas</text>
    </g>

    <!-- Bottom Architectural Metric Cards -->
    <g>
      <rect x="70" y="465" width="330" height="78" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="92" y="494" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#38BDF8" letter-spacing="1">ROUTING ARCHITECTURE</text>
      <text x="92" y="522" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Global Anycast Edge Ingress</text>

      <rect x="435" y="465" width="330" height="78" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="457" y="494" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#818CF8" letter-spacing="1">ISOLATION</text>
      <text x="457" y="522" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Stateless Container Fleet</text>

      <rect x="800" y="465" width="330" height="78" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="822" y="494" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#34D399" letter-spacing="1">PERSISTENCE</text>
      <text x="822" y="522" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Raft Consensus Replicas</text>
    </g>
  `;
}

/**
 * STYLE D: FUTURISTIC AI VISUAL
 * Neural network clusters, central intelligent agent orchestrator core,
 * synapsing paths, and holographic HUD gauges.
 */
function renderFuturisticAI(_config: VisualConfig): string {
  return `
    <!-- Neural Network Synapse Lines -->
    <g>
      <line x1="600" y1="305" x2="260" y2="240" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="5 3"/>
      <line x1="600" y1="305" x2="940" y2="240" stroke="#818CF8" stroke-width="2.5" stroke-dasharray="5 3"/>
      <line x1="600" y1="305" x2="260" y2="380" stroke="#EF4444" stroke-width="2.5" stroke-dasharray="5 3"/>
      <line x1="600" y1="305" x2="940" y2="380" stroke="#34D399" stroke-width="2.5" stroke-dasharray="5 3"/>
      <line x1="260" y1="240" x2="260" y2="380" stroke="#1E293B" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="940" y1="240" x2="940" y2="380" stroke="#1E293B" stroke-width="1.5" stroke-dasharray="3 3"/>
    </g>

    <!-- CENTER NEURAL ORCHESTRATION CORE -->
    <g>
      <circle cx="600" cy="305" r="95" fill="none" stroke="#38BDF8" stroke-width="1" stroke-dasharray="4 8" opacity="0.4"/>
      <circle cx="600" cy="305" r="75" fill="none" stroke="#818CF8" stroke-width="2" stroke-dasharray="30 15" opacity="0.6"/>
      <circle cx="600" cy="305" r="55" fill="#070C1E" stroke="#38BDF8" stroke-width="2.5"/>
      <circle cx="600" cy="305" r="30" fill="#0C1B3A" stroke="#818CF8" stroke-width="1.5"/>
      ${renderSvgIcon('brain', 588, 293, '#38BDF8')}
      
      <text x="600" y="415" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#F8FAFC" text-anchor="middle" letter-spacing="1">AI ORCHESTRATOR</text>
      <text x="600" y="438" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#38BDF8" text-anchor="middle">ReAct Autonomous Loop</text>
    </g>

    <!-- ORBITING NODE 1: PLANNER -->
    <g>
      <rect x="80" y="195" width="240" height="92" rx="12" fill="#080E24" stroke="#38BDF8" stroke-width="1.8"/>
      <rect x="80" y="195" width="240" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('user', 96, 212, '#38BDF8')}
      <text x="130" y="222" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#38BDF8" letter-spacing="1">REASONING</text>
      <text x="130" y="246" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Goal Planner</text>
      <text x="96" y="272" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Task decomposition &amp; context</text>
    </g>

    <!-- ORBITING NODE 2: TOOL SANDBOX -->
    <g>
      <rect x="880" y="195" width="240" height="92" rx="12" fill="#080E24" stroke="#818CF8" stroke-width="1.8"/>
      <rect x="880" y="195" width="240" height="4" rx="2" fill="#818CF8"/>
      ${renderSvgIcon('tool', 896, 212, '#818CF8')}
      <text x="930" y="222" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#818CF8" letter-spacing="1">EXECUTION</text>
      <text x="930" y="246" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Tool Dispatcher</text>
      <text x="896" y="272" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Sandboxed API &amp; DB calls</text>
    </g>

    <!-- ORBITING NODE 3: ACTIVE DEFENSE -->
    <g>
      <rect x="80" y="335" width="240" height="92" rx="12" fill="#120A1E" stroke="#EF4444" stroke-width="1.8"/>
      <rect x="80" y="335" width="240" height="4" rx="2" fill="#EF4444"/>
      ${renderSvgIcon('shield', 96, 352, '#EF4444')}
      <text x="130" y="362" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#EF4444" letter-spacing="1">ACTIVE DEFENSE</text>
      <text x="130" y="386" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Safety Guardrail</text>
      <text x="96" y="412" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Step bounds &amp; command filter</text>
    </g>

    <!-- ORBITING NODE 4: AUDIT STORE -->
    <g>
      <rect x="880" y="335" width="240" height="92" rx="12" fill="#07151C" stroke="#34D399" stroke-width="1.8"/>
      <rect x="880" y="335" width="240" height="4" rx="2" fill="#34D399"/>
      ${renderSvgIcon('log', 896, 352, '#34D399')}
      <text x="930" y="362" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#34D399" letter-spacing="1">OBSERVABILITY</text>
      <text x="930" y="386" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Audit Memory</text>
      <text x="896" y="412" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Immutable telemetry log</text>
    </g>

    <!-- Bottom Telemetry HUD Bar -->
    <g>
      <rect x="70" y="475" width="1060" height="58" rx="12" fill="#040816" stroke="#1E2A4A" stroke-width="1.5"/>
      <circle cx="95" cy="504" r="5" fill="#38BDF8"/>
      <text x="112" y="509" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">State: Autonomous Agent Loop Active</text>
      
      <circle cx="465" cy="504" r="5" fill="#34D399"/>
      <text x="482" y="509" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Evaluation: Deterministic Schema Bounds</text>
      
      <circle cx="830" cy="504" r="5" fill="#818CF8"/>
      <text x="847" y="509" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Safety Gate: Human-in-the-Loop Active</text>
    </g>
  `;
}

/**
 * STYLE E: CODE & DEVELOPER VISUAL
 * Realistic coding workstation, floating IDE editor window with syntax highlighting,
 * and clean technical principles.
 */
function renderCodeDeveloper(config: VisualConfig): string {
  const lines = config.codeLines || [
    { code: 'type Result<T, E = Error> =', comment: '// Discriminated Result Union' },
    { code: '  | { success: true; data: T }', comment: '// Type-safe payload' },
    { code: '  | { success: false; error: E };', comment: '// Strict error type' },
    { code: '', comment: '' },
    { code: 'function unwrap<T>(res: Result<T>): T {', comment: '' },
    { code: '  if (!res.success) throw res.error;', comment: '// Control flow narrowing' },
    { code: '  return res.data;', comment: '// Inferred T return' },
    { code: '}', comment: '' },
  ];

  const startX = 70;
  const startY = 195;
  const boxWidth = 700;
  const boxHeight = 345;

  const codeSvg = lines.map((line, i) => {
    const y = startY + 74 + i * 32;
    const codeTextSvg = line.code
      ? `<text x="${startX + 60}" y="${y}" font-family="'Roboto Mono', monospace" font-size="15" font-weight="600" fill="#38BDF8">${escapeXml(line.code)}</text>`
      : '';
    const commentSvg = line.comment
      ? `<text x="${startX + 410}" y="${y}" font-family="'Roboto Mono', monospace" font-size="14" fill="#94A3B8">${escapeXml(line.comment)}</text>`
      : '';
    return `
      <text x="${startX + 24}" y="${y}" font-family="'Roboto Mono', monospace" font-size="14" font-weight="600" fill="#475569">${String(i + 1).padStart(2, '0')}</text>
      ${codeTextSvg}
      ${commentSvg}
    `;
  }).join('\n');

  const takeaways = config.takeaways || [
    'Discriminated unions eliminate unsafe runtime casts',
    'satisfies operator enforces structure with exact literals',
    'Brand types prevent primitive identifier collisions',
  ];

  const sidebarSvg = takeaways.slice(0, 3).map((t, idx) => {
    const y = startY + 45 + idx * 95;
    const tLines = wrapTextToWidth(t, 300, 14, 2);
    const tTextSvg = tLines.map((line, li) => `
      <text x="806" y="${y + 50 + li * 20}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">${escapeXml(line)}</text>
    `).join('\n');

    return `
      <g>
        <rect x="786" y="${y}" width="344" height="85" rx="10" fill="#0C1326" stroke="#1E2A48" stroke-width="1.5"/>
        <circle cx="806" cy="${y + 24}" r="4" fill="${config.accentColor}"/>
        <text x="822" y="${y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#F8FAFC">Principle 0${idx + 1}</text>
        ${tTextSvg}
      </g>
    `;
  }).join('\n');

  return `
    <!-- Drop Shadow for IDE Window -->
    <rect x="${startX + 4}" y="${startY + 6}" width="${boxWidth}" height="${boxHeight}" rx="14" fill="#000000" opacity="0.5"/>
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="${boxHeight}" rx="14" fill="#050814" stroke="#1E293B" stroke-width="2"/>
    
    <!-- Code Window Title Bar -->
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="42" rx="14" fill="#0F172A"/>
    <circle cx="${startX + 22}" cy="${startY + 21}" r="5.5" fill="#EF4444"/>
    <circle cx="${startX + 40}" cy="${startY + 21}" r="5.5" fill="#F59E0B"/>
    <circle cx="${startX + 58}" cy="${startY + 21}" r="5.5" fill="#10B981"/>
    
    <!-- File Tab -->
    <rect x="${startX + 82}" y="${startY + 7}" width="185" height="28" rx="6" fill="#050814" stroke="#1E293B" stroke-width="1"/>
    <text x="${startX + 98}" y="${startY + 25}" font-family="'Roboto Mono', monospace" font-size="14" font-weight="600" fill="#38BDF8">typescript-pattern.ts</text>
    
    <!-- Floating Benchmark Pill inside Editor -->
    <rect x="${startX + boxWidth - 250}" y="${startY + 8}" width="235" height="26" rx="13" fill="#030712" stroke="#34D399" stroke-width="1.2"/>
    <text x="${startX + boxWidth - 132}" y="${startY + 25}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#34D399" text-anchor="middle">Strict Type Safety • Zero Casts</text>

    <!-- Code Content Lines -->
    ${codeSvg}

    <!-- Right Column: Key Technical Advantages -->
    <text x="786" y="${startY + 26}" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">KEY TECHNICAL ADVANTAGES</text>
    ${sidebarSvg}
  `;
}

/**
 * AI AGENT SAFETY SPECIALIZED ARCHITECTURE DIAGRAM
 * Required for Test 10: 5-stage connected flow (User Request -> Planner -> Tool Execution -> Guardrails -> Audit).
 */
function renderAISafetyDiagram(_config: VisualConfig): string {
  const userBox = { x: 70, y: 195, w: 225, h: 95 };
  const agentBox = { x: 360, y: 195, w: 235, h: 95 };
  const toolBox = { x: 675, y: 195, w: 225, h: 95 };
  const auditBox = { x: 965, y: 195, w: 165, h: 95 };

  const guardBox = { x: 360, y: 350, w: 260, h: 180 };
  const humanBox = { x: 660, y: 350, w: 250, h: 180 };
  const ruleBox = { x: 940, y: 350, w: 190, h: 180 };

  return `
    <!-- Top Pipeline Row: User Request -> Planner -> Tool Execution -> Audit -->
    <!-- Node 1: User Request -->
    <g>
      <rect x="${userBox.x}" y="${userBox.y}" width="${userBox.w}" height="${userBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${userBox.x}" y="${userBox.y}" width="${userBox.w}" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('user', userBox.x + 16, userBox.y + 16, '#38BDF8')}
      <text x="${userBox.x + 50}" y="${userBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" letter-spacing="1">STEP 01</text>
      <text x="${userBox.x + 50}" y="${userBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">User Request</text>
      <text x="${userBox.x + 16}" y="${userBox.y + 76}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Natural language task input</text>
    </g>

    <!-- Arrow 1: User -> Planner / Agent Orchestrator -->
    <line x1="${userBox.x + userBox.w}" y1="${userBox.y + 45}" x2="${agentBox.x}" y2="${userBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${agentBox.x - 3},${userBox.y + 41} ${agentBox.x + 3},${userBox.y + 45} ${agentBox.x - 3},${userBox.y + 49}" fill="#64748B"/>
    <rect x="303" y="${userBox.y + 32}" width="48" height="24" rx="12" fill="#0B132B" stroke="#475569" stroke-width="1"/>
    <text x="327" y="${userBox.y + 49}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">Task</text>

    <!-- Node 2: Planner & Agent Orchestrator -->
    <g>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="${agentBox.h}" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('brain', agentBox.x + 16, agentBox.y + 16, '#38BDF8')}
      <text x="${agentBox.x + 50}" y="${agentBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" letter-spacing="1">STEP 02: PLANNER</text>
      <text x="${agentBox.x + 50}" y="${agentBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Agent Orchestrator</text>
      <text x="${agentBox.x + 16}" y="${agentBox.y + 76}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">ReAct reasoning &amp; plan</text>
    </g>

    <!-- Arrow 2: Agent -> Tool -->
    <line x1="${agentBox.x + agentBox.w}" y1="${agentBox.y + 45}" x2="${toolBox.x}" y2="${agentBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${toolBox.x - 3},${agentBox.y + 41} ${toolBox.x + 3},${agentBox.y + 45} ${toolBox.x - 3},${agentBox.y + 49}" fill="#64748B"/>
    <rect x="602" y="${agentBox.y + 32}" width="65" height="24" rx="12" fill="#0B132B" stroke="#475569" stroke-width="1"/>
    <text x="634" y="${agentBox.y + 49}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">Dispatch</text>

    <!-- Node 3: Tool Execution -->
    <g>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="${toolBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="4" rx="2" fill="#818CF8"/>
      ${renderSvgIcon('tool', toolBox.x + 16, toolBox.y + 16, '#818CF8')}
      <text x="${toolBox.x + 50}" y="${toolBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#818CF8" letter-spacing="1">STEP 03</text>
      <text x="${toolBox.x + 50}" y="${toolBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Tool Execution</text>
      <text x="${toolBox.x + 16}" y="${toolBox.y + 76}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">APIs, Databases &amp; Sandbox</text>
    </g>

    <!-- Arrow 3: Tool -> Audit Logs -->
    <line x1="${toolBox.x + toolBox.w}" y1="${toolBox.y + 45}" x2="${auditBox.x}" y2="${toolBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${auditBox.x - 3},${toolBox.y + 41} ${auditBox.x + 3},${toolBox.y + 45} ${auditBox.x - 3},${toolBox.y + 49}" fill="#64748B"/>
    <rect x="907" y="${toolBox.y + 32}" width="50" height="24" rx="12" fill="#0B132B" stroke="#475569" stroke-width="1"/>
    <text x="932" y="${toolBox.y + 49}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">Trace</text>

    <!-- Node 4: Audit Logs -->
    <g>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="${auditBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="4" rx="2" fill="#34D399"/>
      ${renderSvgIcon('log', auditBox.x + 16, auditBox.y + 16, '#34D399')}
      <text x="${auditBox.x + 48}" y="${auditBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#34D399" letter-spacing="1">STEP 05: AUDIT</text>
      <text x="${auditBox.x + 48}" y="${auditBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Audit Logs</text>
      <text x="${auditBox.x + 16}" y="${auditBox.y + 76}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Telemetry store</text>
    </g>

    <!-- CONTROL LAYER / GOVERNANCE (Bottom Row) -->
    <!-- Safety Intercept Path -->
    <path d="M ${agentBox.x + 115} ${agentBox.y + agentBox.h} L ${agentBox.x + 115} ${guardBox.y}" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="3 3"/>
    <polygon points="${agentBox.x + 111},${guardBox.y - 2} ${agentBox.x + 115},${guardBox.y + 4} ${agentBox.x + 119},${guardBox.y - 2}" fill="#EF4444"/>
    <rect x="${agentBox.x + 72}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 - 12}" width="86" height="24" rx="12" fill="#1E1218" stroke="#EF4444" stroke-width="1.2"/>
    <text x="${agentBox.x + 115}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 + 5}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#EF4444" text-anchor="middle">Intercept</text>

    <!-- Guardrail Enforcement Path -->
    <path d="M ${guardBox.x + guardBox.w - 30} ${guardBox.y} L ${guardBox.x + guardBox.w - 30} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${toolBox.y + toolBox.h}" fill="none" stroke="#10B981" stroke-width="2"/>
    <polygon points="${toolBox.x + 56},${toolBox.y + toolBox.h + 6} ${toolBox.x + 60},${toolBox.y + toolBox.h} ${toolBox.x + 64},${toolBox.y + toolBox.h + 6}" fill="#10B981"/>
    <rect x="${toolBox.x - 30}" y="${agentBox.y + agentBox.h + 14}" width="140" height="24" rx="12" fill="#062B28" stroke="#10B981" stroke-width="1.2"/>
    <text x="${toolBox.x + 40}" y="${agentBox.y + agentBox.h + 31}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#34D399" text-anchor="middle">Authorize Call</text>

    <!-- Node 5: Safety Guardrails (Step 04) -->
    <g>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="${guardBox.h}" rx="12" fill="#131B2E" stroke="#EF4444" stroke-width="2"/>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="4" rx="2" fill="#EF4444"/>
      ${renderSvgIcon('shield', guardBox.x + 16, guardBox.y + 18, '#EF4444')}
      <text x="${guardBox.x + 50}" y="${guardBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#EF4444" letter-spacing="1">STEP 04: GUARDRAILS</text>
      <text x="${guardBox.x + 50}" y="${guardBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Safety Guardrails</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 76}" r="3.5" fill="#EF4444"/>
      <text x="${guardBox.x + 36}" y="${guardBox.y + 81}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Step &amp; Token Upper Limits</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 108}" r="3.5" fill="#EF4444"/>
      <text x="${guardBox.x + 36}" y="${guardBox.y + 113}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Deterministic Validation</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 140}" r="3.5" fill="#EF4444"/>
      <text x="${guardBox.x + 36}" y="${guardBox.y + 145}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Destructive Command Filter</text>
    </g>

    <!-- Arrow from Guardrails to Human Approval -->
    <line x1="${guardBox.x + guardBox.w}" y1="${guardBox.y + 90}" x2="${humanBox.x}" y2="${guardBox.y + 90}" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${humanBox.x - 3},${guardBox.y + 86} ${humanBox.x + 3},${guardBox.y + 90} ${humanBox.x - 3},${guardBox.y + 94}" fill="#F59E0B"/>
    <rect x="${(guardBox.x + guardBox.w + humanBox.x) / 2 - 18}" y="${guardBox.y + 78}" width="36" height="24" rx="12" fill="#241B0D" stroke="#F59E0B" stroke-width="1"/>
    <text x="${(guardBox.x + guardBox.w + humanBox.x) / 2}" y="${guardBox.y + 95}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F59E0B" text-anchor="middle">Ask</text>

    <!-- Node 6: Human Approval Gate -->
    <g>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="${humanBox.h}" rx="12" fill="#131B2E" stroke="#F59E0B" stroke-width="2"/>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="4" rx="2" fill="#F59E0B"/>
      ${renderSvgIcon('check', humanBox.x + 16, humanBox.y + 18, '#F59E0B')}
      <text x="${humanBox.x + 50}" y="${humanBox.y + 28}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F59E0B" letter-spacing="1">GOVERNANCE GATE</text>
      <text x="${humanBox.x + 50}" y="${humanBox.y + 50}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Human Approval</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 76}" r="3.5" fill="#F59E0B"/>
      <text x="${humanBox.x + 36}" y="${humanBox.y + 81}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Destructive action quarantine</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 108}" r="3.5" fill="#F59E0B"/>
      <text x="${humanBox.x + 36}" y="${humanBox.y + 113}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Explicit signed user signoff</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 140}" r="3.5" fill="#F59E0B"/>
      <text x="${humanBox.x + 36}" y="${humanBox.y + 145}" font-family="Inter, sans-serif" font-size="14" fill="#E2E8F0">Audit trail verification</text>
    </g>

    <!-- Takeaway Summary Card (Right Column) -->
    <g>
      <rect x="${ruleBox.x}" y="${ruleBox.y}" width="${ruleBox.w}" height="${ruleBox.h}" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 30}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#38BDF8" letter-spacing="1">SECURITY</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 54}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Zero Trust Tools</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 82}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">Never grant raw API</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 106}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">access without</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 130}" font-family="Inter, sans-serif" font-size="14" fill="#94A3B8">strict sandboxing.</text>
    </g>
  `;
}

/**
 * Main Enriched SVG Generator producing complete 1200x630 canvas
 */
export function generateEnrichedTopicVisualSvg(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): { svg: string; visualStyle: VisualStyle; visualTemplate: string; archetype: TechnicalArchetype } {
  const config = determineVisualConfig(topic, hookTitle, postBody, options);
  const titleLines = wrapTextToWidth(config.title, 1050, 44, 2);
  const titleStartY = titleLines.length === 1 ? 132 : 114;
  const titleLineHeight = 52;

  let diagramBodySvg = '';

  // Select visual rendering archetype based on content
  switch (config.visualStyle) {
    case 'modern_editorial':
      diagramBodySvg = renderModernEditorial(config);
      break;
    case 'isometric_tech':
      if (config.archetype === 'devops_cicd') {
        diagramBodySvg = renderUniversalPipeline(config);
      } else {
        diagramBodySvg = renderIsometricTech(config);
      }
      break;
    case 'futuristic_ai':
      if (config.category === 'ai_safety' || config.archetype === 'ai_agents') {
        diagramBodySvg = renderAISafetyDiagram(config);
      } else {
        diagramBodySvg = renderFuturisticAI(config);
      }
      break;
    case 'code_developer':
      diagramBodySvg = renderCodeDeveloper(config);
      break;
    case 'data_visualization':
    case 'premium_3d':
    default:
      if (config.category === 'ai_safety' || config.archetype === 'ai_agents') {
        diagramBodySvg = renderAISafetyDiagram(config);
      } else if (config.nodes && config.nodes.length >= 4) {
        diagramBodySvg = renderUniversalPipeline(config);
      } else {
        diagramBodySvg = renderUniversalPipeline(config);
      }
      break;
  }

  const titleSvg = titleLines.map((line, idx) => `
    <text x="70" y="${titleStartY + idx * titleLineHeight}" font-family="Inter, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(line)}</text>
  `).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.bgGrad[0]}"/>
        <stop offset="100%" stop-color="${config.bgGrad[1]}"/>
      </linearGradient>
      <radialGradient id="glowTop" cx="85%" cy="15%" r="60%">
        <stop offset="0%" stop-color="${config.accentColor}" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="${config.accentColor}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowBottom" cx="15%" cy="85%" r="60%">
        <stop offset="0%" stop-color="${config.secondaryColor}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${config.secondaryColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)"/>
    <rect width="1200" height="630" fill="url(#glowTop)"/>
    <rect width="1200" height="630" fill="url(#glowBottom)"/>

    <!-- Subtle Background Grid Overlay for Depth -->
    <g opacity="0.06">
      <line x1="0" y1="105" x2="1200" y2="105" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="0" y1="210" x2="1200" y2="210" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="0" y1="315" x2="1200" y2="315" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="0" y1="420" x2="1200" y2="420" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="0" y1="525" x2="1200" y2="525" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="200" y1="0" x2="200" y2="630" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="400" y1="0" x2="400" y2="630" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="600" y1="0" x2="600" y2="630" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="800" y1="0" x2="800" y2="630" stroke="#FFFFFF" stroke-width="1"/>
      <line x1="1000" y1="0" x2="1000" y2="630" stroke="#FFFFFF" stroke-width="1"/>
    </g>

    <!-- Header Badge -->
    <rect x="70" y="42" width="480" height="34" rx="17" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
    <circle cx="90" cy="59" r="4.5" fill="${config.accentColor}"/>
    <text x="104" y="64" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${config.accentColor}" letter-spacing="1.2">${escapeXml(config.badge)}</text>

    <!-- Main Headline (Strictly 44px, Zero Ellipses) -->
    ${titleSvg}

    <!-- Diagram Content Body (Pure SVG, Zero foreignObject, >= 14px Font Sizes) -->
    ${diagramBodySvg}

    <!-- Footer Branding -->
    <rect x="70" y="565" width="1060" height="2" fill="#1E293B"/>
    <text x="70" y="598" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#64748B" letter-spacing="1">SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE</text>
    <text x="1130" y="598" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="${config.accentColor}" text-anchor="end" letter-spacing="1">PRODUCTION ARCHITECTURE</text>
  </svg>`;

  // Run automated visual quality validation layer
  const quality = validateVisualQuality(svg);
  if (!quality.valid) {
    console.warn(`[visualService] Warning: Visual Quality Validation issues detected for "${config.title}":\n` + quality.errors.join('\n'));
  }

  return {
    svg,
    visualStyle: config.visualStyle,
    visualTemplate: config.visualTemplate,
    archetype: config.archetype,
  };
}

/**
 * Backward-compatible wrapper returning raw SVG string
 */
export function generateTopicVisualSvg(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): string {
  const result = generateEnrichedTopicVisualSvg(topic, hookTitle, postBody, options);
  return result.svg;
}

/**
 * Backward-compatible async data URL generator
 */
export async function generateTopicVisual(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): Promise<string> {
  const svg = generateTopicVisualSvg(topic, hookTitle, postBody, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
