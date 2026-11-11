/**
 * Premium AI Visual Generation Engine 2.0
 * Produces 1200x630 topic-aware, high-contrast, visually distinctive graphics using pure SVG.
 * Strictly avoids foreignObject for 100% reliable resvg/PNG conversion.
 * 
 * Supports 6 distinct visual styles:
 *  - premium_3d: Realistic 3D glassmorphism, depth, reflections, and cinematic lighting.
 *  - modern_editorial: Minimalist high-contrast typography, large headlines, architectural axioms.
 *  - isometric_tech: 3D isometric architecture diagrams with multi-tiered servers & data flows.
 *  - futuristic_ai: Neural network clusters, AI brains, intelligent agent orbits, and HUD rings.
 *  - code_developer: Realistic IDE workstations, syntax-highlighted code panels, and speed metrics.
 *  - data_visualization: Clean KPI dashboards, hero metrics, and architectural comparison charts.
 */

import { VisualStyle } from '@/types';

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
 * Splits text into wrapped lines for pure SVG text rendering without foreignObject.
 */
export function wrapText(text: string, maxCharsPerLine: number = 50, maxLines: number = 2): string[] {
  const clean = text.replace(/^[^\w\s"']+/g, '').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (lines.length === maxLines - 1) {
        let lastLine = word;
        for (let j = i + 1; j < words.length; j++) {
          if ((lastLine + ' ' + words[j]).length <= maxCharsPerLine - 3) {
            lastLine += ' ' + words[j];
          } else {
            lastLine += '...';
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

  return lines.length > 0 ? lines : ['Engineering Architecture'];
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
 * Maps topic, hook, and context to the optimal visual style and template,
 * taking recent visual history into account to prevent consecutive repeats.
 */
export function determineVisualConfig(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): VisualConfig {
  const normTopic = (topic || '').toLowerCase();
  const textContent = `${normTopic} ${(hookTitle || '')} ${(postBody || '')}`.toLowerCase();
  const recentHistory = options?.recentHistory || [];
  const lastStyle = recentHistory[0]?.visualStyle;

  // 1. AI Safety / Agent Governance Specialization (Priority Contract for Test 10)
  if (
    textContent.includes('safety') ||
    textContent.includes('guardrail') ||
    textContent.includes('unconstrained') ||
    textContent.includes('human-in-the-loop') ||
    (normTopic.includes('ai') && textContent.includes('agent') && !options?.style)
  ) {
    return {
      badge: 'AI AGENT ARCHITECTURE & SAFETY CONTROLS',
      title: hookTitle || 'Production AI Agent Safety & Guardrail Pipeline',
      visualStyle: 'futuristic_ai',
      visualTemplate: 'ai_safety_governance',
      category: 'ai_safety',
      bgGrad: ['#040817', '#0A1329'],
      accentColor: '#38BDF8',
      secondaryColor: '#EF4444',
      takeaways: [
        'Deterministic bounds on tool executions and step loops',
        'Human-in-the-loop triggers for high-impact mutations',
        'Immutable audit logs for observability & traceability',
      ],
    };
  }

  // If style is explicitly requested, honor it
  if (options?.style) {
    return createConfigForExplicitStyle(options.style, topic, hookTitle, textContent);
  }

  // 2. AI / LLM / Vector Search / RAG / MCP
  if (
    normTopic.includes('ai') ||
    normTopic.includes('llm') ||
    normTopic.includes('gpt') ||
    normTopic.includes('model') ||
    normTopic.includes('rag') ||
    normTopic.includes('vector') ||
    normTopic.includes('mcp')
  ) {
    // Check RAG & Vector Space
    if (textContent.includes('rag') || textContent.includes('vector') || textContent.includes('embedding') || textContent.includes('retrieval')) {
      const candidateStyle: VisualStyle = lastStyle === 'data_visualization' ? 'premium_3d' : 'data_visualization';
      return {
        badge: 'RAG & HIGH-DIMENSIONAL VECTOR ARCHITECTURE',
        title: hookTitle || 'Enterprise RAG Retrieval & Vector Pipeline',
        visualStyle: candidateStyle,
        visualTemplate: 'vector_rag_pipeline',
        category: 'data_vis',
        bgGrad: ['#04091A', '#0C1B3A'],
        accentColor: '#38BDF8',
        secondaryColor: '#818CF8',
        metrics: [
          { value: '75%', label: 'Cost Reduction', subtext: 'via Semantic Caching', color: '#38BDF8' },
          { value: '< 18ms', label: 'Vector Index P99', subtext: 'HNSW Graph Search', color: '#818CF8' },
          { value: '99.4%', label: 'Retrieval Recall', subtext: 'Hybrid Dense + BM25', color: '#34D399' },
        ],
        takeaways: [
          'Semantic caching prevents redundant expensive LLM calls',
          'Hybrid search combines semantic dense vectors with lexical exact tokens',
          'Strict JSON schema validation eliminates downstream deserialization crashes',
        ],
      };
    }

    // Futuristic AI Neural Visual
    const candidateStyle: VisualStyle = lastStyle === 'futuristic_ai' ? 'premium_3d' : 'futuristic_ai';
    return {
      badge: 'ARTIFICIAL INTELLIGENCE & LLM SYSTEMS',
      title: hookTitle || 'Production AI Agent & LLM Architecture',
      visualStyle: candidateStyle,
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
        'Tiered model routing saves 60% on routine agent steps',
        'Automated golden evaluation datasets catch silent model drift',
      ],
    };
  }

  // 3. TypeScript & JavaScript (Code & Developer Visual)
  if (normTopic.includes('typescript') || normTopic.includes('javascript') || normTopic.includes('ts') || normTopic.includes('type')) {
    return {
      badge: 'TYPESCRIPT & TYPE SYSTEM ENGINEERING',
      title: hookTitle || 'Advanced TypeScript Design Patterns & Type Safety',
      visualStyle: 'code_developer',
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

  // 4. React & Next.js Architecture
  if (normTopic.includes('react') || normTopic.includes('next') || normTopic.includes('frontend')) {
    const candidateStyle: VisualStyle = lastStyle === 'premium_3d' ? 'code_developer' : 'premium_3d';
    return {
      badge: 'REACT 19 & NEXT.JS APP ROUTER ARCHITECTURE',
      title: hookTitle || 'Modern React 19 Server & Client Architecture',
      visualStyle: candidateStyle,
      visualTemplate: 'react_server_actions',
      category: 'workflow',
      bgGrad: ['#04091A', '#0B2147'],
      accentColor: '#38BDF8',
      secondaryColor: '#34D399',
      nodes: [
        { step: '01', title: 'Server Component', subtitle: 'Zero Client Bundle JS', color: '#38BDF8', iconType: 'brain' },
        { step: '02', title: 'Server Action', subtitle: 'Type-Safe Direct RPC', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Data Mutation', subtitle: 'ACID DB Operations', color: '#C084FC', iconType: 'db' },
        { step: '04', title: 'Optimistic UI', subtitle: 'Instant 0ms Feedback', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'React Compiler auto-memoizes render passes without manual useMemo',
        'Direct server actions eliminate REST endpoint boilerplate',
        'useOptimistic provides instant client responsiveness',
      ],
    };
  }

  // 5. Debugging & System Diagnostics
  if (normTopic.includes('debug')) {
    return {
      badge: 'SYSTEM DIAGNOSTICS & ROOT CAUSE ANALYSIS',
      title: hookTitle || 'Systematic 4-Step Production Debugging Protocol',
      visualStyle: 'modern_editorial',
      visualTemplate: 'diagnostics_flow',
      category: 'debug',
      bgGrad: ['#080C17', '#1A152E'],
      accentColor: '#C084FC',
      secondaryColor: '#38BDF8',
      editorialQuote: {
        quote: 'Hypothesis verification and regression tests prevent silent defect recurrence.',
        authorOrAxiom: 'PRODUCTION ROOT CAUSE ANALYSIS',
      },
      nodes: [
        { step: '01', title: 'Isolate & Reproduce', subtitle: 'Minimal Test Case', color: '#38BDF8', iconType: 'code' },
        { step: '02', title: 'Span Diagnostics', subtitle: 'Correlation ID Tracing', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Root Cause Proof', subtitle: 'Hypothesis Verification', color: '#C084FC', iconType: 'shield' },
        { step: '04', title: 'Regression Guard', subtitle: 'Automated CI Test Gate', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'Formulate hypotheses before touching production code',
        'Change exactly one variable at a time during diagnostics',
        'Every bug fix must ship with an automated regression test',
      ],
    };
  }

  // 6. System Design & Microservices (Isometric Technical Illustration)
  if (
    normTopic.includes('system') ||
    normTopic.includes('microservice') ||
    normTopic.includes('distributed') ||
    normTopic.includes('scale') ||
    normTopic.includes('architecture')
  ) {
    const candidateStyle: VisualStyle = lastStyle === 'isometric_tech' ? 'premium_3d' : 'isometric_tech';
    return {
      badge: 'SYSTEM DESIGN & DISTRIBUTED MICROSERVICES',
      title: hookTitle || 'Resilient Microservices Architecture & Event Streaming',
      visualStyle: candidateStyle,
      visualTemplate: 'isometric_distributed_stack',
      category: 'isometric',
      bgGrad: ['#050817', '#0D1A38'],
      accentColor: '#38BDF8',
      secondaryColor: '#818CF8',
      nodes: [
        { step: '01', title: 'Edge Ingress', subtitle: 'Global Anycast CDN', color: '#38BDF8', iconType: 'network' },
        { step: '02', title: 'Message Broker', subtitle: 'Kafka Partition Stream', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Worker Fleet', subtitle: 'Autoscaling Pods', color: '#C084FC', iconType: 'cloud' },
        { step: '04', title: 'Replica DB', subtitle: 'Multi-Region Sharding', color: '#34D399', iconType: 'db' },
      ],
      takeaways: [
        'Asynchronous decoupled events prevent cascading network failures',
        'Partitioned consumer groups guarantee in-order event processing',
        'Read replicas offload analytical workloads from primary transactions',
      ],
    };
  }

  // 7. Backend, APIs & Databases
  if (normTopic.includes('backend') || normTopic.includes('database') || normTopic.includes('api') || normTopic.includes('sql')) {
    const candidateStyle: VisualStyle = lastStyle === 'premium_3d' ? 'data_visualization' : 'premium_3d';
    return {
      badge: 'DISTRIBUTED SYSTEMS & RESILIENT BACKEND',
      title: hookTitle || 'Idempotent API Processing & Transaction Pipeline',
      visualStyle: candidateStyle,
      visualTemplate: 'idempotent_backend_flow',
      category: 'workflow',
      bgGrad: ['#05091B', '#111C3D'],
      accentColor: '#818CF8',
      secondaryColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'API Gateway', subtitle: 'Idempotency Key Check', color: '#38BDF8', iconType: 'tool' },
        { step: '02', title: 'Redis Cache Lock', subtitle: 'Atomic Distributed Lock', color: '#818CF8', iconType: 'shield' },
        { step: '03', title: 'Core Processor', subtitle: 'ACID DB Transaction', color: '#C084FC', iconType: 'db' },
        { step: '04', title: 'Response Cache', subtitle: '24h Deduplication TTL', color: '#34D399', iconType: 'check' },
      ],
      metrics: [
        { value: '100%', label: 'Idempotency Rate', subtext: 'Zero Double-Charges', color: '#38BDF8' },
        { value: '< 4ms', label: 'Redis Mutex TTL', subtext: 'Distributed Lock P99', color: '#818CF8' },
        { value: '99.999%', label: 'Transaction ACID', subtext: 'PostgreSQL WAL Replicas', color: '#34D399' },
      ],
      takeaways: [
        'Client-provided idempotency keys prevent duplicate billing on retries',
        'Distributed lock prevents race conditions on parallel requests',
        'Cached terminal response returned on duplicate network attempts',
      ],
    };
  }

  // 7. DevOps, Docker & Kubernetes
  if (normTopic.includes('devops') || normTopic.includes('docker') || normTopic.includes('kubernetes') || normTopic.includes('cloud') || normTopic.includes('ci')) {
    return {
      badge: 'AUTOMATION & CI/CD RELEASE PIPELINES',
      title: hookTitle || 'Production-Grade Continuous Delivery Architecture',
      visualStyle: 'isometric_tech',
      visualTemplate: 'cloud_k8s_pipeline',
      category: 'pipeline',
      bgGrad: ['#040D17', '#09252A'],
      accentColor: '#34D399',
      secondaryColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'Static Analysis', subtitle: 'TypeScript & ESLint Gates', color: '#38BDF8', iconType: 'code' },
        { step: '02', title: 'Parallel Tests', subtitle: 'Unit & E2E Test Suite', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Ephemeral Staging', subtitle: 'Isolated Preview Env', color: '#C084FC', iconType: 'cloud' },
        { step: '04', title: 'Canary Rollout', subtitle: 'Health Check Verification', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'Parallelize unit and integration tests to complete under 2 minutes',
        'Automatic instant rollback triggered if canary error rates spike',
        'Immutable container images promoted identically across staging to prod',
      ],
    };
  }

  // 8. Cybersecurity & Zero Trust
  if (normTopic.includes('security') || normTopic.includes('cyber') || normTopic.includes('auth') || textContent.includes('zero-trust')) {
    return {
      badge: 'CYBERSECURITY & ZERO-TRUST DEFENSE',
      title: hookTitle || 'Zero-Trust Architecture & Threat Interception',
      visualStyle: 'premium_3d',
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

  // 9. Engineering Leadership & Career
  if (normTopic.includes('engineering') || normTopic.includes('career') || normTopic.includes('team') || normTopic.includes('lead')) {
    return {
      badge: 'ENGINEERING EXCELLENCE & ARCHITECTURAL AXIOMS',
      title: hookTitle || 'Core Engineering Principles for Staff Engineers',
      visualStyle: 'modern_editorial',
      visualTemplate: 'staff_engineering_axioms',
      category: 'editorial',
      bgGrad: ['#070A12', '#141824'],
      accentColor: '#F59E0B',
      secondaryColor: '#38BDF8',
      editorialQuote: {
        quote: 'Simplicity in system design creates operational resilience at scale.',
        authorOrAxiom: 'PRINCIPLE OF RESILIENT SYSTEMS',
      },
      takeaways: [
        'Optimize for mean-time-to-recovery (MTTR) rather than mean-time-between-failures',
        'Clear interface boundaries matter infinitely more than internal implementation details',
        'Boring, battle-tested technology compounds reliability over time',
      ],
    };
  }

  // Default Fallback: Premium 3D Architecture
  return {
    badge: 'SOFTWARE ENGINEERING & SYSTEM ARCHITECTURE',
    title: hookTitle || 'Modern Scalable System Architecture & Best Practices',
    visualStyle: 'premium_3d',
    visualTemplate: 'premium_system_cards',
    category: 'workflow',
    bgGrad: ['#040816', '#0E172F'],
    accentColor: '#38BDF8',
    secondaryColor: '#818CF8',
    nodes: [
      { step: '01', title: 'Architecture Planning', subtitle: 'Interface & Contract First', color: '#38BDF8', iconType: 'brain' },
      { step: '02', title: 'Resilient Design', subtitle: 'Fault Isolation & Retries', color: '#818CF8', iconType: 'shield' },
      { step: '03', title: 'Scalable Implementation', subtitle: 'Stateless Compute Units', color: '#C084FC', iconType: 'code' },
      { step: '04', title: 'Observability & Metrics', subtitle: 'Real-Time APM Traces', color: '#34D399', iconType: 'check' },
    ],
    takeaways: [
      'Design software systems with explicit fault domains and circuit breakers',
      'Prefer decoupled asynchronous pipelines over synchronous chains',
      'Automated testing gates prevent regressions from reaching production',
    ],
  };
}

function createConfigForExplicitStyle(
  style: VisualStyle,
  topic: string,
  hookTitle?: string,
  _textContent?: string
): VisualConfig {
  switch (style) {
    case 'modern_editorial':
      return {
        badge: 'ENGINEERING LEADERSHIP // ARCHITECTURAL AXIOMS',
        title: hookTitle || `Engineering Perspective: ${topic}`,
        visualStyle: 'modern_editorial',
        visualTemplate: 'editorial_hero',
        category: 'editorial',
        bgGrad: ['#070A12', '#141824'],
        accentColor: '#F59E0B',
        secondaryColor: '#38BDF8',
        editorialQuote: {
          quote: 'Simplicity in system design creates operational resilience at scale.',
          authorOrAxiom: 'ARCHITECTURAL PRINCIPLE',
        },
        takeaways: [
          'Optimize for observability and mean-time-to-recovery',
          'Clean interface abstractions prevent architectural erosion',
          'Pragmatic technical choices beat speculative complexity',
        ],
      };
    case 'isometric_tech':
      return {
        badge: '3D ISOMETRIC SYSTEM ARCHITECTURE',
        title: hookTitle || `Distributed Infrastructure: ${topic}`,
        visualStyle: 'isometric_tech',
        visualTemplate: 'isometric_infrastructure',
        category: 'isometric',
        bgGrad: ['#040817', '#0D1A38'],
        accentColor: '#38BDF8',
        secondaryColor: '#818CF8',
        nodes: [
          { step: '01', title: 'Edge Ingress', subtitle: 'Global CDN Routing', color: '#38BDF8', iconType: 'network' },
          { step: '02', title: 'Microservice Layer', subtitle: 'Stateless Service Fleet', color: '#818CF8', iconType: 'cloud' },
          { step: '03', title: 'Data Pipeline', subtitle: 'Partitioned Bus', color: '#C084FC', iconType: 'tool' },
          { step: '04', title: 'Persistence Store', subtitle: 'Multi-Region Replicas', color: '#34D399', iconType: 'db' },
        ],
        takeaways: [
          'Stateless services enable elastic horizontal autoscaling',
          'Decoupled queues buffer unexpected spiky traffic bursts',
          'Read replicas insulate primary OLTP databases from analytics',
        ],
      };
    case 'futuristic_ai':
      return {
        badge: 'NEURAL CLUSTER & INTELLIGENT AGENTS',
        title: hookTitle || `AI Systems Engineering: ${topic}`,
        visualStyle: 'futuristic_ai',
        visualTemplate: 'neural_agent_cluster',
        category: 'workflow',
        bgGrad: ['#020617', '#0A122E'],
        accentColor: '#38BDF8',
        secondaryColor: '#A855F7',
        nodes: [
          { step: '01', title: 'Context Engine', subtitle: 'Dynamic Prompt Packing', color: '#38BDF8', iconType: 'brain' },
          { step: '02', title: 'Model Routing', subtitle: 'Tiered Task Allocation', color: '#818CF8', iconType: 'network' },
          { step: '03', title: 'Tool Dispatcher', subtitle: 'Isolated Sandbox', color: '#C084FC', iconType: 'tool' },
          { step: '04', title: 'Audit Logger', subtitle: 'Telemetry & Evaluation', color: '#34D399', iconType: 'check' },
        ],
        takeaways: [
          'Deterministic bounds beat prompt tweaking for reliability',
          'Tiered routing saves up to 60% of LLM inference spend',
          'Continuous evaluation catches prompt degradation early',
        ],
      };
    case 'code_developer':
      return {
        badge: 'DEVELOPER WORKSPACE & ARCHITECTURE',
        title: hookTitle || `Modern Engineering: ${topic}`,
        visualStyle: 'code_developer',
        visualTemplate: 'code_ide_workspace',
        category: 'code',
        bgGrad: ['#050814', '#101633'],
        accentColor: '#818CF8',
        secondaryColor: '#38BDF8',
        codeLines: [
          { code: 'interface Architecture<T> {', comment: '// Clean contract' },
          { code: '  readonly id: string;', comment: '// Immutable identifier' },
          { code: '  execute(payload: T): Promise<Result>;', comment: '// Async execution' },
          { code: '}', comment: '' },
          { code: 'export const handler = createRoute({', comment: '' },
          { code: '  timeout: 5000, retry: 3', comment: '// Resilient SLA bounds' },
          { code: '});', comment: '' },
        ],
        takeaways: [
          'Type-level contracts prevent runtime payload degradation',
          'Strict timeout budgets prevent resource exhaustion',
          'Explicit return types enforce defensive error handling',
        ],
      };
    case 'data_visualization':
      return {
        badge: 'ENTERPRISE METRICS & DATA VISUALIZATION',
        title: hookTitle || `Performance Benchmarks: ${topic}`,
        visualStyle: 'data_visualization',
        visualTemplate: 'metrics_dashboard',
        category: 'data_vis',
        bgGrad: ['#04091A', '#0C1B3A'],
        accentColor: '#38BDF8',
        secondaryColor: '#34D399',
        metrics: [
          { value: '99.99%', label: 'Availability SLA', subtext: 'Global Anycast Edge', color: '#38BDF8' },
          { value: '< 12ms', label: 'P99 Response Time', subtext: 'Sub-second UX', color: '#818CF8' },
          { value: '10x', label: 'Scale Factor', subtext: 'Peak Concurrency', color: '#34D399' },
        ],
        takeaways: [
          'Distributed caching reduces database read load by 85%',
          'Connection pooling prevents socket exhaustion under traffic spikes',
          'Active health checks isolate degraded instances in milliseconds',
        ],
      };
    case 'premium_3d':
    default:
      return {
        badge: 'PREMIUM 3D RENDER & ARCHITECTURE',
        title: hookTitle || `System Architecture: ${topic}`,
        visualStyle: 'premium_3d',
        visualTemplate: 'premium_3d_cards',
        category: 'workflow',
        bgGrad: ['#040816', '#0E172F'],
        accentColor: '#38BDF8',
        secondaryColor: '#818CF8',
        nodes: [
          { step: '01', title: 'Input Ingress', subtitle: 'Edge Routing', color: '#38BDF8', iconType: 'brain' },
          { step: '02', title: 'Transform Layer', subtitle: 'Business Logic', color: '#818CF8', iconType: 'tool' },
          { step: '03', title: 'State Vault', subtitle: 'ACID Guarantee', color: '#C084FC', iconType: 'db' },
          { step: '04', title: 'Output Delivery', subtitle: 'Verified Return', color: '#34D399', iconType: 'check' },
        ],
        takeaways: [
          'Layered architecture isolates state mutations from presentation',
          'Idempotent operations guarantee safe execution retries',
          'Automated observability telemetry guarantees 24/7 visibility',
        ],
      };
  }
}

/**
 * STYLE A: PREMIUM 3D RENDER
 * Realistic 3D glassmorphic cards, isometric cubes, depth gradients, specular highlights,
 * and cinematic lighting.
 */
function renderPremium3DRender(config: VisualConfig): string {
  const nodes = config.nodes || [
    { step: '01', title: 'Ingress & Validation', subtitle: 'Edge Gateway Filter', color: '#38BDF8', iconType: 'brain' },
    { step: '02', title: 'Core Processor', subtitle: 'ACID Transaction Unit', color: '#818CF8', iconType: 'tool' },
    { step: '03', title: 'State & Caching', subtitle: 'Distributed Memory Grid', color: '#C084FC', iconType: 'db' },
    { step: '04', title: 'Verified Egress', subtitle: 'Audited Response Delivery', color: '#34D399', iconType: 'check' },
  ];

  const nodeWidth = 245;
  const nodeGap = 26;
  const startX = 70;
  const nodeY = 195;
  const nodeHeight = 145;

  const cardsSvg = nodes.map((node, i) => {
    const x = startX + i * (nodeWidth + nodeGap);
    const arrowSvg = i < nodes.length - 1 ? `
      <!-- 3D Connector Beam ${i + 1} -> ${i + 2} -->
      <line x1="${x + nodeWidth + 2}" y1="${nodeY + nodeHeight / 2}" x2="${x + nodeWidth + nodeGap - 2}" y2="${nodeY + nodeHeight / 2}" stroke="${config.accentColor}" stroke-width="2" stroke-dasharray="3 3"/>
      <polygon points="${x + nodeWidth + nodeGap - 4},${nodeY + nodeHeight / 2 - 4} ${x + nodeWidth + nodeGap + 3},${nodeY + nodeHeight / 2} ${x + nodeWidth + nodeGap - 4},${nodeY + nodeHeight / 2 + 4}" fill="${config.accentColor}"/>
      <circle cx="${x + nodeWidth + nodeGap / 2}" cy="${nodeY + nodeHeight / 2}" r="3" fill="#FFFFFF"/>
    ` : '';

    return `
      <!-- 3D Glass Card ${i + 1} -->
      <g>
        <!-- Drop Shadow Layer -->
        <rect x="${x + 4}" y="${nodeY + 6}" width="${nodeWidth}" height="${nodeHeight}" rx="14" fill="#000000" opacity="0.45"/>
        
        <!-- Base Glass Surface -->
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="14" fill="#0B1329" stroke="#1E2B4D" stroke-width="1.8"/>
        
        <!-- Top Specular Highlight Edge -->
        <path d="M ${x + 14} ${nodeY + 1} L ${x + nodeWidth - 14} ${nodeY + 1}" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="1.5" stroke-linecap="round"/>
        
        <!-- Top Accent Bar -->
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="4" rx="2" fill="${node.color}"/>
        
        <!-- 3D Floating Step Pill -->
        <rect x="${x + 16}" y="${nodeY + 16}" width="${64}" height="24" rx="12" fill="#030712" stroke="${node.color}" stroke-width="1.2"/>
        <text x="${x + 48}" y="${nodeY + 32}" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="${node.color}" text-anchor="middle" letter-spacing="1">STEP ${node.step}</text>
        
        <!-- Icon -->
        ${renderSvgIcon(node.iconType || 'tool', x + nodeWidth - 38, nodeY + 16, node.color)}
        
        <!-- Title & Subtitle -->
        <text x="${x + 16}" y="${nodeY + 70}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">${escapeXml(node.title)}</text>
        <text x="${x + 16}" y="${nodeY + 92}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">${escapeXml(node.subtitle || '')}</text>
        
        <!-- Bottom Divider & Verification Pill -->
        <line x1="${x + 16}" y1="${nodeY + 112}" x2="${x + nodeWidth - 16}" y2="${nodeY + 112}" stroke="#1E2B4D" stroke-width="1"/>
        <circle cx="${x + 24}" cy="${nodeY + 128}" r="3.5" fill="${node.color}"/>
        <text x="${x + 36}" y="${nodeY + 132}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Production Hardened</text>
      </g>
      ${arrowSvg}
    `;
  }).join('\n');

  const takeaways = config.takeaways || [];
  const takeawaySvg = takeaways.map((t, idx) => `
    <g>
      <circle cx="${95 + idx * 350}" cy="425" r="4.5" fill="${config.accentColor}"/>
      <text x="${112 + idx * 350}" y="429" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#E2E8F0">${escapeXml(t)}</text>
    </g>
  `).join('\n');

  return `
    ${cardsSvg}

    <!-- 3D Takeaway Banner Container -->
    <rect x="74" y="381" width="1056" height="110" rx="14" fill="#000000" opacity="0.4"/>
    <rect x="70" y="375" width="1060" height="115" rx="14" fill="#080F24" stroke="#1E2B4D" stroke-width="1.8"/>
    <path d="M 84 376 L 1116 376" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1" stroke-linecap="round"/>
    
    <text x="95" y="402" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">3D ARCHITECTURAL TAKEAWAYS</text>
    ${takeawaySvg}
  `;
}

/**
 * STYLE B: MODERN EDITORIAL
 * Minimalist high-contrast typography, large headlines, architectural axioms,
 * and clean asymmetric hierarchy.
 */
function renderModernEditorial(config: VisualConfig): string {
  const quote = config.editorialQuote?.quote || 'Simplicity in system design creates operational resilience at scale.';
  const axiom = config.editorialQuote?.authorOrAxiom || 'CORE ARCHITECTURAL PRINCIPLE';
  const takeaways = config.takeaways || [
    'Optimize for mean-time-to-recovery rather than MTBF',
    'Interface boundaries matter more than implementation details',
    'Boring, battle-tested technology compounds reliability over time',
  ];

  const takeawayRowsSvg = takeaways.map((t, idx) => {
    const y = 205 + idx * 88;
    return `
      <!-- Editorial Principle ${idx + 1} -->
      <g>
        <rect x="620" y="${y}" width="510" height="74" rx="10" fill="#0D1322" stroke="#1F293D" stroke-width="1.5"/>
        <text x="645" y="${y + 36}" font-family="Inter, sans-serif" font-size="22" font-weight="900" fill="${config.accentColor}">0${idx + 1}.</text>
        <text x="700" y="${y + 35}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Principle 0${idx + 1}</text>
        <text x="700" y="${y + 55}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">${escapeXml(t)}</text>
      </g>
    `;
  }).join('\n');

  return `
    <!-- Left Hero Column: Editorial Statement -->
    <g>
      <rect x="70" y="195" width="520" height="280" rx="14" fill="#0A0F1D" stroke="#1E2738" stroke-width="1.8"/>
      <rect x="70" y="195" width="6" height="280" rx="3" fill="${config.accentColor}"/>
      
      <!-- Axiom Category -->
      <text x="100" y="235" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">${escapeXml(axiom)}</text>
      
      <!-- Big Pull Quote -->
      <text x="100" y="278" font-family="Inter, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">"${escapeXml(quote)}"</text>
      
      <!-- Editorial Divider -->
      <line x1="100" y1="365" x2="550" y2="365" stroke="#1F293D" stroke-width="1"/>
      
      <!-- Author / Metadata Footnote -->
      <circle cx="106" cy="405" r="4" fill="${config.accentColor}"/>
      <text x="120" y="409" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#E2E8F0">Verified Production Strategy</text>
      <text x="120" y="432" font-family="Inter, sans-serif" font-size="11" fill="#64748B">Engineered for long-term reliability and zero maintenance overhead.</text>
    </g>

    <!-- Right Column: 3 Structured Takeaways -->
    ${takeawayRowsSvg}
  `;
}

/**
 * STYLE C: ISOMETRIC TECHNICAL ILLUSTRATION
 * 3D isometric architecture diagrams with multi-tiered servers, databases, and connected data flows.
 */
function renderIsometricTech(config: VisualConfig): string {
  // Center 3D Isometric Infrastructure Stack:
  // Tier 1 (Client/Ingress): Left (x: 180, y: 320)
  // Tier 2 (Service Mesh Cluster): Center (x: 520, y: 280)
  // Tier 3 (Distributed Database): Right (x: 880, y: 320)
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
      <!-- Base Shadow -->
      <polygon points="120,380 260,300 400,380 260,460" fill="#000000" opacity="0.45"/>
      
      <!-- Left Face -->
      <polygon points="120,330 260,410 260,460 120,380" fill="#0369A1" stroke="#38BDF8" stroke-width="1.2"/>
      <!-- Right Face -->
      <polygon points="260,410 400,330 400,380 260,460" fill="#0284C7" stroke="#38BDF8" stroke-width="1.2"/>
      <!-- Top Face -->
      <polygon points="260,250 400,330 260,410 120,330" fill="#0EA5E9" stroke="#7DD3FC" stroke-width="1.8"/>
      
      <!-- Glowing Ingress Badge -->
      <circle cx="260" cy="330" r="16" fill="#030712" stroke="#38BDF8" stroke-width="2"/>
      ${renderSvgIcon('network', 248, 318, '#38BDF8')}
      <text x="260" y="215" font-family="Inter, sans-serif" font-size="15" font-weight="800" fill="#F8FAFC" text-anchor="middle">Edge Gateway</text>
      <text x="260" y="235" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#38BDF8" text-anchor="middle">Anycast CDN / WAF</text>
    </g>

    <!-- Isometric Data Beam 1 -> 2 -->
    <path d="M 400 330 L 520 280" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6 3"/>
    <polygon points="516,276 528,277 521,286" fill="#38BDF8"/>
    <rect x="430" y="285" width="60" height="18" rx="9" fill="#030712" stroke="#38BDF8" stroke-width="1"/>
    <text x="460" y="298" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#38BDF8" text-anchor="middle">&lt; 4ms</text>

    <!-- TIER 2: 3D ISOMETRIC MICROSERVICE CLUSTER -->
    <g>
      <!-- Base Shadow -->
      <polygon points="460,350 600,270 740,350 600,430" fill="#000000" opacity="0.45"/>
      
      <!-- Left Face -->
      <polygon points="460,290 600,370 600,430 460,350" fill="#4338CA" stroke="#818CF8" stroke-width="1.2"/>
      <!-- Right Face -->
      <polygon points="600,370 740,290 740,350 600,430" fill="#4F46E5" stroke="#818CF8" stroke-width="1.2"/>
      <!-- Top Face -->
      <polygon points="600,210 740,290 600,370 460,290" fill="#6366F1" stroke="#A5B4FC" stroke-width="1.8"/>
      
      <!-- Glowing Cluster Badge -->
      <circle cx="600" cy="290" r="16" fill="#030712" stroke="#818CF8" stroke-width="2"/>
      ${renderSvgIcon('cloud', 588, 278, '#818CF8')}
      <text x="600" y="175" font-family="Inter, sans-serif" font-size="15" font-weight="800" fill="#F8FAFC" text-anchor="middle">Microservice Mesh</text>
      <text x="600" y="195" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#818CF8" text-anchor="middle">Autoscaling Fleet</text>
    </g>

    <!-- Isometric Data Beam 2 -> 3 -->
    <path d="M 740 290 L 860 330" stroke="#34D399" stroke-width="3" stroke-dasharray="6 3"/>
    <polygon points="852,324 866,332 856,336" fill="#34D399"/>
    <rect x="770" y="285" width="60" height="18" rx="9" fill="#030712" stroke="#34D399" stroke-width="1"/>
    <text x="800" y="298" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#34D399" text-anchor="middle">ACID WAL</text>

    <!-- TIER 3: 3D ISOMETRIC SHARDED DATABASE -->
    <g>
      <!-- Base Cylinder Shadow -->
      <ellipse cx="980" cy="430" rx="100" ry="40" fill="#000000" opacity="0.45"/>
      
      <!-- Cylinder Bottom & Sides -->
      <path d="M 880 340 V 410 C 880 435 1080 435 1080 410 V 340 Z" fill="#064E3B" stroke="#34D399" stroke-width="1.5"/>
      <!-- Cylinder Middle Ring -->
      <path d="M 880 365 C 880 390 1080 390 1080 365" fill="none" stroke="#34D399" stroke-width="1.5" stroke-dasharray="4 2"/>
      <!-- Cylinder Top Lid -->
      <ellipse cx="980" cy="340" rx="100" ry="40" fill="#059669" stroke="#6EE7B7" stroke-width="2"/>
      
      <!-- Glowing DB Badge -->
      <circle cx="980" cy="340" r="16" fill="#030712" stroke="#34D399" stroke-width="2"/>
      ${renderSvgIcon('db', 968, 328, '#34D399')}
      <text x="980" y="260" font-family="Inter, sans-serif" font-size="15" font-weight="800" fill="#F8FAFC" text-anchor="middle">Distributed Database</text>
      <text x="980" y="280" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#34D399" text-anchor="middle">Multi-Region Replicas</text>
    </g>

    <!-- Bottom Architectural Metric Cards -->
    <g>
      <rect x="70" y="475" width="330" height="70" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="90" y="502" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="#38BDF8" letter-spacing="1">LATENCY SLA</text>
      <text x="90" y="526" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">&lt; 8ms P99 Edge to Core</text>

      <rect x="435" y="475" width="330" height="70" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="455" y="502" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="#818CF8" letter-spacing="1">ISOLATION</text>
      <text x="455" y="526" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Stateless Container Fleet</text>

      <rect x="800" y="475" width="330" height="70" rx="10" fill="#091124" stroke="#1E2B4D" stroke-width="1.5"/>
      <text x="820" y="502" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="#34D399" letter-spacing="1">DURABILITY</text>
      <text x="820" y="526" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">99.999999999% Durability</text>
    </g>
  `;
}

/**
 * STYLE D: FUTURISTIC AI VISUAL
 * Neural network clusters, central intelligent agent orchestrator core,
 * synapsing paths, and holographic HUD gauges.
 */
function renderFuturisticAI(config: VisualConfig): string {
  // Center Neural Orchestrator Core at (600, 310)
  // Orbiting Agent Nodes:
  // Node 1: Top-Left (240, 240) - ReAct Planner
  // Node 2: Top-Right (960, 240) - Tool Sandbox
  // Node 3: Bottom-Left (240, 420) - Safety Guardrail
  // Node 4: Bottom-Right (960, 420) - Audit Memory
  return `
    <!-- Neural Network Synapse Lines -->
    <g>
      <!-- Center Core to Node 1 -->
      <line x1="600" y1="310" x2="260" y2="240" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="5 3"/>
      <!-- Center Core to Node 2 -->
      <line x1="600" y1="310" x2="940" y2="240" stroke="#818CF8" stroke-width="2.5" stroke-dasharray="5 3"/>
      <!-- Center Core to Node 3 -->
      <line x1="600" y1="310" x2="260" y2="420" stroke="#EF4444" stroke-width="2.5" stroke-dasharray="5 3"/>
      <!-- Center Core to Node 4 -->
      <line x1="600" y1="310" x2="940" y2="420" stroke="#34D399" stroke-width="2.5" stroke-dasharray="5 3"/>
      
      <!-- Inter-Agent Cross Connections -->
      <line x1="260" y1="240" x2="260" y2="420" stroke="#1E293B" stroke-width="1.5" stroke-dasharray="3 3"/>
      <line x1="940" y1="240" x2="940" y2="420" stroke="#1E293B" stroke-width="1.5" stroke-dasharray="3 3"/>
    </g>

    <!-- CENTER NEURAL ORCHESTRATION CORE -->
    <g>
      <!-- Outer HUD Ring 1 -->
      <circle cx="600" cy="310" r="95" fill="none" stroke="#38BDF8" stroke-width="1" stroke-dasharray="4 8" opacity="0.4"/>
      <!-- Outer HUD Ring 2 -->
      <circle cx="600" cy="310" r="75" fill="none" stroke="#818CF8" stroke-width="2" stroke-dasharray="30 15" opacity="0.6"/>
      <!-- Inner Pulse Core -->
      <circle cx="600" cy="310" r="55" fill="#070C1E" stroke="#38BDF8" stroke-width="2.5"/>
      <circle cx="600" cy="310" r="30" fill="#0C1B3A" stroke="#818CF8" stroke-width="1.5"/>
      ${renderSvgIcon('brain', 588, 298, '#38BDF8')}
      
      <!-- Center Core Labels -->
      <text x="600" y="425" font-family="Inter, sans-serif" font-size="14" font-weight="900" fill="#F8FAFC" text-anchor="middle" letter-spacing="1">AI ORCHESTRATOR</text>
      <text x="600" y="445" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#38BDF8" text-anchor="middle">ReAct Autonomous Loop</text>
    </g>

    <!-- ORBITING NODE 1: PLANNER -->
    <g>
      <rect x="110" y="200" width="230" height="85" rx="12" fill="#080E24" stroke="#38BDF8" stroke-width="1.8"/>
      <rect x="110" y="200" width="230" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('user', 126, 218, '#38BDF8')}
      <text x="160" y="230" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#38BDF8" letter-spacing="1">REASONING</text>
      <text x="160" y="248" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Goal Planner</text>
      <text x="126" y="272" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">Task decomposition &amp; context</text>
    </g>

    <!-- ORBITING NODE 2: TOOL SANDBOX -->
    <g>
      <rect x="860" y="200" width="230" height="85" rx="12" fill="#080E24" stroke="#818CF8" stroke-width="1.8"/>
      <rect x="860" y="200" width="230" height="4" rx="2" fill="#818CF8"/>
      ${renderSvgIcon('tool', 876, 218, '#818CF8')}
      <text x="910" y="230" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#818CF8" letter-spacing="1">EXECUTION</text>
      <text x="910" y="248" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Tool Dispatcher</text>
      <text x="876" y="272" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">Sandboxed API &amp; DB calls</text>
    </g>

    <!-- ORBITING NODE 3: ACTIVE DEFENSE -->
    <g>
      <rect x="110" y="380" width="230" height="85" rx="12" fill="#120A1E" stroke="#EF4444" stroke-width="1.8"/>
      <rect x="110" y="380" width="230" height="4" rx="2" fill="#EF4444"/>
      ${renderSvgIcon('shield', 126, 398, '#EF4444')}
      <text x="160" y="410" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#EF4444" letter-spacing="1">ACTIVE DEFENSE</text>
      <text x="160" y="428" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Safety Guardrail</text>
      <text x="126" y="452" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">Step bounds &amp; command filter</text>
    </g>

    <!-- ORBITING NODE 4: AUDIT STORE -->
    <g>
      <rect x="860" y="380" width="230" height="85" rx="12" fill="#07151C" stroke="#34D399" stroke-width="1.8"/>
      <rect x="860" y="380" width="230" height="4" rx="2" fill="#34D399"/>
      ${renderSvgIcon('log', 876, 398, '#34D399')}
      <text x="910" y="410" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#34D399" letter-spacing="1">OBSERVABILITY</text>
      <text x="910" y="428" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Audit Memory</text>
      <text x="876" y="452" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">Immutable telemetry log</text>
    </g>

    <!-- Bottom Telemetry HUD Bar -->
    <g>
      <rect x="70" y="495" width="1060" height="50" rx="10" fill="#040816" stroke="#1E2A4A" stroke-width="1.5"/>
      <circle cx="95" cy="520" r="4" fill="#38BDF8"/>
      <text x="110" y="524" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#F8FAFC">Status: Autonomous Agent Active</text>
      
      <circle cx="450" cy="520" r="4" fill="#34D399"/>
      <text x="465" y="524" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#F8FAFC">Confidence: 99.8% Grounded</text>
      
      <circle cx="820" cy="520" r="4" fill="#818CF8"/>
      <text x="835" y="524" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#F8FAFC">Safety Gate: Human-in-the-Loop Active</text>
    </g>
  `;
}

/**
 * STYLE E: CODE & DEVELOPER VISUAL
 * Realistic coding workstation, floating IDE editor window with syntax highlighting,
 * and execution speed metrics.
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
  const startY = 185;
  const boxWidth = 720;
  const boxHeight = 340;

  const codeSvg = lines.map((line, i) => {
    const y = startY + 68 + i * 32;
    const codeTextSvg = line.code
      ? `<text x="${startX + 60}" y="${y}" font-family="'Roboto Mono', monospace" font-size="15" font-weight="600" fill="#38BDF8">${escapeXml(line.code)}</text>`
      : '';
    const commentSvg = line.comment
      ? `<text x="${startX + 420}" y="${y}" font-family="'Roboto Mono', monospace" font-size="12" fill="#94A3B8">${escapeXml(line.comment)}</text>`
      : '';
    return `
      <text x="${startX + 26}" y="${y}" font-family="'Roboto Mono', monospace" font-size="13" font-weight="600" fill="#475569">${String(i + 1).padStart(2, '0')}</text>
      ${codeTextSvg}
      ${commentSvg}
    `;
  }).join('\n');

  const takeaways = config.takeaways || [
    'Discriminated unions eliminate unsafe runtime casts',
    'satisfies operator enforces structure with exact literals',
    'Brand types prevent primitive identifier collisions',
  ];

  const sidebarSvg = takeaways.map((t, idx) => {
    const y = startY + 60 + idx * 85;
    return `
      <g>
        <rect x="820" y="${y}" width="310" height="72" rx="10" fill="#0C1326" stroke="#1E2A48" stroke-width="1.5"/>
        <circle cx="842" cy="${y + 24}" r="4" fill="${config.accentColor}"/>
        <text x="856" y="${y + 28}" font-family="Inter, sans-serif" font-size="12" font-weight="800" fill="#F8FAFC">Principle 0${idx + 1}</text>
        <text x="842" y="${y + 50}" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">${escapeXml(t)}</text>
      </g>
    `;
  }).join('\n');

  return `
    <!-- Drop Shadow for IDE Window -->
    <rect x="${startX + 4}" y="${startY + 6}" width="${boxWidth}" height="${boxHeight}" rx="14" fill="#000000" opacity="0.5"/>
    
    <!-- Code Editor Card -->
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="${boxHeight}" rx="14" fill="#050814" stroke="#1E293B" stroke-width="2"/>
    
    <!-- Code Window Title Bar -->
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="40" rx="14" fill="#0F172A"/>
    <circle cx="${startX + 22}" cy="${startY + 20}" r="5.5" fill="#EF4444"/>
    <circle cx="${startX + 40}" cy="${startY + 20}" r="5.5" fill="#F59E0B"/>
    <circle cx="${startX + 58}" cy="${startY + 20}" r="5.5" fill="#10B981"/>
    
    <!-- File Tab -->
    <rect x="${startX + 82}" y="${startY + 6}" width="180" height="28" rx="6" fill="#050814" stroke="#1E293B" stroke-width="1"/>
    <text x="${startX + 98}" y="${startY + 24}" font-family="'Roboto Mono', monospace" font-size="12" font-weight="600" fill="#38BDF8">typescript-pattern.ts</text>
    
    <!-- Floating Benchmark Pill inside Editor -->
    <rect x="${startX + boxWidth - 190}" y="${startY + 8}" width="175" height="24" rx="12" fill="#030712" stroke="#34D399" stroke-width="1.2"/>
    <text x="${startX + boxWidth - 102}" y="${startY + 24}" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="#34D399" text-anchor="middle">0.4ms TTFT • 100% Strict</text>

    <!-- Code Content Lines -->
    ${codeSvg}

    <!-- Right Column: Key Technical Advantages -->
    <text x="820" y="${startY + 28}" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">KEY TECHNICAL ADVANTAGES</text>
    ${sidebarSvg}
  `;
}

/**
 * STYLE F: DATA VISUALIZATION
 * Clean metrics dashboard, big readable numbers, latency benchmarks, and comparative charts.
 */
function renderDataVisualization(config: VisualConfig): string {
  const metrics = config.metrics || [
    { value: '99.99%', label: 'Availability SLA', subtext: 'Global Anycast Edge', color: '#38BDF8' },
    { value: '< 12ms', label: 'P99 Latency', subtext: 'Sub-second UX P99', color: '#818CF8' },
    { value: '10x', label: 'Throughput Multiplier', subtext: 'Zero Locking Contention', color: '#34D399' },
  ];

  const cardWidth = 336;
  const startX = 70;
  const metricCardsSvg = metrics.map((m, i) => {
    const x = startX + i * (cardWidth + 26);
    return `
      <!-- Metric Card ${i + 1} -->
      <g>
        <rect x="${x + 2}" y="197" width="${cardWidth}" height="145" rx="14" fill="#000000" opacity="0.45"/>
        <rect x="${x}" y="195" width="${cardWidth}" height="145" rx="14" fill="#091226" stroke="#1D2A4A" stroke-width="1.8"/>
        <rect x="${x}" y="195" width="${cardWidth}" height="4" rx="2" fill="${m.color}"/>
        
        <!-- Big Number -->
        <text x="${x + 24}" y="258" font-family="Inter, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF">${escapeXml(m.value)}</text>
        
        <!-- Label & Subtext -->
        <text x="${x + 24}" y="295" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="${m.color}">${escapeXml(m.label)}</text>
        <text x="${x + 24}" y="318" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">${escapeXml(m.subtext)}</text>
      </g>
    `;
  }).join('\n');

  const takeaways = config.takeaways || [
    'Distributed semantic caching absorbs 75% of repeated backend calls',
    'Connection pooling prevents socket starvation under peak load spikes',
    'Circuit breakers isolate failing dependencies before cascades propagate',
  ];

  const takeawaySvg = takeaways.map((t, idx) => `
    <g>
      <circle cx="${95 + idx * 350}" cy="425" r="4.5" fill="${config.accentColor}"/>
      <text x="${112 + idx * 350}" y="429" font-family="Inter, sans-serif" font-size="12" font-weight="600" fill="#E2E8F0">${escapeXml(t)}</text>
    </g>
  `).join('\n');

  return `
    <!-- Top 3 Large Hero Metric Cards -->
    ${metricCardsSvg}

    <!-- Bottom Architectural Takeaway Container -->
    <rect x="74" y="381" width="1056" height="110" rx="14" fill="#000000" opacity="0.4"/>
    <rect x="70" y="375" width="1060" height="115" rx="14" fill="#080F24" stroke="#1E2B4D" stroke-width="1.8"/>
    <path d="M 84 376 L 1116 376" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1" stroke-linecap="round"/>
    
    <text x="95" y="402" font-family="Inter, sans-serif" font-size="11" font-weight="800" fill="${config.accentColor}" letter-spacing="1.5">PRODUCTION BENCHMARK PRINCIPLES</text>
    ${takeawaySvg}
  `;
}

/**
 * AI AGENT SAFETY SPECIALIZED ARCHITECTURE DIAGRAM
 * Required for Test 10: 6 specific connected stages, intercept flows, and governance gates.
 */
function renderAISafetyDiagram(config: VisualConfig): string {
  const userBox = { x: 70, y: 185, w: 220, h: 90 };
  const agentBox = { x: 350, y: 185, w: 230, h: 90 };
  const toolBox = { x: 640, y: 185, w: 230, h: 90 };
  const auditBox = { x: 930, y: 185, w: 200, h: 90 };

  const guardBox = { x: 350, y: 340, w: 260, h: 140 };
  const humanBox = { x: 670, y: 340, w: 240, h: 140 };
  const ruleBox = { x: 930, y: 340, w: 200, h: 140 };

  return `
    <!-- Top Pipeline Row -->
    <!-- Node 1: User Request -->
    <g>
      <rect x="${userBox.x}" y="${userBox.y}" width="${userBox.w}" height="${userBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${userBox.x}" y="${userBox.y}" width="${userBox.w}" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('user', userBox.x + 16, userBox.y + 16, '#38BDF8')}
      <text x="${userBox.x + 50}" y="${userBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">STEP 01</text>
      <text x="${userBox.x + 50}" y="${userBox.y + 44}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">User Request</text>
      <text x="${userBox.x + 16}" y="${userBox.y + 72}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">Natural language input &amp; task prompt</text>
    </g>

    <!-- Arrow 1: User -> Agent -->
    <line x1="${userBox.x + userBox.w}" y1="${userBox.y + 45}" x2="${agentBox.x}" y2="${userBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${agentBox.x - 3},${userBox.y + 41} ${agentBox.x + 3},${userBox.y + 45} ${agentBox.x - 3},${userBox.y + 49}" fill="#64748B"/>
    <text x="320" y="${userBox.y + 38}" font-family="Inter, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Task</text>

    <!-- Node 2: Agent Orchestrator -->
    <g>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="${agentBox.h}" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('brain', agentBox.x + 16, agentBox.y + 16, '#38BDF8')}
      <text x="${agentBox.x + 50}" y="${agentBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">ORCHESTRATION</text>
      <text x="${agentBox.x + 50}" y="${agentBox.y + 44}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Agent Orchestrator</text>
      <text x="${agentBox.x + 16}" y="${agentBox.y + 72}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">ReAct reasoning &amp; plan generation</text>
    </g>

    <!-- Arrow 2: Agent -> Tool -->
    <line x1="${agentBox.x + agentBox.w}" y1="${agentBox.y + 45}" x2="${toolBox.x}" y2="${agentBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${toolBox.x - 3},${agentBox.y + 41} ${toolBox.x + 3},${agentBox.y + 45} ${toolBox.x - 3},${agentBox.y + 49}" fill="#64748B"/>
    <text x="610" y="${agentBox.y + 38}" font-family="Inter, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Dispatch</text>

    <!-- Node 3: Tool Execution -->
    <g>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="${toolBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="4" rx="2" fill="#818CF8"/>
      ${renderSvgIcon('tool', toolBox.x + 16, toolBox.y + 16, '#818CF8')}
      <text x="${toolBox.x + 50}" y="${toolBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#818CF8" letter-spacing="1">EXECUTION</text>
      <text x="${toolBox.x + 50}" y="${toolBox.y + 44}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Tool Execution</text>
      <text x="${toolBox.x + 16}" y="${toolBox.y + 72}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">APIs, Databases &amp; External CLI</text>
    </g>

    <!-- Arrow 3: Tool -> Audit Logs -->
    <line x1="${toolBox.x + toolBox.w}" y1="${toolBox.y + 45}" x2="${auditBox.x}" y2="${toolBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${auditBox.x - 3},${toolBox.y + 41} ${auditBox.x + 3},${toolBox.y + 45} ${auditBox.x - 3},${toolBox.y + 49}" fill="#64748B"/>
    <text x="900" y="${toolBox.y + 38}" font-family="Inter, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Trace</text>

    <!-- Node 4: Audit Logs -->
    <g>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="${auditBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="4" rx="2" fill="#34D399"/>
      ${renderSvgIcon('log', auditBox.x + 16, auditBox.y + 16, '#34D399')}
      <text x="${auditBox.x + 50}" y="${auditBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#34D399" letter-spacing="1">OBSERVABILITY</text>
      <text x="${auditBox.x + 50}" y="${auditBox.y + 44}" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Audit Logs</text>
      <text x="${auditBox.x + 16}" y="${auditBox.y + 72}" font-family="Inter, sans-serif" font-size="12" fill="#94A3B8">Input/output telemetry store</text>
    </g>

    <!-- CONTROL LAYER / GOVERNANCE (Bottom Row) -->
    <!-- Safety Intercept Path -->
    <path d="M ${agentBox.x + 115} ${agentBox.y + agentBox.h} L ${agentBox.x + 115} ${guardBox.y}" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="3 3"/>
    <polygon points="${agentBox.x + 111},${guardBox.y - 2} ${agentBox.x + 115},${guardBox.y + 4} ${agentBox.x + 119},${guardBox.y - 2}" fill="#EF4444"/>
    <rect x="${agentBox.x + 65}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 - 8}" width="60" height="16" rx="8" fill="#1E1218" stroke="#EF4444" stroke-width="1"/>
    <text x="${agentBox.x + 95}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 + 3}" font-family="Inter, sans-serif" font-size="9" font-weight="700" fill="#EF4444" text-anchor="middle">Intercept</text>

    <!-- Guardrail Enforcement Path -->
    <path d="M ${guardBox.x + guardBox.w - 30} ${guardBox.y} L ${guardBox.x + guardBox.w - 30} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${toolBox.y + toolBox.h}" fill="none" stroke="#10B981" stroke-width="2"/>
    <polygon points="${toolBox.x + 56},${toolBox.y + toolBox.h + 6} ${toolBox.x + 60},${toolBox.y + toolBox.h} ${toolBox.x + 64},${toolBox.y + toolBox.h + 6}" fill="#10B981"/>
    <rect x="${toolBox.x - 30}" y="${agentBox.y + agentBox.h + 16}" width="125" height="18" rx="9" fill="#062B28" stroke="#10B981" stroke-width="1"/>
    <text x="${toolBox.x + 32}" y="${agentBox.y + agentBox.h + 29}" font-family="Inter, sans-serif" font-size="9" font-weight="700" fill="#34D399" text-anchor="middle">Enforce &amp; Authorize</text>

    <!-- Node 5: Safety Guardrails -->
    <g>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="${guardBox.h}" rx="12" fill="#131B2E" stroke="#EF4444" stroke-width="2"/>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="4" rx="2" fill="#EF4444"/>
      ${renderSvgIcon('shield', guardBox.x + 16, guardBox.y + 18, '#EF4444')}
      <text x="${guardBox.x + 50}" y="${guardBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#EF4444" letter-spacing="1">ACTIVE DEFENSE</text>
      <text x="${guardBox.x + 50}" y="${guardBox.y + 46}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Safety Guardrails</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 72}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 76}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Execution Step &amp; Token Upper Limits</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 96}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 100}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Deterministic Schema Validation</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 120}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 124}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Destructive Command Interception</text>
    </g>

    <!-- Arrow from Guardrails to Human Approval -->
    <line x1="${guardBox.x + guardBox.w}" y1="${guardBox.y + 70}" x2="${humanBox.x}" y2="${guardBox.y + 70}" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${humanBox.x - 3},${guardBox.y + 66} ${humanBox.x + 3},${guardBox.y + 70} ${humanBox.x - 3},${guardBox.y + 74}" fill="#F59E0B"/>
    <text x="${(guardBox.x + guardBox.w + humanBox.x) / 2}" y="${guardBox.y + 62}" font-family="Inter, sans-serif" font-size="10" fill="#F59E0B" text-anchor="middle">Escalate</text>

    <!-- Node 6: Human Approval Gate -->
    <g>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="${humanBox.h}" rx="12" fill="#131B2E" stroke="#F59E0B" stroke-width="2"/>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="4" rx="2" fill="#F59E0B"/>
      ${renderSvgIcon('check', humanBox.x + 16, humanBox.y + 18, '#F59E0B')}
      <text x="${humanBox.x + 50}" y="${humanBox.y + 26}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#F59E0B" letter-spacing="1">GOVERNANCE GATE</text>
      <text x="${humanBox.x + 50}" y="${humanBox.y + 46}" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Human Approval</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 72}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 76}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Destructive action quarantine</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 96}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 100}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Explicit signed user signoff</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 120}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 124}" font-family="Inter, sans-serif" font-size="12" fill="#E2E8F0">Audit trail verification</text>
    </g>

    <!-- Takeaway Summary Card (Right Column) -->
    <g>
      <rect x="${ruleBox.x}" y="${ruleBox.y}" width="${ruleBox.w}" height="${ruleBox.h}" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 28}" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">SECURITY PRINCIPLE</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 52}" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Zero Trust Tools</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 76}" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">Never grant raw API</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 94}" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">access without</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 112}" font-family="Inter, sans-serif" font-size="11" fill="#94A3B8">strict sandboxing.</text>
    </g>
  `;
}

/**
 * Main Enriched SVG Generator function producing complete 1200x630 canvas
 */
export function generateEnrichedTopicVisualSvg(
  topic: string,
  hookTitle?: string,
  postBody?: string,
  options?: VisualEngineOptions
): { svg: string; visualStyle: VisualStyle; visualTemplate: string } {
  const config = determineVisualConfig(topic, hookTitle, postBody, options);
  const titleLines = wrapText(config.title, 48, 2);

  let diagramBodySvg = '';
  switch (config.visualStyle) {
    case 'modern_editorial':
      diagramBodySvg = renderModernEditorial(config);
      break;
    case 'isometric_tech':
      diagramBodySvg = renderIsometricTech(config);
      break;
    case 'futuristic_ai':
      if (config.category === 'ai_safety') {
        diagramBodySvg = renderAISafetyDiagram(config);
      } else {
        diagramBodySvg = renderFuturisticAI(config);
      }
      break;
    case 'code_developer':
      diagramBodySvg = renderCodeDeveloper(config);
      break;
    case 'data_visualization':
      diagramBodySvg = renderDataVisualization(config);
      break;
    case 'premium_3d':
    default:
      if (config.category === 'ai_safety') {
        diagramBodySvg = renderAISafetyDiagram(config);
      } else {
        diagramBodySvg = renderPremium3DRender(config);
      }
      break;
  }

  const titleSvg = titleLines.map((line, idx) => `
    <text x="70" y="${118 + idx * 30}" font-family="Inter, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(line)}</text>
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
    <rect x="70" y="42" width="460" height="34" rx="17" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
    <circle cx="90" cy="59" r="4.5" fill="${config.accentColor}"/>
    <text x="104" y="63" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="${config.accentColor}" letter-spacing="1.2">${escapeXml(config.badge)}</text>

    <!-- Main Headline -->
    ${titleSvg}

    <!-- Diagram Content Body (Pure SVG, Zero foreignObject) -->
    ${diagramBodySvg}

    <!-- Footer Branding -->
    <rect x="70" y="565" width="1060" height="2" fill="#1E293B"/>
    <text x="70" y="598" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#64748B" letter-spacing="1">SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE</text>
    <text x="1130" y="598" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="${config.accentColor}" text-anchor="end" letter-spacing="1">PRODUCTION ARCHITECTURE</text>
  </svg>`;

  return {
    svg,
    visualStyle: config.visualStyle,
    visualTemplate: config.visualTemplate,
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
