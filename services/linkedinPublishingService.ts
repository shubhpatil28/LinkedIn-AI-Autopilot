import { ContentItem, LinkedInConnection } from '@/types';

export interface LinkedInPublishResult {
  success: boolean;
  linkedinPostId?: string;
  errorReason?: string;
}

export async function publishToLinkedIn(
  content: ContentItem,
  connection: LinkedInConnection | null
): Promise<LinkedInPublishResult> {
  // Idempotency check: if already published, return existing ID
  if (content.status === 'PUBLISHED' && content.linkedinPostId) {
    return {
      success: true,
      linkedinPostId: content.linkedinPostId,
    };
  }

  // FIX #2: Strict connection validation — no fallbacks, no fake IDs

  if (!connection) {
    return {
      success: false,
      errorReason: 'LinkedIn is not connected. Connect LinkedIn in Settings before publishing.',
    };
  }

  if (!connection.accessToken) {
    return {
      success: false,
      errorReason: 'LinkedIn OAuth access token is missing. Reconnect LinkedIn in Settings.',
    };
  }

  if (connection.accessToken.includes('mock') || connection.accessToken.includes('demo')) {
    return {
      success: false,
      errorReason: 'LinkedIn OAuth access token is a mock/demo token. Reconnect LinkedIn with a real account.',
    };
  }

  if (
    !connection.memberId ||
    connection.memberId.includes('demo') ||
    connection.memberId === ''
  ) {
    return {
      success: false,
      errorReason: 'LinkedIn member ID is missing or invalid. Reconnect LinkedIn in Settings.',
    };
  }

  // Construct full post text according to required structure: Hook + Body + CTA + Hashtags
  const fullPostText = `${content.hook}\n\n${content.body}\n\n${content.cta}\n\n${content.hashtags.join(' ')}`;

  try {
    // Official LinkedIn REST Posts API endpoint (POST https://api.linkedin.com/rest/posts)
    const postPayload = {
      author: connection.memberId,
      commentary: fullPostText,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202609',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postPayload),
    });

    if (response.ok || response.status === 201) {
      const headerPostId = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id');
      let bodyPostId: string | null = null;
      try {
        if (response.headers.get('content-type')?.includes('json')) {
          const resBody = await response.json();
          bodyPostId = resBody?.id || null;
        }
      } catch {
        // Response body may be empty on 201, which is normal
      }

      const linkedinPostId = headerPostId || bodyPostId;

      if (!linkedinPostId) {
        // LinkedIn 201 with no post ID — prevent fake publishing
        console.warn('[LinkedIn API] Success response but no post ID found in headers or body');
        return {
          success: false,
          errorReason: 'LinkedIn API did not return a verifiable post ID. Post may have been published but cannot be confirmed.',
        };
      }

      return {
        success: true,
        linkedinPostId: linkedinPostId,
      };
    } else {
      const errorText = await response.text();
      console.error(`[LinkedIn API] Error response: status=${response.status} body=${errorText.substring(0, 500)}`);
      return {
        success: false,
        errorReason: `LinkedIn REST API error (${response.status}): ${errorText.substring(0, 200)}`,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network error';
    console.error('[LinkedIn API] Network/fetch error:', message);
    return {
      success: false,
      errorReason: `Network failure communicating with LinkedIn REST API: ${message}`,
    };
  }
}
