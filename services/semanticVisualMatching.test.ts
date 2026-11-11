/**
 * Semantic Visual Matching & Content-to-Visual Intelligence Test Suite
 * 
 * Verifies that:
 * 1. Post headline, body, and technical keywords drive topic classification with weighted priority.
 * 2. CI/CD posts never select AI Orchestrator visuals even if topic mentions AI or system design.
 * 3. Specific component flows match 100% between badge, headline, archetype, and diagram nodes:
 *    - CI/CD: Source Code -> Build -> Automated Tests -> Artifact Registry -> Deployment -> Monitoring
 *    - Runtime / Deployment Architecture: Edge Gateway -> Load Balancer -> Container Orchestration -> Application Services -> Database -> Monitoring
 *    - AI Agents: User Request -> Planner -> Tool Execution -> Guardrails -> Audit
 *    - RAG: Document Ingestion -> Chunking -> Embeddings -> Vector Search -> Reranking -> Context Generation
 *    - React/Next.js: Components -> Server Rendering -> Data Fetching -> API -> UI
 *    - Backend: Client -> API Gateway -> Authentication -> Business Logic -> Database -> Response
 *    - System Design: Edge Ingress -> Load Balancer -> Service Mesh -> Event Broker -> Database Cluster
 * 4. Deployment vs CI/CD distinction:
 *    - "Deploying a web service using Kubernetes" -> Runtime / Deployment Architecture
 *    - "GitHub Actions pipeline for automated testing" -> CI/CD
 *    - "Docker containers and service mesh architecture" -> Runtime Infrastructure
 *    - "Build, test and deploy automatically" -> CI/CD
 *    - "How to scale microservices in production" -> System Design / Runtime Architecture
 * 5. Headline formatting removes meta prefixes cleanly and avoids awkward ellipses.
 * 6. Strictly zero fabricated metrics across all generated diagrams.
 */

import {
  classifyVisualTopic,
  determineVisualConfig,
  generateEnrichedTopicVisualSvg,
  formatCleanHeadline,
} from './visualService';
import { validateVisualQuality } from './visualValidationService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('RUNNING SEMANTIC VISUAL MATCHING & CONTENT INTELLIGENCE SUITE');
  console.log('============================================================\n');

  // ---------------------------------------------------------------------------
  // Test Suite 1: Root Cause Regression — CI/CD Post with System Design Prefix
  // ---------------------------------------------------------------------------
  console.log('--- Test Suite 1: CI/CD Semantic Mismatch Root Cause Fix ---');
  {
    const rawHeadline = 'System design perspective: Evaluating the architectural tradeoffs of CI/CD Pipelines';
    const topic = 'AI & LLMs'; // Even if previous cursor or topic was AI & LLMs
    const postBody = 'Evaluating trunk-based development against feature branches, automated regression testing gates, and artifact container registries.';

    const archetype = classifyVisualTopic(topic, rawHeadline, postBody);
    assert(archetype === 'devops_cicd', 'Headline with CI/CD strictly classifies as devops_cicd even when topic parameter is AI & LLMs');

    const config = determineVisualConfig(topic, rawHeadline, postBody);
    assert(config.archetype === 'devops_cicd', 'Config archetype is devops_cicd');
    assert(config.badge === 'AUTOMATION & CI/CD RELEASE PIPELINES', 'Badge is AUTOMATION & CI/CD RELEASE PIPELINES');
    assert(!config.badge.includes('ARTIFICIAL INTELLIGENCE'), 'Badge strictly does NOT claim ARTIFICIAL INTELLIGENCE');

    // Clean headline check
    const cleanHeadline = formatCleanHeadline(rawHeadline);
    assert(!cleanHeadline.startsWith('System design perspective:'), 'Meta prefix "System design perspective: " is cleanly removed');
    assert(!cleanHeadline.includes('...'), 'No awkward ellipses introduced in headline');
    assert(cleanHeadline.includes('Evaluating the architectural tradeoffs of CI/CD Pipelines') || cleanHeadline.includes('CI/CD Pipelines'), 'Preserves core CI/CD topic in headline');

    // Generated SVG component check
    const result = generateEnrichedTopicVisualSvg(topic, rawHeadline, postBody);
    const svg = result.svg;

    // Must contain all 6 CI/CD stages
    assert(svg.includes('Source Code'), 'CI/CD SVG contains "Source Code" stage');
    assert(svg.includes('Build'), 'CI/CD SVG contains "Build" stage');
    assert(svg.includes('Automated Tests'), 'CI/CD SVG contains "Automated Tests" stage');
    assert(svg.includes('Artifact Registry'), 'CI/CD SVG contains "Artifact Registry" stage');
    assert(svg.includes('Deployment'), 'CI/CD SVG contains "Deployment" stage');
    assert(svg.includes('Monitoring'), 'CI/CD SVG contains "Monitoring" stage');

    // Strictly ZERO AI orchestrator nodes
    assert(!svg.includes('Agent Orchestrator'), 'CI/CD SVG strictly does NOT contain "Agent Orchestrator"');
    assert(!svg.includes('ReAct Loop'), 'CI/CD SVG strictly does NOT contain "ReAct Loop"');
    assert(!svg.includes('Tool Dispatcher'), 'CI/CD SVG strictly does NOT contain "Tool Dispatcher"');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 2: AI Agents & Safety Governance Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: AI Agent & Safety Orchestration Archetype ---');
  {
    const headline = 'Building Autonomous AI Agents with Deterministic Guardrails';
    const topic = 'AI & LLMs';
    const postBody = 'Implementing ReAct loops with tool execution sandboxes, human-in-the-loop triggers, and cryptographic audit logs.';

    const archetype = classifyVisualTopic(topic, headline, postBody);
    assert(archetype === 'ai_agents', 'AI agent headline classifies as ai_agents archetype');

    const config = determineVisualConfig(topic, headline, postBody);
    assert(config.archetype === 'ai_agents', 'Config archetype is ai_agents');
    assert(config.badge === 'AI AGENT ARCHITECTURE & SAFETY CONTROLS', 'Badge is AI AGENT ARCHITECTURE & SAFETY CONTROLS');

    const result = generateEnrichedTopicVisualSvg(topic, headline, postBody);
    const svg = result.svg;

    // Must contain required 5 stages
    assert(svg.includes('User Request'), 'AI Agent SVG contains "User Request" stage');
    assert(svg.includes('Planner'), 'AI Agent SVG contains "Planner" stage');
    assert(svg.includes('Tool Execution'), 'AI Agent SVG contains "Tool Execution" stage');
    assert(svg.includes('Guardrails') || svg.includes('Safety Guardrails'), 'AI Agent SVG contains "Guardrails" stage');
    assert(svg.includes('Audit') || svg.includes('Audit Logs'), 'AI Agent SVG contains "Audit" stage');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 3: RAG & High-Dimensional Vector Architecture Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: RAG & Vector Retrieval Archetype ---');
  {
    const headline = 'Production RAG: Overcoming Context Limits with Hybrid Vector Search';
    const topic = 'RAG & Vector Search Systems';
    const postBody = 'Enterprise document chunking, dense vector embeddings, HNSW index retrieval, and cross-encoder reranking pipelines.';

    const archetype = classifyVisualTopic(topic, headline, postBody);
    assert(archetype === 'rag_retrieval', 'RAG headline classifies as rag_retrieval archetype');

    const config = determineVisualConfig(topic, headline, postBody);
    assert(config.archetype === 'rag_retrieval', 'Config archetype is rag_retrieval');
    assert(config.badge === 'RAG & HIGH-DIMENSIONAL VECTOR ARCHITECTURE', 'Badge is RAG & HIGH-DIMENSIONAL VECTOR ARCHITECTURE');

    const result = generateEnrichedTopicVisualSvg(topic, headline, postBody);
    const svg = result.svg;

    // Must contain required 6 stages (multi-word titles may wrap onto two lines in SVG text elements)
    assert(svg.includes('Document') && svg.includes('Ingestion'), 'RAG SVG contains "Document Ingestion" stage');
    assert(svg.includes('Chunking'), 'RAG SVG contains "Chunking" stage');
    assert(svg.includes('Embeddings'), 'RAG SVG contains "Embeddings" stage');
    assert(svg.includes('Vector Search'), 'RAG SVG contains "Vector Search" stage');
    assert(svg.includes('Reranking'), 'RAG SVG contains "Reranking" stage');
    assert(svg.includes('Context') && svg.includes('Generation'), 'RAG SVG contains "Context Generation" stage');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 4: React 19 & Next.js Architecture Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: React & Next.js App Router Archetype ---');
  {
    const headline = 'React 19 Server Components & Actions Architecture';
    const topic = 'TypeScript & JavaScript';
    const postBody = 'Leveraging React Server Components with Server Actions for zero-bundle data fetching and optimistic UI.';

    const archetype = classifyVisualTopic(topic, headline, postBody);
    assert(archetype === 'react_nextjs', 'React Server Components headline classifies as react_nextjs');

    const config = determineVisualConfig(topic, headline, postBody);
    assert(config.archetype === 'react_nextjs', 'Config archetype is react_nextjs');
    assert(config.badge === 'REACT 19 & NEXT.JS APP ROUTER ARCHITECTURE', 'Badge is REACT 19 & NEXT.JS APP ROUTER ARCHITECTURE');

    const result = generateEnrichedTopicVisualSvg(topic, headline, postBody);
    const svg = result.svg;

    // Must contain required 5 stages
    assert(svg.includes('Components'), 'React SVG contains "Components" stage');
    assert(svg.includes('Server Rendering') || svg.includes('Server Component'), 'React SVG contains "Server Rendering" stage');
    assert(svg.includes('Data Fetching'), 'React SVG contains "Data Fetching" stage');
    assert(svg.includes('API'), 'React SVG contains "API" stage');
    assert(svg.includes('UI'), 'React SVG contains "UI" stage');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 5: Backend & Distributed APIs Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Backend & Distributed Database Archetype ---');
  {
    const headline = 'Distributed Idempotency: Preventing Double-Charges with Redis Locks';
    const topic = 'Backend & Databases';
    const postBody = 'Implementing distributed locks with TTL deduplication, write-ahead logs, and ACID transactions.';

    const archetype = classifyVisualTopic(topic, headline, postBody);
    assert(archetype === 'backend_apis', 'Idempotency and database headline classifies as backend_apis');

    const config = determineVisualConfig(topic, headline, postBody);
    assert(config.archetype === 'backend_apis', 'Config archetype is backend_apis');
    assert(config.badge === 'BACKEND API & TRANSACTION ARCHITECTURE', 'Badge is BACKEND API & TRANSACTION ARCHITECTURE');

    const result = generateEnrichedTopicVisualSvg(topic, headline, postBody);
    const svg = result.svg;

    // Must contain required 6 stages
    assert(svg.includes('Client'), 'Backend SVG contains "Client" stage');
    assert(svg.includes('API Gateway'), 'Backend SVG contains "API Gateway" stage');
    assert(svg.includes('Authentication'), 'Backend SVG contains "Authentication" stage');
    assert(svg.includes('Business Logic'), 'Backend SVG contains "Business Logic" stage');
    assert(svg.includes('Database'), 'Backend SVG contains "Database" stage');
    assert(svg.includes('Response'), 'Backend SVG contains "Response" stage');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 6: System Design & Microservice Mesh Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 6: System Design & Microservice Mesh Archetype ---');
  {
    const headline = 'Event-Driven Microservices: Kafka Sharding and Consumer Lag';
    const topic = 'System Design & Microservices';
    const postBody = 'Designing multi-region event streaming architectures with Kafka partitions, read replicas, and dead letter queues.';

    const archetype = classifyVisualTopic(topic, headline, postBody);
    assert(archetype === 'system_design', 'Event streaming and Kafka headline classifies as system_design');

    const config = determineVisualConfig(topic, headline, postBody);
    assert(config.archetype === 'system_design', 'Config archetype is system_design');
    assert(config.badge === 'SYSTEM DESIGN & DISTRIBUTED MICROSERVICES', 'Badge is SYSTEM DESIGN & DISTRIBUTED MICROSERVICES');

    const result = generateEnrichedTopicVisualSvg(topic, headline, postBody);
    const svg = result.svg;

    // Must contain system design tiers / nodes
    assert(svg.includes('Edge Ingress') || svg.includes('Ingress') || svg.includes('Edge Gateway'), 'System Design SVG contains Ingress/Edge');
    assert(svg.includes('Service Mesh') || svg.includes('Microservice Mesh'), 'System Design SVG contains Service Mesh');
    assert(svg.includes('Database') || svg.includes('Distributed Database'), 'System Design SVG contains Database');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 7: Deployment vs CI/CD Rigorous Distinction (Section 4 Regression)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 7: Deployment Architecture vs CI/CD Pipelines ---');
  {
    // Test 1: "Deploying a web service using Kubernetes" -> Runtime / Deployment Architecture
    const k8sHeadline = 'Deploying a web service using Kubernetes';
    const k8sArchetype = classifyVisualTopic('DevOps & Kubernetes', k8sHeadline);
    assert(k8sArchetype === 'deployment_runtime', '"Deploying a web service using Kubernetes" classifies as deployment_runtime');

    const k8sConfig = determineVisualConfig('DevOps & Kubernetes', k8sHeadline);
    assert(k8sConfig.badge === 'CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE', 'K8s deployment badge is CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE');
    assert(!k8sConfig.badge.includes('AUTOMATION & CI/CD'), 'K8s deployment badge strictly does NOT claim CI/CD');

    const k8sResult = generateEnrichedTopicVisualSvg('DevOps & Kubernetes', k8sHeadline);
    const k8sSvg = k8sResult.svg;
    assert(k8sSvg.includes('Edge Gateway'), 'Deployment SVG contains "Edge Gateway"');
    assert(k8sSvg.includes('Load Balancer'), 'Deployment SVG contains "Load Balancer"');
    assert(k8sSvg.includes('Container Orchestration'), 'Deployment SVG contains "Container Orchestration"');
    assert(k8sSvg.includes('Application Services'), 'Deployment SVG contains "Application Services"');
    assert(k8sSvg.includes('Database'), 'Deployment SVG contains "Database"');
    assert(k8sSvg.includes('Monitoring'), 'Deployment SVG contains "Monitoring"');
    assert(!k8sSvg.includes('Source Code'), 'Deployment SVG strictly does NOT contain CI/CD "Source Code" stage');
    assert(!k8sSvg.includes('Artifact Registry'), 'Deployment SVG strictly does NOT contain CI/CD "Artifact Registry" stage');

    // Test 2: "GitHub Actions pipeline for automated testing" -> CI/CD
    const ghaHeadline = 'GitHub Actions pipeline for automated testing';
    const ghaArchetype = classifyVisualTopic('DevOps & Automation', ghaHeadline);
    assert(ghaArchetype === 'devops_cicd', '"GitHub Actions pipeline for automated testing" classifies as devops_cicd');

    const ghaConfig = determineVisualConfig('DevOps & Automation', ghaHeadline);
    assert(ghaConfig.badge === 'AUTOMATION & CI/CD RELEASE PIPELINES', 'GitHub Actions badge is AUTOMATION & CI/CD RELEASE PIPELINES');

    const ghaResult = generateEnrichedTopicVisualSvg('DevOps & Automation', ghaHeadline);
    const ghaSvg = ghaResult.svg;
    assert(ghaSvg.includes('Source Code'), 'CI/CD SVG contains "Source Code"');
    assert(ghaSvg.includes('Build'), 'CI/CD SVG contains "Build"');
    assert(ghaSvg.includes('Automated Tests'), 'CI/CD SVG contains "Automated Tests"');
    assert(ghaSvg.includes('Artifact Registry'), 'CI/CD SVG contains "Artifact Registry"');
    assert(ghaSvg.includes('Deployment'), 'CI/CD SVG contains "Deployment"');
    assert(ghaSvg.includes('Monitoring'), 'CI/CD SVG contains "Monitoring"');

    // Test 3: "Docker containers and service mesh architecture" -> Runtime Infrastructure
    const dockerHeadline = 'Docker containers and service mesh architecture';
    const dockerArchetype = classifyVisualTopic('DevOps & Kubernetes', dockerHeadline);
    assert(dockerArchetype === 'deployment_runtime', '"Docker containers and service mesh architecture" classifies as deployment_runtime');

    const dockerConfig = determineVisualConfig('DevOps & Kubernetes', dockerHeadline);
    assert(dockerConfig.badge === 'CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE', 'Service mesh badge is CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE');

    // Test 4: "Build, test and deploy automatically" -> CI/CD
    const autoHeadline = 'Build, test and deploy automatically';
    const autoArchetype = classifyVisualTopic('DevOps & Automation', autoHeadline);
    assert(autoArchetype === 'devops_cicd', '"Build, test and deploy automatically" classifies as devops_cicd');

    const autoConfig = determineVisualConfig('DevOps & Automation', autoHeadline);
    assert(autoConfig.badge === 'AUTOMATION & CI/CD RELEASE PIPELINES', 'Automated build/test badge is AUTOMATION & CI/CD RELEASE PIPELINES');

    // Test 5: "How to scale microservices in production" -> System Design / Runtime Architecture
    const scaleHeadline = 'How to scale microservices in production';
    const scaleArchetype = classifyVisualTopic('System Design & Microservices', scaleHeadline);
    assert(scaleArchetype === 'system_design', '"How to scale microservices in production" classifies as system_design');

    const scaleConfig = determineVisualConfig('System Design & Microservices', scaleHeadline);
    assert(scaleConfig.badge === 'SYSTEM DESIGN & DISTRIBUTED MICROSERVICES', 'Scale microservices badge is SYSTEM DESIGN & DISTRIBUTED MICROSERVICES');

    // Test 6: Production Bug Headline Case:
    // "Deploying a simple web service to production shouldn't require a master's degree in cluster management"
    const prodHeadline = "Deploying a simple web service to production shouldn't require a master's degree in cluster management";
    const prodArchetype = classifyVisualTopic('DevOps & Kubernetes', prodHeadline);
    assert(prodArchetype === 'deployment_runtime', 'Production bug headline classifies as deployment_runtime');

    const prodConfig = determineVisualConfig('DevOps & Kubernetes', prodHeadline);
    assert(prodConfig.badge === 'CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE', 'Production bug headline has CLOUD INFRASTRUCTURE & DEPLOYMENT ARCHITECTURE badge');

    // Check that headline preservation does not truncate cluster management with ellipses
    const prodClean = formatCleanHeadline(prodHeadline);
    assert(!prodClean.includes('...'), 'No ellipses in cleaned headline');
    assert(prodClean.includes('cluster management'), 'Preserves "cluster management" completely in headline');

    const prodResult = generateEnrichedTopicVisualSvg('DevOps & Kubernetes', prodHeadline);
    assert(prodResult.svg.includes('cluster management'), 'Rendered SVG includes "cluster management"');
    assert(prodResult.svg.includes('Edge Gateway'), 'Rendered SVG contains "Edge Gateway"');
    assert(prodResult.svg.includes('Container Orchestration'), 'Rendered SVG contains "Container Orchestration"');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 8: Typography Cleanliness & Ellipsis Elimination
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 8: Headline Formatting & Ellipsis Elimination ---');
  {
    const longMetaHeadline = 'Tech deep dive: 🚀 Building High-Throughput Event Sinks with Go Channels and Worker Pools!';
    const formatted = formatCleanHeadline(longMetaHeadline);
    assert(!formatted.includes('🚀'), 'Strips emojis from headline');
    assert(!formatted.startsWith('Tech deep dive:'), 'Strips meta "Tech deep dive:" prefix');
    assert(!formatted.endsWith('!'), 'Strips trailing exclamation mark');
    assert(!formatted.includes('...'), 'No ellipses in formatted headline');

    const caseStudyHeadline = 'Case study: How we reduced P99 latency by 4x using Redis connection pooling';
    const cleanCaseStudy = formatCleanHeadline(caseStudyHeadline);
    assert(!cleanCaseStudy.startsWith('Case study:'), 'Strips meta "Case study:" prefix');
    assert(!cleanCaseStudy.includes('...'), 'No ellipses in clean case study headline');

    const trailingEllipsisHeadline = 'Deploying modern web applications to production clusters...';
    const cleanTrailing = formatCleanHeadline(trailingEllipsisHeadline);
    assert(!cleanTrailing.endsWith('...'), 'Strips trailing ellipses cleanly');
    assert(cleanTrailing.includes('production clusters'), 'Preserves content before trailing ellipses');
  }

  // ---------------------------------------------------------------------------
  // Test Suite 9: Automated Quality Validation Across All Archetypes
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Suite 9: Visual Quality Validation on All Archetype SVGs ---');
  {
    const testCases = [
      { topic: 'DevOps & Automation', hook: 'Building Zero-Downtime CI/CD Release Pipelines with ArgoCD' },
      { topic: 'DevOps & Kubernetes', hook: 'Deploying a simple web service to production with Kubernetes clusters' },
      { topic: 'RAG & Vector Search Systems', hook: 'Hierarchical Navigable Small World (HNSW) Vector Retrieval' },
      { topic: 'AI & LLMs', hook: 'Multi-Agent Safety Guardrails and Tool Execution Governance' },
      { topic: 'TypeScript & JavaScript', hook: 'Server Components and Server Actions in Modern Full-Stack Apps' },
      { topic: 'Backend & Databases', hook: 'Distributed Idempotency and Distributed Locks with Redis Redlock' },
      { topic: 'System Design & Microservices', hook: 'High-Throughput Event Streaming Architecture with Apache Kafka' },
      { topic: 'Cybersecurity & Zero Trust', hook: 'Zero Trust Defense: Ephemeral Tokens and Mutual TLS Security' },
      { topic: 'Engineering Leadership & Career', hook: 'Axioms for Staff Engineers: Designing for Operational Simplicity' },
    ];

    for (const tc of testCases) {
      const { svg, archetype } = generateEnrichedTopicVisualSvg(tc.topic, tc.hook);
      const audit = validateVisualQuality(svg);

      if (!audit.valid) {
        console.error(`Audit errors for archetype ${archetype}:`, audit.errors);
      }

      assert(audit.valid, `Quality audit cleanly passes for archetype "${archetype}"`);
      assert(!audit.hasCollisions, `Zero text collisions for archetype "${archetype}"`);
      assert(!audit.hasOutOfBounds, `Zero bounds overflows for archetype "${archetype}"`);
      assert(!audit.hasFabricatedMetrics, `Zero fabricated metrics for archetype "${archetype}"`);
      assert(audit.minFontSize >= 14, `Minimum font size >= 14px for archetype "${archetype}" (found ${audit.minFontSize}px)`);
    }
  }

  console.log('\n============================================================');
  console.log(`SEMANTIC MATCHING VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
