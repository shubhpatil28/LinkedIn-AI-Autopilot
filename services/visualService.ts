export async function generateTopicVisual(topic: string, hookTitle?: string): Promise<string> {
  const cleanTopic = topic.trim();
  const titleText = hookTitle ? hookTitle.substring(0, 65) : `${cleanTopic} Technical Blueprint`;

  // Custom SVG graphic theme generator per topic concept
  const visualConfigs: Record<string, { bgGrad: [string, string]; badge: string; codeSnippet: string }> = {
    AI: {
      bgGrad: ['#0F172A', '#1E1B4B'],
      badge: 'ARTIFICIAL INTELLIGENCE & LLM SYSTEMS',
      codeSnippet: `const agent = new AIAgent({ model: 'gemini-1.5', memory: true });\nawait agent.executeWorkflow(context);`,
    },
    'AI & LLMs': {
      bgGrad: ['#0F172A', '#1E1B4B'],
      badge: 'ARTIFICIAL INTELLIGENCE & LLM SYSTEMS',
      codeSnippet: `const agent = new AIAgent({ model: 'gemini-1.5', memory: true });\nawait agent.executeWorkflow(context);`,
    },
    JavaScript: {
      bgGrad: ['#18181B', '#27272A'],
      badge: 'JAVASCRIPT ARCHITECTURE & RUNTIME',
      codeSnippet: `async function optimizeRuntime(task) {\n  using resource = acquireLock();\n  return await task.process();\n}`,
    },
    TypeScript: {
      bgGrad: ['#0F172A', '#1E293B'],
      badge: 'TYPESCRIPT & ADVANCED TYPE SYSTEMS',
      codeSnippet: `type StrictlyTyped<T> = {\n  readonly [K in keyof T]: NonNullable<T[K]>;\n};`,
    },
    'TypeScript & JavaScript': {
      bgGrad: ['#0F172A', '#1E293B'],
      badge: 'TYPESCRIPT & ADVANCED TYPE SYSTEMS',
      codeSnippet: `type StrictlyTyped<T> = {\n  readonly [K in keyof T]: NonNullable<T[K]>;\n};`,
    },
    React: {
      bgGrad: ['#0B0F19', '#0369A1'],
      badge: 'REACT 19 & MODERN FRONTEND ARCHITECTURE',
      codeSnippet: `'use server';\nexport async function updateState(formData: FormData) {\n  await db.posts.update(formData);\n}`,
    },
    'React & Next.js': {
      bgGrad: ['#0B0F19', '#0369A1'],
      badge: 'REACT 19 & NEXT.JS APP ROUTER',
      codeSnippet: `'use server';\nexport async function updateState(formData: FormData) {\n  await db.posts.update(formData);\n}`,
    },
    'Web Development': {
      bgGrad: ['#022C22', '#064E3B'],
      badge: 'WEB ARCHITECTURE & PERFORMANCE',
      codeSnippet: `header('Cache-Control: public, max-age=31536000, immutable');\nconst metrics = await observeCoreWebVitals();`,
    },
    Backend: {
      bgGrad: ['#111827', '#1E1B4B'],
      badge: 'BACKEND SERVICES & API DESIGN',
      codeSnippet: `interface IdempotentService {\n  processTransaction(key: string): Promise<Result>;\n}`,
    },
    'Backend & Databases': {
      bgGrad: ['#111827', '#1E1B4B'],
      badge: 'BACKEND SERVICES & API DESIGN',
      codeSnippet: `interface IdempotentService {\n  processTransaction(key: string): Promise<Result>;\n}`,
    },
    Debugging: {
      bgGrad: ['#1E1B4B', '#311042'],
      badge: 'SYSTEM DIAGNOSTICS & DEBUGGING PROTOCOLS',
      codeSnippet: `async function traceExecution(payload) {\n  const logger = new TraceLogger({ correlationId });\n  return await logger.wrap(payload);\n}`,
    },
    'Debugging & Architecture': {
      bgGrad: ['#1E1B4B', '#311042'],
      badge: 'SYSTEM DIAGNOSTICS & DEBUGGING PROTOCOLS',
      codeSnippet: `async function traceExecution(payload) {\n  const logger = new TraceLogger({ correlationId });\n  return await logger.wrap(payload);\n}`,
    },
    DevOps: {
      bgGrad: ['#064E3B', '#111827'],
      badge: 'AUTOMATION, CI/CD & DEPLOYMENT PIPELINES',
      codeSnippet: `pipeline: build -> test -> staticAnalysis -> canaryDeploy;\nverifyHealthChecks({ timeoutMs: 5000 });`,
    },
    'DevOps & Automation': {
      bgGrad: ['#064E3B', '#111827'],
      badge: 'AUTOMATION, CI/CD & DEPLOYMENT PIPELINES',
      codeSnippet: `pipeline: build -> test -> staticAnalysis -> canaryDeploy;\nverifyHealthChecks({ timeoutMs: 5000 });`,
    },
  };

  const config = visualConfigs[cleanTopic] || {
    bgGrad: ['#0F172A', '#1E293B'],
    badge: `${cleanTopic.toUpperCase()} • TECH INSIGHTS`,
    codeSnippet: `// ${cleanTopic} Best Practices\nconst result = await processPipeline();`,
  };

  // Build clean high-resolution SVG string encoded as Data URL
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.bgGrad[0]}"/>
        <stop offset="100%" stop-color="${config.bgGrad[1]}"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3B82F6"/>
        <stop offset="100%" stop-color="#8B5CF6"/>
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1100" cy="100" r="300" fill="#3B82F6" opacity="0.08"/>
    <circle cx="100" cy="550" r="250" fill="#8B5CF6" opacity="0.08"/>
    
    <!-- Header Badge -->
    <rect x="80" y="70" width="420" height="42" rx="21" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
    <text x="100" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#60A5FA" letter-spacing="1.5">${escapeXml(config.badge)}</text>
    
    <!-- Main Hook / Title -->
    <foreignObject x="80" y="140" width="1040" height="180">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF; font-size: 36px; font-weight: 800; line-height: 1.25; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        ${escapeXml(titleText)}
      </div>
    </foreignObject>
    
    <!-- Code / Architecture Box -->
    <rect x="80" y="330" width="1040" height="210" rx="16" fill="#090D16" stroke="#1E293B" stroke-width="2"/>
    <rect x="80" y="330" width="1040" height="40" rx="16" fill="#0F172A"/>
    <circle cx="110" cy="350" r="6" fill="#EF4444"/>
    <circle cx="130" cy="350" r="6" fill="#F59E0B"/>
    <circle cx="150" cy="350" r="6" fill="#10B981"/>
    <text x="180" y="355" font-family="monospace" font-size="13" fill="#64748B">${escapeXml(cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, '-'))}-architecture.ts</text>
    
    <foreignObject x="100" y="385" width="1000" height="140">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Courier New', Courier, monospace; color: #38BDF8; font-size: 20px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeXml(config.codeSnippet)}
      </div>
    </foreignObject>
    
    <!-- Footer Clean Developer Branding -->
    <rect x="80" y="570" width="1040" height="3" fill="url(#accent)"/>
    <text x="80" y="605" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#94A3B8">SOFTWARE ENGINEERING &amp; SYSTEM ARCHITECTURE</text>
    <text x="1120" y="605" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#60A5FA" text-anchor="end">DEVELOPER INSIGHTS</text>
  </svg>`;

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
