import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

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
    } catch (err: unknown) {
      const errObj = err as { code?: string; name?: string; message?: string };
      console.error('Firebase ID token verification failed:', {
        code: errObj?.code || 'unknown_code',
        name: errObj?.name || 'Error',
        message: errObj?.message || 'Verification failed',
      });
      return NextResponse.json(
        { error: `Unauthorized: ${errObj?.message || 'Invalid ID token'}` },
        { status: 401 }
      );
    }

    // FIX #4: Fail clearly if production environment variables are missing
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      console.error('LINKEDIN_CLIENT_ID environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: LinkedIn Client ID is not configured.' },
        { status: 500 }
      );
    }

    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (!redirectUri) {
      console.error('LINKEDIN_REDIRECT_URI environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: LinkedIn Redirect URI is not configured.' },
        { status: 500 }
      );
    }

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
  } catch (globalErr: unknown) {
    const errObj = globalErr as { name?: string; message?: string };
    console.error('Unhandled error in /api/auth/linkedin route handler:', {
      name: errObj?.name || 'UnknownError',
      message: errObj?.message || 'Unexpected failure',
    });
    return NextResponse.json(
      { error: `Server error initiating LinkedIn authentication: ${errObj?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
