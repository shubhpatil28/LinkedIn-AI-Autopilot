import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { LinkedInConnection } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateQuery = searchParams.get('state');
  const error = searchParams.get('error');

  // Read cookies for OAuth state and verified user identity
  const storedState = req.cookies.get('oauth_state')?.value;
  const storedUid = req.cookies.get('oauth_uid')?.value;

  // 1. Check for LinkedIn OAuth error or missing code
  if (error || !code) {
    console.warn('LinkedIn OAuth declined or missing code:', error);
    const res = NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', req.url));
    res.cookies.delete('oauth_state');
    res.cookies.delete('oauth_uid');
    return res;
  }

  // 2. Validate state cookie exists and matches query parameter (CSRF protection)
  if (!storedState || !stateQuery) {
    console.error('LinkedIn OAuth CSRF error: missing state cookie or query parameter');
    return NextResponse.json(
      { error: 'Unauthorized: Missing OAuth state token' },
      { status: 401 }
    );
  }

  // Timing-safe comparison to prevent timing attacks
  const stateBufferA = Buffer.from(stateQuery);
  const stateBufferB = Buffer.from(storedState);
  const statesMatch =
    stateBufferA.length === stateBufferB.length &&
    crypto.timingSafeEqual(stateBufferA, stateBufferB);

  if (!statesMatch) {
    console.error('LinkedIn OAuth CSRF error: state mismatch');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid OAuth state token' },
      { status: 401 }
    );
  }

  // 3. Validate user identity from stored cookie (never trust query param)
  if (!storedUid) {
    console.error('LinkedIn OAuth error: missing authenticated user session cookie');
    return NextResponse.json(
      { error: 'Unauthorized: Missing authenticated user session' },
      { status: 401 }
    );
  }

  // FIX #4: Fail clearly if production environment variables are missing
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('LinkedIn OAuth environment variables missing:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
    });
    const res = NextResponse.redirect(new URL('/settings?error=linkedin_server_config', req.url));
    res.cookies.delete('oauth_state');
    res.cookies.delete('oauth_uid');
    return res;
  }

  try {
    // 4. Exchange authorization code for LinkedIn tokens
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('LinkedIn Token Exchange failed:', { status: tokenRes.status, body: errText.substring(0, 300) });
      const res = NextResponse.redirect(new URL('/settings?error=linkedin_token_exchange_failed', req.url));
      res.cookies.delete('oauth_state');
      res.cookies.delete('oauth_uid');
      return res;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    const expiresIn = tokenData?.expires_in || 5184000; // 60 days default

    // FIX #4: Fail if no real access token received
    if (!accessToken) {
      console.error('LinkedIn token exchange succeeded but no access_token in response');
      const res = NextResponse.redirect(new URL('/settings?error=linkedin_token_missing', req.url));
      res.cookies.delete('oauth_state');
      res.cookies.delete('oauth_uid');
      return res;
    }

    // 5. Fetch LinkedIn user profile info — fail if profile cannot be fetched
    let memberId: string | null = null;
    let memberName = 'LinkedIn User';

    try {
      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.sub) {
          memberId = `urn:li:person:${profile.sub}`;
          memberName = profile.name || profile.given_name || 'LinkedIn User';
        }
      } else {
        console.warn('LinkedIn profile fetch failed:', { status: profileRes.status });
      }
    } catch (pErr) {
      console.warn('Could not fetch LinkedIn userinfo:', pErr);
    }

    // FIX #4: Fail if memberId could not be resolved
    if (!memberId) {
      console.error('Could not resolve LinkedIn member ID from profile API');
      const res = NextResponse.redirect(new URL('/settings?error=linkedin_profile_failed', req.url));
      res.cookies.delete('oauth_state');
      res.cookies.delete('oauth_uid');
      return res;
    }

    const connection: LinkedInConnection = {
      userId: storedUid,
      memberId,
      memberName,
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Use Firebase Admin SDK on the server-side callback to persist linkedin_connections
    await adminDb.collection('linkedin_connections').doc(storedUid).set(connection);

    // 7. Return redirect response and clear OAuth cookies
    const response = NextResponse.redirect(new URL('/settings?connected=true', req.url));
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_uid');

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('LinkedIn OAuth processing error:', message);
    const response = NextResponse.redirect(
      new URL('/settings?error=linkedin_server_error', req.url)
    );
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_uid');
    return response;
  }
}
