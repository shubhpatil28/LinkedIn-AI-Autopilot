/**
 * Visual Quality Validation Layer (Visual Engine 3.0)
 * 
 * Performs automated visual quality audits on generated SVGs:
 * 1. Text Bounding-Box Collision Detection (AABB collision detection between text nodes).
 * 2. Canvas Boundary Enforcement (0 <= x <= 1200, 0 <= y <= 630).
 * 3. Minimum Readable Font Size Guard (>= 14px for mobile feed legibility).
 * 4. Non-Empty Visible Text Content.
 * 5. Elimination of Fabricated Metrics (no arbitrary 75%, 99.4%, 18ms claims).
 * 6. Pure SVG Compliance (strictly zero foreignObject).
 */

export interface TextBoundingBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
}

export interface VisualQualityReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  textElementCount: number;
  minFontSize: number;
  maxFontSize: number;
  hasCollisions: boolean;
  hasOutOfBounds: boolean;
  hasFabricatedMetrics: boolean;
}

/**
 * Estimates text width in pixels based on character metrics for Inter and Roboto Mono
 */
export function estimateTextWidth(text: string, fontSize: number, isMonospace: boolean = false): number {
  if (!text) return 0;
  if (isMonospace) return text.length * fontSize * 0.60;

  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if ('ijlI1.,!|:; \'`'.includes(char)) {
      width += fontSize * 0.28;
    } else if ('wmWM@#%&QO'.includes(char)) {
      width += fontSize * 0.82;
    } else if ('ABCDEFGHJKLNRSTUVXYZ023456789'.includes(char)) {
      width += fontSize * 0.62;
    } else {
      width += fontSize * 0.52;
    }
  }
  return width;
}

/**
 * Checks whether two 2D Axis-Aligned Bounding Boxes intersect
 */
export function boxesIntersect(a: TextBoundingBox, b: TextBoundingBox, padding: number = 2): boolean {
  return (
    a.x < b.x + b.width - padding &&
    a.x + a.width - padding > b.x &&
    a.y < b.y + b.height - padding &&
    a.y + a.height - padding > b.y
  );
}

/**
 * Parses all `<text>` elements from pure SVG markup into structured bounding boxes
 */
export function extractTextBoundingBoxes(svg: string): TextBoundingBox[] {
  const boxes: TextBoundingBox[] = [];
  // Regex to match <text attr="...">content</text>
  const textTagRegex = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null;
  let idCounter = 0;

  while ((match = textTagRegex.exec(svg)) !== null) {
    const rawAttrs = match[1];
    const rawContent = match[2].trim();

    // Clean inner xml / entities
    const text = rawContent
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    // Extract attributes
    const xMatch = rawAttrs.match(/\bx=["']?(-?[\d.]+)["']?/i);
    const yMatch = rawAttrs.match(/\by=["']?(-?[\d.]+)["']?/i);
    const fontSizeMatch = rawAttrs.match(/\bfont-size=["']?([\d.]+)["']?/i);
    const fontFamilyMatch = rawAttrs.match(/\bfont-family=["']?([^"']+)["']?/i);
    const anchorMatch = rawAttrs.match(/\btext-anchor=["']?([^"']+)["']?/i);

    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 14;
    const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'Inter';
    const textAnchor = anchorMatch ? anchorMatch[1].toLowerCase() : 'start';

    const isMonospace = fontFamily.toLowerCase().includes('mono');
    const width = estimateTextWidth(text, fontSize, isMonospace);
    const height = fontSize * 1.15;

    // SVG y coordinate is baseline; top is roughly y - fontSize * 0.85
    let topX = x;
    if (textAnchor === 'middle') {
      topX = x - width / 2;
    } else if (textAnchor === 'end') {
      topX = x - width;
    }
    const topY = y - fontSize * 0.85;

    boxes.push({
      id: `text_${++idCounter}`,
      text,
      x: Math.round(topX),
      y: Math.round(topY),
      width: Math.round(width),
      height: Math.round(height),
      fontSize,
      fontFamily,
    });
  }

  return boxes;
}

/**
 * Known fabricated metric phrases prohibited from production technical diagrams
 */
export const PROHIBITED_FABRICATED_METRICS: readonly string[] = [
  '75% cost reduction',
  '99.4% accuracy',
  '99.4% retrieval',
  '18ms latency',
  '< 18ms vector',
  '100% reliability',
  '+340% throughput',
  '10x throughput multiplier',
];

/**
 * Validates complete visual quality and returns comprehensive report
 */
export function validateVisualQuality(svg: string): VisualQualityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!svg || typeof svg !== 'string') {
    return {
      valid: false,
      errors: ['SVG markup is empty or not a string'],
      warnings: [],
      textElementCount: 0,
      minFontSize: 0,
      maxFontSize: 0,
      hasCollisions: false,
      hasOutOfBounds: false,
      hasFabricatedMetrics: false,
    };
  }

  // 1. Dimensions Check
  if (!svg.includes('1200') || !svg.includes('630')) {
    errors.push('Invalid canvas dimensions: must enforce 1200x630 resolution.');
  }

  // 2. Strict foreignObject Proscription
  if (svg.includes('<foreignObject') || svg.includes('foreignObject>')) {
    errors.push('Pure SVG violation: foreignObject detected. resvg requires pure vector text.');
  }

  // 3. Fabricated Metrics Check
  const lowerSvg = svg.toLowerCase();
  let hasFabricatedMetrics = false;
  for (const prohibited of PROHIBITED_FABRICATED_METRICS) {
    if (lowerSvg.includes(prohibited)) {
      hasFabricatedMetrics = true;
      errors.push(`Prohibited fabricated metric detected: "${prohibited}". Use real architecture concepts instead.`);
    }
  }

  // 4. Extract Text Bounding Boxes
  const boxes = extractTextBoundingBoxes(svg);
  if (boxes.length < 5) {
    errors.push(`Insufficient text density: found only ${boxes.length} text elements (expected >= 5).`);
  }

  let minFontSize = Infinity;
  let maxFontSize = 0;
  let hasOutOfBounds = false;
  let hasCollisions = false;

  // 5. Inspect each text box individually
  for (const box of boxes) {
    if (box.fontSize < minFontSize) minFontSize = box.fontSize;
    if (box.fontSize > maxFontSize) maxFontSize = box.fontSize;

    // A. Minimum readable font size enforcement: >= 14px
    if (box.fontSize < 14) {
      errors.push(`Font size violation: element "${box.text.substring(0, 20)}" has font-size ${box.fontSize}px (< 14px minimum).`);
    }

    // B. Non-empty text content
    if (!box.text || box.text.trim().length === 0) {
      errors.push(`Empty text element found at x=${box.x}, y=${box.y}.`);
    }

    // C. Canvas Bounds: Allow 10px safe margin (x: 10..1190, y: 10..620)
    if (box.x < 10 || box.x + box.width > 1195 || box.y < 10 || box.y + box.height > 625) {
      hasOutOfBounds = true;
      errors.push(
        `Out of bounds element: "${box.text.substring(0, 25)}" at [${box.x}, ${box.y}, w=${box.width}, h=${box.height}] exceeds 1200x630 canvas.`
      );
    }
  }

  // 6. Collision Detection: Pairwise AABB check between all text boxes
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const boxA = boxes[i];
      const boxB = boxes[j];

      // If bounding boxes collide with positive overlap
      if (boxesIntersect(boxA, boxB, 3)) {
        hasCollisions = true;
        errors.push(
          `Text Collision Detected between "${boxA.text.substring(0, 20)}" [y=${boxA.y}] and "${boxB.text.substring(0, 20)}" [y=${boxB.y}].`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    textElementCount: boxes.length,
    minFontSize: minFontSize === Infinity ? 0 : minFontSize,
    maxFontSize,
    hasCollisions,
    hasOutOfBounds,
    hasFabricatedMetrics,
  };
}
