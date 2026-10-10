export interface VisualTopicConfig {
  bgGrad: [string, string];
  accentGrad: [string, string];
  badge: string;
  filename: string;
  nodes: Array<{ step: string; title: string; color: string }>;
  codeSnippet: string;
}

export const VISUAL_CONFIGS: Record<string, VisualTopicConfig> = {
  'AI & LLMs': {
    bgGrad: ['#0B0F19', '#0F172A'],
    accentGrad: ['#06B6D4', '#3B82F6'],
    badge: 'ARTIFICIAL INTELLIGENCE & LLM ARCHITECTURE',
    filename: 'ai-agent-pipeline.ts',
    nodes: [
      { step: '01', title: 'Context & Prompts', color: '#38BDF8' },
      { step: '02', title: 'Vector RAG Search', color: '#818CF8' },
      { step: '03', title: 'LLM Inference', color: '#C084FC' },
      { step: '04', title: 'Schema Guard', color: '#34D399' },
    ],
    codeSnippet: `const agent = new AIAgent({ model: 'gemini-1.5-flash', memory: true });\nconst result = await agent.executePipeline({ prompt, schema });`,
  },
  'React & Next.js': {
    bgGrad: ['#0B0F19', '#0369A1'],
    accentGrad: ['#38BDF8', '#6366F1'],
    badge: 'REACT 19 & NEXT.JS APP ROUTER',
    filename: 'server-action-flow.ts',
    nodes: [
      { step: '01', title: 'Server Component', color: '#38BDF8' },
      { step: '02', title: 'Server Action', color: '#818CF8' },
      { step: '03', title: 'DB Mutation', color: '#C084FC' },
      { step: '04', title: 'Optimistic UI', color: '#34D399' },
    ],
    codeSnippet: `'use server';\nexport async function updateState(formData: FormData) {\n  await db.posts.update(formData); revalidatePath('/dashboard');\n}`,
  },
  'TypeScript & JavaScript': {
    bgGrad: ['#0F172A', '#1E293B'],
    accentGrad: ['#3B82F6', '#8B5CF6'],
    badge: 'TYPESCRIPT & ADVANCED TYPE SYSTEMS',
    filename: 'type-guard-pattern.ts',
    nodes: [
      { step: '01', title: 'Strict Union', color: '#38BDF8' },
      { step: '02', title: 'Type Inference', color: '#818CF8' },
      { step: '03', title: 'Runtime Guard', color: '#C084FC' },
      { step: '04', title: 'Safe State', color: '#34D399' },
    ],
    codeSnippet: `type Result<T> = { status: 'success'; data: T } | { status: 'error'; error: Error };\nfunction processData<T>(res: Result<T>): T { ... }`,
  },
  'Backend & Databases': {
    bgGrad: ['#0F172A', '#1E1B4B'],
    accentGrad: ['#6366F1', '#A855F7'],
    badge: 'DISTRIBUTED BACKEND & API DESIGN',
    filename: 'idempotent-service.ts',
    nodes: [
      { step: '01', title: 'API Gateway', color: '#38BDF8' },
      { step: '02', title: 'Idempotency Key', color: '#818CF8' },
      { step: '03', title: 'Redis Cache', color: '#C084FC' },
      { step: '04', title: 'ACID Transaction', color: '#34D399' },
    ],
    codeSnippet: `async function processTransaction(key: string, payload: Transaction) {\n  return await idempotencyStore.wrap(key, () => db.transact(payload));\n}`,
  },
  'Debugging & Architecture': {
    bgGrad: ['#1E1B4B', '#311042'],
    accentGrad: ['#A855F7', '#EC4899'],
    badge: 'SYSTEM DIAGNOSTICS & DEBUGGING PROTOCOLS',
    filename: 'trace-logger.ts',
    nodes: [
      { step: '01', title: 'Minimal Repro', color: '#38BDF8' },
      { step: '02', title: 'Span Isolation', color: '#818CF8' },
      { step: '03', title: 'Root Cause', color: '#C084FC' },
      { step: '04', title: 'Regression Test', color: '#34D399' },
    ],
    codeSnippet: `const tracer = new DiagnosticsTracer({ correlationId });\nawait tracer.isolateSpan('query-execution', () => executeQuery());`,
  },
  'DevOps & Automation': {
    bgGrad: ['#064E3B', '#0F172A'],
    accentGrad: ['#10B981', '#3B82F6'],
    badge: 'AUTOMATION & CI/CD PIPELINES',
    filename: 'ci-cd-pipeline.yml',
    nodes: [
      { step: '01', title: 'TypeCheck & Lint', color: '#38BDF8' },
      { step: '02', title: 'Parallel Tests', color: '#818CF8' },
      { step: '03', title: 'Staging Build', color: '#C084FC' },
      { step: '04', title: 'Canary Rollout', color: '#34D399' },
    ],
    codeSnippet: `pipeline: build -> typecheck -> unit-test -> canary-deploy;\nverifyHealthCheck({ timeoutMs: 5000, retryLimit: 3 });`,
  },
};

export function getVisualConfig(topic: string): VisualTopicConfig {
  const cleanTopic = topic.trim();
  const norm = cleanTopic.toLowerCase();

  if (norm.includes('ai') || norm.includes('llm')) return VISUAL_CONFIGS['AI & LLMs'];
  if (norm.includes('react') || norm.includes('next')) return VISUAL_CONFIGS['React & Next.js'];
  if (norm.includes('typescript') || norm.includes('javascript') || norm.includes('js')) return VISUAL_CONFIGS['TypeScript & JavaScript'];
  if (norm.includes('backend') || norm.includes('database') || norm.includes('api')) return VISUAL_CONFIGS['Backend & Databases'];
  if (norm.includes('debug') || norm.includes('architecture')) return VISUAL_CONFIGS['Debugging & Architecture'];
  if (norm.includes('devops') || norm.includes('automation') || norm.includes('ci')) return VISUAL_CONFIGS['DevOps & Automation'];

  return VISUAL_CONFIGS[cleanTopic] || {
    bgGrad: ['#0F172A', '#1E293B'],
    accentGrad: ['#3B82F6', '#8B5CF6'],
    badge: `${cleanTopic.toUpperCase()} • SYSTEM DESIGN`,
    filename: `${cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-architecture.ts`,
    nodes: [
      { step: '01', title: 'Ingestion', color: '#38BDF8' },
      { step: '02', title: 'Processing', color: '#818CF8' },
      { step: '03', title: 'Validation', color: '#C084FC' },
      { step: '04', title: 'Delivery', color: '#34D399' },
    ],
    codeSnippet: `// ${cleanTopic} System Design\nconst pipeline = new TechPipeline({ topic: '${cleanTopic}' });\nawait pipeline.execute();`,
  };
}

export function generateTopicVisualSvg(topic: string, hookTitle?: string): string {
  const cleanTopic = topic.trim();
  const titleText = hookTitle ? hookTitle.substring(0, 75) : `${cleanTopic} Technical Blueprint`;
  const config = getVisualConfig(cleanTopic);

  const nodeWidth = 230;
  const nodeGap = 20;
  const startX = 70;
  const nodeY = 245;
  const nodeHeight = 85;

  const nodeSvgBlocks = config.nodes.map((node, i) => {
    const x = startX + i * (nodeWidth + nodeGap);
    const arrowSvg = i < config.nodes.length - 1 ? `
      <!-- Arrow -->
      <path d="M ${x + nodeWidth + 3} ${nodeY + nodeHeight / 2} L ${x + nodeWidth + nodeGap - 3} ${nodeY + nodeHeight / 2}" stroke="#475569" stroke-width="2" stroke-dasharray="4 2"/>
      <polygon points="${x + nodeWidth + nodeGap - 3},${nodeY + nodeHeight / 2 - 4} ${x + nodeWidth + nodeGap + 1},${nodeY + nodeHeight / 2} ${x + nodeWidth + nodeGap - 3},${nodeY + nodeHeight / 2 + 4}" fill="#64748B"/>
    ` : '';

    return `
      <!-- Node ${i + 1} -->
      <g>
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
        <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="4" rx="2" fill="${node.color}"/>
        <text x="${x + 16}" y="${nodeY + 32}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="${node.color}" letter-spacing="1">STEP ${node.step}</text>
        <text x="${x + 16}" y="${nodeY + 58}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#F8FAFC">${escapeXml(node.title)}</text>
      </g>
      ${arrowSvg}
    `;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.bgGrad[0]}"/>
        <stop offset="100%" stop-color="${config.bgGrad[1]}"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${config.accentGrad[0]}"/>
        <stop offset="100%" stop-color="${config.accentGrad[1]}"/>
      </linearGradient>
      <radialGradient id="glow1" cx="90%" cy="10%" r="50%">
        <stop offset="0%" stop-color="${config.accentGrad[0]}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${config.accentGrad[0]}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="10%" cy="90%" r="50%">
        <stop offset="0%" stop-color="${config.accentGrad[1]}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${config.accentGrad[1]}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow1)"/>
    <rect width="1200" height="630" fill="url(#glow2)"/>

    <!-- Header Badge -->
    <rect x="70" y="45" width="460" height="38" rx="19" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
    <circle cx="92" cy="64" r="5" fill="#38BDF8"/>
    <text x="108" y="69" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" letter-spacing="1.2">${escapeXml(config.badge)}</text>
    
    <!-- Main Hook / Title -->
    <foreignObject x="70" y="98" width="1060" height="125">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF; font-size: 32px; font-weight: 800; line-height: 1.25; text-shadow: 0 4px 12px rgba(0,0,0,0.6);">
        ${escapeXml(titleText)}
      </div>
    </foreignObject>
    
    <!-- Connected Architecture Workflow Nodes -->
    ${nodeSvgBlocks}

    <!-- Code / Config Box -->
    <rect x="70" y="360" width="1060" height="185" rx="14" fill="#090D16" stroke="#1E293B" stroke-width="2"/>
    <rect x="70" y="360" width="1060" height="38" rx="14" fill="#0F172A"/>
    <circle cx="98" cy="379" r="5.5" fill="#EF4444"/>
    <circle cx="116" cy="379" r="5.5" fill="#F59E0B"/>
    <circle cx="134" cy="379" r="5.5" fill="#10B981"/>
    <text x="160" y="384" font-family="Courier, monospace" font-size="13" font-weight="600" fill="#64748B">${escapeXml(config.filename)}</text>
    
    <foreignObject x="90" y="412" width="1020" height="120">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Courier New', Courier, monospace; color: #38BDF8; font-size: 19px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeXml(config.codeSnippet)}
      </div>
    </foreignObject>
    
    <!-- Footer Clean Developer Branding -->
    <rect x="70" y="570" width="1060" height="3" fill="url(#accent)"/>
    <text x="70" y="604" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8" letter-spacing="1">SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE</text>
    <text x="1130" y="604" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#38BDF8" text-anchor="end" letter-spacing="1">TECHNICAL BLUEPRINT</text>
  </svg>`;
}

export async function generateTopicVisual(topic: string, hookTitle?: string): Promise<string> {
  const svg = generateTopicVisualSvg(topic, hookTitle);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}



function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
