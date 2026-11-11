import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { generateLinkedInPostContent } from '@/services/aiService';
import { performTopicResearch, ResearchResult } from '@/services/researchService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid authorization token.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7).trim();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr: any) {
      console.warn('[API:Content:Generate] Token verification failed:', authErr?.message || authErr);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Firebase session expired or invalid.' },
        { status: 401 }
      );
    }

    if (!decodedToken || !decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token identity.' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const { topic, research: incomingResearch, writingStyle, language, existingPosts } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: "topic" is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // 3. Obtain topic research if not provided
    let research: ResearchResult = incomingResearch;
    if (!research || !research.summary) {
      research = await performTopicResearch(topic.trim());
    }

    // 4. Generate post content on server using server-side AI_API_KEY
    const existingPostsList = Array.isArray(existingPosts) ? existingPosts : [];
    const generated = await generateLinkedInPostContent(
      topic.trim(),
      research,
      writingStyle || 'Professional & Technical',
      language || 'English',
      existingPostsList
    );

    return NextResponse.json(
      {
        success: true,
        post: generated,
        research,
      },
      { status: 200 }
    );
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API:Content:Generate] Unexpected generation error:', errorMsg);
    return NextResponse.json(
      { success: false, error: `Content generation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
