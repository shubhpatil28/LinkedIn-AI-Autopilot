import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID || 'demo_client_id';
  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

  const scope = encodeURIComponent('w_member_social openid profile email');
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&state=linkedin_auth_state`;

  return NextResponse.redirect(linkedinAuthUrl);
}
