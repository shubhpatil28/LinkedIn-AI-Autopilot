import { ContentItem, LinkedInConnection } from '@/types';
import { sanitizePostContent } from '@/services/aiService';
import { runQualityCheck } from '@/services/qualityCheckService';
import { generateTopicVisualSvg } from '@/services/visualService';
import { convertSvgToPngBuffer } from '@/services/serverVisualService';

export interface LinkedInPublishResult {
  success: boolean;
  linkedinPostId?: string;
  imageUrn?: string;
  errorReason?: string;
}

export interface PublishOptions {
  allowTextFallback?: boolean;
}

export interface UploadImageResult {
  success: boolean;
  imageUrn?: string;
  errorReason?: string;
}

/**
 * Executes LinkedIn's official 3-step image upload flow:
 * 1. Initialize Image Upload (`POST /rest/images?action=initializeUpload`)
 * 2. Upload binary PNG buffer (`PUT <uploadUrl>`)
 * 3. Return registered image URN (`urn:li:image:...`)
 */
export async function uploadLinkedInImage(
  pngBuffer: Buffer,
  connection: LinkedInConnection,
  title?: string
): Promise<UploadImageResult> {
  try {
    const personUrn = connection.memberId.startsWith('urn:li:person:')
      ? connection.memberId
      : `urn:li:person:${connection.memberId}`;

    // Step 1: Initialize Upload
    const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202609',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: personUrn,
        },
      }),
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error(`[LinkedIn API] Image initializeUpload failed (${initRes.status}): ${errText}`);
      return {
        success: false,
        errorReason: `LinkedIn image upload initialization failed (${initRes.status}): ${errText.substring(0, 200)}`,
      };
    }

    const initData = await initRes.json();
    const uploadUrl = initData?.value?.uploadUrl;
    const imageUrn = initData?.value?.image;

    if (!uploadUrl || !imageUrn) {
      console.error('[LinkedIn API] Image initializeUpload response missing uploadUrl or image URN:', initData);
      return {
        success: false,
        errorReason: 'LinkedIn API response missing uploadUrl or image URN.',
      };
    }

    // Step 2: PUT binary PNG buffer to uploadUrl
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'image/png',
      },
      body: new Uint8Array(pngBuffer),
    });

    if (!uploadRes.ok && uploadRes.status !== 201 && uploadRes.status !== 204) {
      const uploadErrText = await uploadRes.text();
      console.error(`[LinkedIn API] Binary image PUT failed (${uploadRes.status}): ${uploadErrText}`);
      return {
        success: false,
        errorReason: `LinkedIn binary image upload PUT failed (${uploadRes.status}): ${uploadErrText.substring(0, 200)}`,
      };
    }

    return {
      success: true,
      imageUrn,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown image upload exception';
    console.error('[LinkedIn API] Image upload exception:', msg);
    return {
      success: false,
      errorReason: `Exception uploading image to LinkedIn API: ${msg}`,
    };
  }
}

export async function publishToLinkedIn(
  content: ContentItem,
  connection: LinkedInConnection | null,
  options: PublishOptions = {}
): Promise<LinkedInPublishResult> {
  // Idempotency check: if already published, return existing ID
  if (content.status === 'PUBLISHED' && content.linkedinPostId) {
    return {
      success: true,
      linkedinPostId: content.linkedinPostId,
    };
  }

  // Strict connection validation — no fallbacks, no fake IDs
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

  // Pre-publish sanitization & quality check guardrail
  const sanitized = sanitizePostContent({
    hook: content.hook,
    body: content.body,
    cta: content.cta,
    hashtags: content.hashtags,
  });

  const sanitizedContent: ContentItem = {
    ...content,
    hook: sanitized.hook,
    body: sanitized.body,
    cta: sanitized.cta,
    hashtags: sanitized.hashtags,
  };

  const qualityCheck = runQualityCheck(sanitizedContent);
  if (!qualityCheck.passed) {
    return {
      success: false,
      errorReason: qualityCheck.reason || 'Failed pre-publishing quality check guardrail.',
    };
  }

  const personUrn = connection.memberId.startsWith('urn:li:person:')
    ? connection.memberId
    : `urn:li:person:${connection.memberId}`;

  // Image Generation & Upload Workflow
  let imageUrn: string | undefined = undefined;

  if (content.imageUrl) {
    try {
      let pngBuffer: Buffer;
      if (content.imageUrl.startsWith('data:image/svg+xml') || content.imageUrl.includes('<svg')) {
        pngBuffer = await convertSvgToPngBuffer(content.imageUrl);
      } else {
        const svg = generateTopicVisualSvg(content.topic, content.hook);
        pngBuffer = await convertSvgToPngBuffer(svg);
      }

      const uploadResult = await uploadLinkedInImage(pngBuffer, connection, content.hook);

      if (uploadResult.success && uploadResult.imageUrn) {
        imageUrn = uploadResult.imageUrn;
      } else {
        const err = uploadResult.errorReason || 'Image upload to LinkedIn failed';
        console.warn(`[LinkedIn API] Image upload failed for post ${content.id}: ${err}`);

        if (!options.allowTextFallback) {
          return {
            success: false,
            errorReason: `Post failed due to required image attachment failure: ${err}`,
          };
        }
      }
    } catch (imgErr: unknown) {
      const msg = imgErr instanceof Error ? imgErr.message : 'Unknown rasterization error';
      console.error(`[LinkedIn API] SVG rasterization error for post ${content.id}:`, msg);

      if (!options.allowTextFallback) {
        return {
          success: false,
          errorReason: `Post failed due to SVG rasterization error: ${msg}`,
        };
      }
    }
  }

  // Construct full post text according to required structure: Hook + Body + CTA + Hashtags
  const fullPostText = `${sanitizedContent.hook}\n\n${sanitizedContent.body}\n\n${sanitizedContent.cta}\n\n${sanitizedContent.hashtags.join(' ')}`;

  try {
    // Official LinkedIn REST Posts API endpoint (POST https://api.linkedin.com/rest/posts)
    const postPayload: Record<string, unknown> = {
      author: personUrn,
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

    if (imageUrn) {
      postPayload.content = {
        media: {
          id: imageUrn,
          title: sanitizedContent.hook.substring(0, 100),
        },
      };
    }

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
        console.warn('[LinkedIn API] Success response but no post ID found in headers or body');
        return {
          success: false,
          errorReason: 'LinkedIn API did not return a verifiable post ID. Post may have been published but cannot be confirmed.',
        };
      }

      return {
        success: true,
        linkedinPostId,
        imageUrn,
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
