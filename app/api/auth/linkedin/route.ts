import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: Empty ID token' }, { status: 401 });
    }

    let uid: string;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (err: any) {
      console.error('Firebase ID token verification failed:', {
        code: err?.code || 'unknown_code',
        name: err?.name || 'Error',
        message: err?.message || 'Verification failed',
      });
      return NextResponse.json(
        { error: `Unauthorized: ${err?.message || 'Invalid ID token'}` },
        { status: 401 }
      );
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID || 'demo_client_id';
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

    // Generate cryptographically random state nonce
    const stateNonce = crypto.randomBytes(32).toString('hex');
    const scope = encodeURIComponent('w_member_social openid profile email');

    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${stateNonce}`;

    const response = NextResponse.json({ url: linkedinAuthUrl });

    // Set Secure, HttpOnly, SameSite=Lax cookies for CSRF protection and verified user session
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('oauth_state', stateNonce, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.cookies.set('oauth_uid', uid, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (globalErr: any) {
    console.error('Unhandled error in /api/auth/linkedin route handler:', {
      name: globalErr?.name || 'UnknownError',
      message: globalErr?.message || 'Unexpected failure',
    });
    return NextResponse.json(
      { error: `Server error initiating LinkedIn authentication: ${globalErr?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
