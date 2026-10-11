/**
 * Technical Infographic Generator for LinkedIn
 * Produces 1200x630 information-dense, topic-aware diagrams using pure SVG.
 * Strictly avoids foreignObject for 100% reliable resvg/PNG conversion.
 */

export interface VisualNode {
  step: string;
  title: string;
  subtitle?: string;
  color: string;
  iconType?: 'user' | 'brain' | 'shield' | 'tool' | 'check' | 'log' | 'code' | 'db' | 'arrow';
}

export interface DiagramConfig {
  badge: string;
  title: string;
  category: 'ai_safety' | 'workflow' | 'code' | 'debug' | 'pipeline';
  nodes?: VisualNode[];
  codeLines?: Array<{ code: string; comment?: string }>;
  takeaways?: string[];
  bgGrad: [string, string];
  accentColor: string;
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
export function wrapText(text: string, maxCharsPerLine: number = 60, maxLines: number = 2): string[] {
  // Clean leading emojis/symbols from hook headline for crisp typography
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
        // Final line: pack all remaining words that fit
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

  return lines;
}

/**
 * Renders pure SVG vector icons without emojis
 */
function renderSvgIcon(type: string, x: number, y: number, color: string): string {
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
    default:
      return `<circle cx="${x + 12}" cy="${y + 12}" r="5" fill="${color}"/>`;
  }
}

/**
 * Determines diagram layout and content based on topic, hook, and post body
 */
export function determineDiagramConfig(topic: string, hookTitle?: string, postBody?: string): DiagramConfig {
  const normTopic = (topic || '').toLowerCase();
  const textContent = `${normTopic} ${(hookTitle || '')} ${(postBody || '')}`.toLowerCase();

  // 1. AI Agent Safety / Guardrails
  if (
    textContent.includes('safety') ||
    textContent.includes('guardrail') ||
    textContent.includes('unconstrained') ||
    textContent.includes('human-in-the-loop') ||
    (normTopic.includes('ai') && textContent.includes('agent'))
  ) {
    return {
      badge: 'AI AGENT ARCHITECTURE & SAFETY CONTROLS',
      title: hookTitle || 'Production AI Agent Safety & Guardrail Pipeline',
      category: 'ai_safety',
      bgGrad: ['#070B14', '#0F172A'],
      accentColor: '#38BDF8',
      takeaways: [
        'Deterministic bounds on tool executions and step loops',
        'Human-in-the-loop triggers for high-impact mutations',
        'Immutable audit logs for observability & traceability',
      ],
    };
  }

  // 2. React & Next.js Architecture
  if (normTopic.includes('react') || normTopic.includes('next')) {
    if (textContent.includes('state') || textContent.includes('client-side') || textContent.includes('zustand') || textContent.includes('redux')) {
      return {
        badge: 'REACT & NEXT.JS STATE ARCHITECTURE',
        title: hookTitle || 'Modern React State Management Architecture',
        category: 'workflow',
        bgGrad: ['#070B14', '#0B2545'],
        accentColor: '#38BDF8',
        nodes: [
          { step: '01', title: 'Server Cache', subtitle: 'Zero Client Bundle JS', color: '#38BDF8', iconType: 'brain' },
          { step: '02', title: 'URL State', subtitle: 'Shareable Query Params', color: '#818CF8', iconType: 'tool' },
          { step: '03', title: 'Local UI State', subtitle: 'Component-Scoped Hooks', color: '#C084FC', iconType: 'db' },
          { step: '04', title: 'Derived State', subtitle: 'Computed During Render', color: '#34D399', iconType: 'check' },
        ],
        takeaways: [
          'Server state belongs in cache or Server Components',
          'Derive computed values instead of syncing useEffect',
          'Keep UI state local to minimize redundant re-renders',
        ],
      };
    }

    return {
      badge: 'REACT 19 & NEXT.JS APP ROUTER ARCHITECTURE',
      title: hookTitle || 'Modern React 19 Server & Client Architecture',
      category: 'workflow',
      bgGrad: ['#070B14', '#0B2545'],
      accentColor: '#38BDF8',
      nodes: [
        { step: '01', title: 'Server Component', subtitle: 'Zero Client Bundle JS', color: '#38BDF8', iconType: 'brain' },
        { step: '02', title: 'Server Action', subtitle: 'Type-Safe Direct RPC', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Data Mutation', subtitle: 'ACID DB Operations', color: '#C084FC', iconType: 'db' },
        { step: '04', title: 'Optimistic UI', subtitle: 'Instant 0ms Feedback', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'React Compiler auto-memoizes render passes',
        'Direct server mutations eliminate route boilerplate',
        'useOptimistic provides instant client responsiveness',
      ],
    };
  }

  // 3. TypeScript & JavaScript (Annotated Code Layout)
  if (normTopic.includes('typescript') || normTopic.includes('javascript') || normTopic.includes('ts') || normTopic.includes('type')) {
    return {
      badge: 'TYPESCRIPT & TYPE SYSTEM ENGINEERING',
      title: hookTitle || 'Advanced TypeScript Design Patterns & Type Safety',
      category: 'code',
      bgGrad: ['#070B14', '#1E1B4B'],
      accentColor: '#818CF8',
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

  // 4. Backend & Databases (Idempotency & Distributed Flow)
  if (normTopic.includes('backend') || normTopic.includes('database') || normTopic.includes('api')) {
    return {
      badge: 'DISTRIBUTED SYSTEMS & RESILIENT BACKEND',
      title: hookTitle || 'Idempotent API Processing & Transaction Pipeline',
      category: 'workflow',
      bgGrad: ['#070B14', '#171E38'],
      accentColor: '#818CF8',
      nodes: [
        { step: '01', title: 'API Gateway', subtitle: 'Idempotency Key Check', color: '#38BDF8', iconType: 'tool' },
        { step: '02', title: 'Redis Cache Lock', subtitle: 'Atomic Distributed Lock', color: '#818CF8', iconType: 'shield' },
        { step: '03', title: 'Core Processor', subtitle: 'ACID DB Transaction', color: '#C084FC', iconType: 'db' },
        { step: '04', title: 'Response Cache', subtitle: '24h Deduplication TTL', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'Client-provided idempotency keys prevent duplicate billing',
        'Distributed lock prevents race conditions on parallel retries',
        'Cached terminal response returned on duplicate attempts',
      ],
    };
  }

  // 5. Debugging & Architecture
  if (normTopic.includes('debug') || normTopic.includes('architecture')) {
    return {
      badge: 'SYSTEM DIAGNOSTICS & ROOT CAUSE ANALYSIS',
      title: hookTitle || 'Systematic 4-Step Production Debugging Protocol',
      category: 'debug',
      bgGrad: ['#070B14', '#1C152E'],
      accentColor: '#C084FC',
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

  // 6. DevOps & CI/CD Pipelines
  if (normTopic.includes('devops') || normTopic.includes('automation') || normTopic.includes('ci')) {
    return {
      badge: 'AUTOMATION & CI/CD RELEASE PIPELINES',
      title: hookTitle || 'Production-Grade Continuous Delivery Architecture',
      category: 'pipeline',
      bgGrad: ['#070B14', '#062B28'],
      accentColor: '#34D399',
      nodes: [
        { step: '01', title: 'Static Analysis', subtitle: 'TypeScript & ESLint Gates', color: '#38BDF8', iconType: 'code' },
        { step: '02', title: 'Parallel Tests', subtitle: 'Unit & E2E Test Suite', color: '#818CF8', iconType: 'tool' },
        { step: '03', title: 'Ephemeral Staging', subtitle: 'Isolated Preview Env', color: '#C084FC', iconType: 'shield' },
        { step: '04', title: 'Canary Rollout', subtitle: 'Health Check Verification', color: '#34D399', iconType: 'check' },
      ],
      takeaways: [
        'Parallelize unit and integration tests to finish in < 2m',
        'Automatic rollback triggered if canary error rates spike',
        'Immutable build artifacts promoted across staging to prod',
      ],
    };
  }

  // Fallback: AI & LLM Core Pipeline
  return {
    badge: 'ARTIFICIAL INTELLIGENCE & LLM ARCHITECTURE',
    title: hookTitle || 'Enterprise LLM Application & RAG Architecture',
    category: 'workflow',
    bgGrad: ['#070B14', '#0F172A'],
    accentColor: '#38BDF8',
    nodes: [
      { step: '01', title: 'Query &amp; Embeddings', subtitle: 'Vector RAG Retrieval', color: '#38BDF8', iconType: 'brain' },
      { step: '02', title: 'Semantic Cache', subtitle: '75% Cost Reduction', color: '#818CF8', iconType: 'tool' },
      { step: '03', title: 'LLM Inference', subtitle: 'Targeted Prompting', color: '#C084FC', iconType: 'code' },
      { step: '04', title: 'Schema Guard', subtitle: 'Strict JSON Validation', color: '#34D399', iconType: 'shield' },
    ],
    takeaways: [
      'Semantic caching prevents redundant expensive LLM calls',
      'Vector search grounds responses and minimizes hallucination',
      'Downstream contracts guaranteed via strict JSON schemas',
    ],
  };
}

/**
 * Renders the specialized AI Agent Safety diagram with 6 connected stages,
 * guardrail interception flows, and control-relationship arrows.
 */
function renderAISafetyDiagram(config: DiagramConfig): string {
  // 6 specific nodes:
  // Row 1 (Pipeline): User Request -> Agent Orchestrator -> Tool Execution -> Audit Logs
  // Row 2 (Controls): Safety Guardrails (intercepts orchestrator & tool) + Human Approval Gate
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
      <text x="${userBox.x + 50}" y="${userBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">STEP 01</text>
      <text x="${userBox.x + 50}" y="${userBox.y + 44}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">User Request</text>
      <text x="${userBox.x + 16}" y="${userBox.y + 72}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Natural language input &amp; task prompt</text>
    </g>

    <!-- Arrow 1: User -> Agent -->
    <line x1="${userBox.x + userBox.w}" y1="${userBox.y + 45}" x2="${agentBox.x}" y2="${userBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${agentBox.x - 3},${userBox.y + 41} ${agentBox.x + 3},${userBox.y + 45} ${agentBox.x - 3},${userBox.y + 49}" fill="#64748B"/>
    <text x="320" y="${userBox.y + 38}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Task</text>

    <!-- Node 2: Agent Orchestrator -->
    <g>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="${agentBox.h}" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
      <rect x="${agentBox.x}" y="${agentBox.y}" width="${agentBox.w}" height="4" rx="2" fill="#38BDF8"/>
      ${renderSvgIcon('brain', agentBox.x + 16, agentBox.y + 16, '#38BDF8')}
      <text x="${agentBox.x + 50}" y="${agentBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">ORCHESTRATION</text>
      <text x="${agentBox.x + 50}" y="${agentBox.y + 44}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Agent Orchestrator</text>
      <text x="${agentBox.x + 16}" y="${agentBox.y + 72}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">ReAct reasoning &amp; plan generation</text>
    </g>

    <!-- Arrow 2: Agent -> Tool -->
    <line x1="${agentBox.x + agentBox.w}" y1="${agentBox.y + 45}" x2="${toolBox.x}" y2="${agentBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${toolBox.x - 3},${agentBox.y + 41} ${toolBox.x + 3},${agentBox.y + 45} ${toolBox.x - 3},${agentBox.y + 49}" fill="#64748B"/>
    <text x="610" y="${agentBox.y + 38}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Dispatch</text>

    <!-- Node 3: Tool Execution -->
    <g>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="${toolBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${toolBox.x}" y="${toolBox.y}" width="${toolBox.w}" height="4" rx="2" fill="#818CF8"/>
      ${renderSvgIcon('tool', toolBox.x + 16, toolBox.y + 16, '#818CF8')}
      <text x="${toolBox.x + 50}" y="${toolBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#818CF8" letter-spacing="1">EXECUTION</text>
      <text x="${toolBox.x + 50}" y="${toolBox.y + 44}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Tool Execution</text>
      <text x="${toolBox.x + 16}" y="${toolBox.y + 72}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">APIs, Databases &amp; External CLI</text>
    </g>

    <!-- Arrow 3: Tool -> Audit Logs -->
    <line x1="${toolBox.x + toolBox.w}" y1="${toolBox.y + 45}" x2="${auditBox.x}" y2="${toolBox.y + 45}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${auditBox.x - 3},${toolBox.y + 41} ${auditBox.x + 3},${toolBox.y + 45} ${auditBox.x - 3},${toolBox.y + 49}" fill="#64748B"/>
    <text x="900" y="${toolBox.y + 38}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Trace</text>

    <!-- Node 4: Audit Logs -->
    <g>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="${auditBox.h}" rx="10" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="${auditBox.x}" y="${auditBox.y}" width="${auditBox.w}" height="4" rx="2" fill="#34D399"/>
      ${renderSvgIcon('log', auditBox.x + 16, auditBox.y + 16, '#34D399')}
      <text x="${auditBox.x + 50}" y="${auditBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#34D399" letter-spacing="1">OBSERVABILITY</text>
      <text x="${auditBox.x + 50}" y="${auditBox.y + 44}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">Audit Logs</text>
      <text x="${auditBox.x + 16}" y="${auditBox.y + 72}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Input/output telemetry store</text>
    </g>

    <!-- CONTROL LAYER / GOVERNANCE (Bottom Row) -->

    <!-- Safety Intercept Path: Agent down to Guardrails -->
    <path d="M ${agentBox.x + 115} ${agentBox.y + agentBox.h} L ${agentBox.x + 115} ${guardBox.y}" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="3 3"/>
    <polygon points="${agentBox.x + 111},${guardBox.y - 2} ${agentBox.x + 115},${guardBox.y + 4} ${agentBox.x + 119},${guardBox.y - 2}" fill="#EF4444"/>
    <rect x="${agentBox.x + 65}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 - 8}" width="60" height="16" rx="8" fill="#1E1218" stroke="#EF4444" stroke-width="1"/>
    <text x="${agentBox.x + 95}" y="${(agentBox.y + agentBox.h + guardBox.y) / 2 + 3}" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#EF4444" text-anchor="middle">Intercept</text>

    <!-- Guardrail Enforcement Path: Guardrails up to Tool Execution -->
    <path d="M ${guardBox.x + guardBox.w - 30} ${guardBox.y} L ${guardBox.x + guardBox.w - 30} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${agentBox.y + agentBox.h + 25} L ${toolBox.x + 60} ${toolBox.y + toolBox.h}" fill="none" stroke="#10B981" stroke-width="2"/>
    <polygon points="${toolBox.x + 56},${toolBox.y + toolBox.h + 6} ${toolBox.x + 60},${toolBox.y + toolBox.h} ${toolBox.x + 64},${toolBox.y + toolBox.h + 6}" fill="#10B981"/>
    <rect x="${toolBox.x - 30}" y="${agentBox.y + agentBox.h + 16}" width="125" height="18" rx="9" fill="#062B28" stroke="#10B981" stroke-width="1"/>
    <text x="${toolBox.x + 32}" y="${agentBox.y + agentBox.h + 29}" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#34D399" text-anchor="middle">Enforce &amp; Authorize</text>

    <!-- Node 5: Safety Guardrails -->
    <g>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="${guardBox.h}" rx="12" fill="#131B2E" stroke="#EF4444" stroke-width="2"/>
      <rect x="${guardBox.x}" y="${guardBox.y}" width="${guardBox.w}" height="4" rx="2" fill="#EF4444"/>
      ${renderSvgIcon('shield', guardBox.x + 16, guardBox.y + 18, '#EF4444')}
      <text x="${guardBox.x + 50}" y="${guardBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#EF4444" letter-spacing="1">ACTIVE DEFENSE</text>
      <text x="${guardBox.x + 50}" y="${guardBox.y + 46}" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Safety Guardrails</text>
      
      <!-- Bullet points inside Safety Guardrails -->
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 72}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 76}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Execution Step &amp; Token Upper Limits</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 96}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 100}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Deterministic Schema Validation</text>
      
      <circle cx="${guardBox.x + 22}" cy="${guardBox.y + 120}" r="3" fill="#EF4444"/>
      <text x="${guardBox.x + 34}" y="${guardBox.y + 124}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Destructive Command Interception</text>
    </g>

    <!-- Arrow from Guardrails to Human Approval -->
    <line x1="${guardBox.x + guardBox.w}" y1="${guardBox.y + 70}" x2="${humanBox.x}" y2="${guardBox.y + 70}" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 2"/>
    <polygon points="${humanBox.x - 3},${guardBox.y + 66} ${humanBox.x + 3},${guardBox.y + 70} ${humanBox.x - 3},${guardBox.y + 74}" fill="#F59E0B"/>
    <text x="${(guardBox.x + guardBox.w + humanBox.x) / 2}" y="${guardBox.y + 62}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" fill="#F59E0B" text-anchor="middle">Escalate</text>

    <!-- Node 6: Human Approval Gate -->
    <g>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="${humanBox.h}" rx="12" fill="#131B2E" stroke="#F59E0B" stroke-width="2"/>
      <rect x="${humanBox.x}" y="${humanBox.y}" width="${humanBox.w}" height="4" rx="2" fill="#F59E0B"/>
      ${renderSvgIcon('check', humanBox.x + 16, humanBox.y + 18, '#F59E0B')}
      <text x="${humanBox.x + 50}" y="${humanBox.y + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#F59E0B" letter-spacing="1">GOVERNANCE GATE</text>
      <text x="${humanBox.x + 50}" y="${humanBox.y + 46}" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC">Human Approval</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 72}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 76}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Destructive action quarantine</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 96}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 100}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Explicit signed user signoff</text>
      
      <circle cx="${humanBox.x + 22}" cy="${humanBox.y + 120}" r="3" fill="#F59E0B"/>
      <text x="${humanBox.x + 34}" y="${humanBox.y + 124}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">Audit trail verification</text>
    </g>

    <!-- Takeaway Summary Card (Right Column) -->
    <g>
      <rect x="${ruleBox.x}" y="${ruleBox.y}" width="${ruleBox.w}" height="${ruleBox.h}" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 28}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" letter-spacing="1">SECURITY PRINCIPLE</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 52}" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">Zero Trust Tools</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 76}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Never grant raw API</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 94}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">access without</text>
      <text x="${ruleBox.x + 16}" y="${ruleBox.y + 112}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">strict sandboxing.</text>
    </g>
  `;
}

/**
 * Renders a 4-node connected workflow diagram with descriptive cards and arrows.
 */
function renderWorkflowDiagram(config: DiagramConfig): string {
  const nodes = config.nodes || [];
  const nodeWidth = 245;
  const nodeGap = 26;
  const startX = 70;
  const nodeY = 195;
  const nodeHeight = 135;

  const cardsSvg = nodes.map((node, i) => {
    const x = startX + i * (nodeWidth + nodeGap);
    const arrowSvg = i < nodes.length - 1 ? `
      <!-- Arrow ${i + 1} -> ${i + 2} -->
      <line x1="${x + nodeWidth + 3}" y1="${nodeY + nodeHeight / 2}" x2="${x + nodeWidth + nodeGap - 3}" y2="${nodeY + nodeHeight / 2}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
      <polygon points="${x + nodeWidth + nodeGap - 3},${nodeY + nodeHeight / 2 - 4} ${x + nodeWidth + nodeGap + 3},${nodeY + nodeHeight / 2} ${x + nodeWidth + nodeGap - 3},${nodeY + nodeHeight / 2 + 4}" fill="#64748B"/>
    ` : '';

    return `
      <g>
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="4" rx="2" fill="${node.color}"/>
        ${renderSvgIcon(node.iconType || 'tool', x + 18, nodeY + 18, node.color)}
        <text x="${x + 54}" y="${nodeY + 28}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${node.color}" letter-spacing="1">STEP ${node.step}</text>
        <text x="${x + 54}" y="${nodeY + 46}" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#F8FAFC">${escapeXml(node.title)}</text>
        <text x="${x + 18}" y="${nodeY + 82}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">${escapeXml(node.subtitle || '')}</text>
        <line x1="${x + 18}" y1="${nodeY + 98}" x2="${x + nodeWidth - 18}" y2="${nodeY + 98}" stroke="#1E293B" stroke-width="1"/>
        <circle cx="${x + 24}" cy="${nodeY + 116}" r="3" fill="${node.color}"/>
        <text x="${x + 36}" y="${nodeY + 120}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#CBD5E1">Production Safe</text>
      </g>
      ${arrowSvg}
    `;
  }).join('\n');

  // Key takeaways panel at bottom
  const takeaways = config.takeaways || [];
  const takeawaySvg = takeaways.map((t, idx) => `
    <g>
      <circle cx="${90 + idx * 360}" cy="425" r="4" fill="${config.accentColor}"/>
      <text x="${104 + idx * 360}" y="429" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" fill="#E2E8F0">${escapeXml(t)}</text>
    </g>
  `).join('\n');

  return `
    ${cardsSvg}

    <!-- Bottom Takeaways Container -->
    <rect x="70" y="375" width="1060" height="120" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>
    <text x="90" y="402" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${config.accentColor}" letter-spacing="1">ARCHITECTURAL TAKEAWAYS</text>
    ${takeawaySvg}
  `;
}

/**
 * Renders pure SVG annotated code snippet layout with syntax highlighting and callouts.
 * Zero foreignObject.
 */
function renderCodeLayout(config: DiagramConfig): string {
  const lines = config.codeLines || [];
  const startX = 70;
  const startY = 185;
  const boxWidth = 720;
  const boxHeight = 330;

  const codeSvg = lines.map((line, i) => {
    const y = startY + 66 + i * 32;
    return `
      <text x="${startX + 28}" y="${y}" font-family="'Consolas', 'Courier New', monospace" font-size="14" font-weight="600" fill="#475569">${String(i + 1).padStart(2, '0')}</text>
      <text x="${startX + 60}" y="${y}" font-family="'Consolas', 'Courier New', monospace" font-size="16" font-weight="600" fill="#38BDF8">${escapeXml(line.code)}</text>
      ${line.comment ? `<text x="${startX + 430}" y="${y}" font-family="'Consolas', 'Courier New', monospace" font-size="13" fill="#94A3B8">${escapeXml(line.comment)}</text>` : ''}
    `;
  }).join('\n');

  const takeaways = config.takeaways || [];
  const sidebarSvg = takeaways.map((t, idx) => {
    const y = startY + 60 + idx * 80;
    return `
      <g>
        <rect x="820" y="${y}" width="310" height="66" rx="8" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
        <circle cx="838" cy="${y + 24}" r="4" fill="${config.accentColor}"/>
        <text x="852" y="${y + 28}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#F8FAFC">Principle 0${idx + 1}</text>
        <text x="838" y="${y + 48}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">${escapeXml(t)}</text>
      </g>
    `;
  }).join('\n');

  return `
    <!-- Code Editor Card (Pure SVG) -->
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="${boxHeight}" rx="12" fill="#080C14" stroke="#1E293B" stroke-width="2"/>
    <!-- Code Window Title Bar -->
    <rect x="${startX}" y="${startY}" width="${boxWidth}" height="36" rx="12" fill="#0F172A"/>
    <circle cx="${startX + 20}" cy="${startY + 18}" r="5" fill="#EF4444"/>
    <circle cx="${startX + 36}" cy="${startY + 18}" r="5" fill="#F59E0B"/>
    <circle cx="${startX + 52}" cy="${startY + 18}" r="5" fill="#10B981"/>
    <text x="${startX + 74}" y="${startY + 22}" font-family="'Consolas', monospace" font-size="12" fill="#94A3B8">typescript-pattern.ts</text>

    <!-- Code Lines -->
    ${codeSvg}

    <!-- Principles Sidebar -->
    <text x="820" y="${startY + 26}" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${config.accentColor}" letter-spacing="1">KEY TECHNICAL ADVANTAGES</text>
    ${sidebarSvg}
  `;
}

/**
 * Main SVG Generator function that produces the complete 1200x630 canvas
 */
export function generateEnrichedTopicVisualSvg(topic: string, hookTitle?: string, postBody?: string): string {
  const config = determineDiagramConfig(topic, hookTitle, postBody);
  const titleLines = wrapText(config.title, 50, 2);

  let diagramBodySvg = '';
  switch (config.category) {
    case 'ai_safety':
      diagramBodySvg = renderAISafetyDiagram(config);
      break;
    case 'code':
      diagramBodySvg = renderCodeLayout(config);
      break;
    case 'workflow':
    case 'debug':
    case 'pipeline':
    default:
      diagramBodySvg = renderWorkflowDiagram(config);
      break;
  }

  const titleSvg = titleLines.map((line, idx) => `
    <text x="70" y="${118 + idx * 30}" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(line)}</text>
  `).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.bgGrad[0]}"/>
        <stop offset="100%" stop-color="${config.bgGrad[1]}"/>
      </linearGradient>
      <radialGradient id="glowTop" cx="85%" cy="15%" r="60%">
        <stop offset="0%" stop-color="${config.accentColor}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${config.accentColor}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowBottom" cx="15%" cy="85%" r="60%">
        <stop offset="0%" stop-color="${config.accentColor}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${config.accentColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)"/>
    <rect width="1200" height="630" fill="url(#glowTop)"/>
    <rect width="1200" height="630" fill="url(#glowBottom)"/>

    <!-- Header Badge -->
    <rect x="70" y="42" width="460" height="34" rx="17" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
    <circle cx="90" cy="59" r="4.5" fill="${config.accentColor}"/>
    <text x="104" y="63" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${config.accentColor}" letter-spacing="1.2">${escapeXml(config.badge)}</text>

    <!-- Main Headline (Pure SVG text with calculated lines) -->
    ${titleSvg}

    <!-- Diagram Content (No foreignObject) -->
    ${diagramBodySvg}

    <!-- Footer Branding -->
    <rect x="70" y="565" width="1060" height="2" fill="#1E293B"/>
    <text x="70" y="598" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#64748B" letter-spacing="1">SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE</text>
    <text x="1130" y="598" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${config.accentColor}" text-anchor="end" letter-spacing="1">PRODUCTION ARCHITECTURE</text>
  </svg>`;
}

/**
 * Backward-compatible wrapper
 */
export function generateTopicVisualSvg(topic: string, hookTitle?: string, postBody?: string): string {
  return generateEnrichedTopicVisualSvg(topic, hookTitle, postBody);
}

/**
 * Backward-compatible async data URL generator
 */
export async function generateTopicVisual(topic: string, hookTitle?: string, postBody?: string): Promise<string> {
  const svg = generateTopicVisualSvg(topic, hookTitle, postBody);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
