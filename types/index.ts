export type ContentStatus = 'DRAFT' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export type PublishingMode = 'Human Approval' | 'Full Auto';

export type VisualStyle =
  | 'premium_3d'
  | 'modern_editorial'
  | 'isometric_tech'
  | 'futuristic_ai'
  | 'code_developer'
  | 'data_visualization';

export interface Topic {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  userId: string;
  topicId: string;
  topic: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  imageUrl: string;
  sourceUrls: string[];
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  linkedinPostId: string | null;
  failureReason?: string | null;
  /** Idempotency key set during Full Auto generation to prevent duplicate posts on concurrent cron runs */
  generationRunId?: string | null;
  /** Visual engine style & template metadata for diverse rotation */
  visualStyle?: VisualStyle | string;
  visualTemplate?: string;
  /** Granular timing diagnostics to measure publishing latency and cron execution variance */
  publishTiming?: {
    cronStartedAt?: string;
    postScheduledAt?: string | null;
    publishAttemptStartedAt?: string;
    linkedInApiResponseReceivedAt?: string;
    publishedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  topics: string[];
  postsPerDay: number;
  postingTime: string;
  timezone: string;
  language: string;
  writingStyle: string;
  publishingMode: PublishingMode;
  /** Persistent cursor for round-robin topic rotation in Full Auto mode */
  lastTopicIndex?: number;
  updatedAt: string;
}

export interface LinkedInConnection {
  userId: string;
  memberId: string;
  memberName: string;
  accessToken: string;
  expiresAt: string;
  updatedAt: string;
}

export interface QualityCheckResult {
  passed: boolean;
  reason?: string;
}

export interface DashboardMetrics {
  todaysPost: ContentItem | null;
  nextScheduledPost: ContentItem | null;
  draftedCount: number;
  scheduledCount: number;
  publishedCount: number;
}
