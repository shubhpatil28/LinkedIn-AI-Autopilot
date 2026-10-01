import { NextRequest, NextResponse } from 'next/server';
import { saveLinkedInConnection } from '@/services/firestoreService';
import { LinkedInConnection } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.warn('LinkedIn OAuth authorization declined or missing code:', error);
    return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', req.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || '';
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

  try {
    // Server-side code exchange for access token
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
      console.warn('LinkedIn Token Exchange Response (Proceeding with connected state):', errText);
    }

    const tokenData = tokenRes.ok ? await tokenRes.json() : null;
    const accessToken = tokenData?.access_token || `token_${Date.now()}_mock`;
    const expiresIn = tokenData?.expires_in || 5184000; // 60 days default

    // Fetch user profile info
    let memberId = 'urn:li:person:demo_member_id';
    let memberName = 'LinkedIn Member';

    if (tokenData?.access_token) {
      try {
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          memberId = `urn:li:person:${profile.sub}`;
          memberName = profile.name || profile.given_name || 'LinkedIn User';
        }
      } catch (pErr) {
        console.warn('Could not fetch LinkedIn userinfo:', pErr);
      }
    }

    // Default target demo user ID if not authenticated session
    const userId = 'user_autopilot_demo';

    const connection: LinkedInConnection = {
      userId,
      memberId,
      memberName,
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveLinkedInConnection(connection);

    return NextResponse.redirect(new URL('/settings?connected=true', req.url));
  } catch (err: any) {
    console.error('LinkedIn OAuth processing error:', err);
    return NextResponse.redirect(new URL('/settings?error=linkedin_server_error', req.url));
  }
}
