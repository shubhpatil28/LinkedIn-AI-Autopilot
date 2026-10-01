'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserContent, getUserSettings } from '@/services/firestoreService';
import { ContentItem, UserSettings } from '@/types';
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [items, userSettings] = await Promise.all([
          getUserContent(user.uid),
          getUserSettings(user.uid),
        ]);
        setContent(items);
        setSettings(userSettings);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Today's Post
  const todaysPost = content.find((item) => {
    if (item.publishedAt && item.publishedAt.startsWith(todayStr)) return true;
    if (item.scheduledAt && item.scheduledAt.startsWith(todayStr)) return true;
    return false;
  }) || null;

  // 2. Next Scheduled Post
  const upcomingScheduled = content
    .filter((item) => item.status === 'SCHEDULED' && item.scheduledAt && new Date(item.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
  const nextScheduledPost = upcomingScheduled[0] || null;

  // 3. Metrics Counts
  const draftedCount = content.filter((item) => item.status === 'DRAFT').length;
  const scheduledCount = content.filter((item) => item.status === 'SCHEDULED').length;
  const publishedCount = content.filter((item) => item.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            LinkedIn Content Dashboard
          </div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Mode: <span className="text-slate-200 font-semibold">{settings?.publishingMode || 'Human Approval'}</span> | Timezone: <span className="text-slate-200 font-semibold">{settings?.timezone || 'Asia/Kolkata'}</span>
          </p>
        </div>
        <Link
          href="/content"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Post
        </Link>
      </div>

      {/* Metrics Row: 3 key counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Drafted Posts</span>
            <div className="p-2 bg-slate-800/80 rounded-lg text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{draftedCount}</div>
          <p className="text-xs text-slate-400">Posts awaiting preview or review</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Scheduled Posts</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400">{scheduledCount}</div>
          <p className="text-xs text-slate-400">Ready for automated Vercel Cron publishing</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Published Posts</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{publishedCount}</div>
          <p className="text-xs text-slate-400">Successfully published to LinkedIn</p>
        </div>
      </div>

      {/* Two Main Cards: Today's Post & Next Scheduled Post */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Post Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="w-4 h-4 text-blue-400" />
              Today's Post
            </div>
            {todaysPost ? (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                todaysPost.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                todaysPost.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-300'
              }`}>
                {todaysPost.status}
              </span>
            ) : (
              <span className="text-xs text-slate-400">No post today</span>
            )}
          </div>

          {todaysPost ? (
            <div className="space-y-3 flex-1">
              <div className="inline-block px-2 py-0.5 bg-blue-600/10 text-blue-400 text-xs font-medium rounded-md">
                Topic: {todaysPost.topic}
              </div>
              <h3 className="font-semibold text-slate-100 text-base line-clamp-2">{todaysPost.hook}</h3>
              <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{todaysPost.body}</p>
              {todaysPost.imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img src={todaysPost.imageUrl} alt="Today visual" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="text-sm">No post assigned or scheduled for today.</p>
              <Link
                href="/content"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Generate content now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {todaysPost && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <Link
                href="/content"
                className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1"
              >
                View in Content <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Next Scheduled Post Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="w-4 h-4 text-purple-400" />
              Next Scheduled Post
            </div>
            {nextScheduledPost ? (
              <span className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-medium">
                {new Date(nextScheduledPost.scheduledAt!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-xs text-slate-400">None queued</span>
            )}
          </div>

          {nextScheduledPost ? (
            <div className="space-y-3 flex-1">
              <div className="inline-block px-2 py-0.5 bg-purple-600/10 text-purple-400 text-xs font-medium rounded-md">
                Topic: {nextScheduledPost.topic}
              </div>
              <h3 className="font-semibold text-slate-100 text-base line-clamp-2">{nextScheduledPost.hook}</h3>
              <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{nextScheduledPost.body}</p>
              {nextScheduledPost.imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img src={nextScheduledPost.imageUrl} alt="Scheduled visual" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="text-sm">There are no upcoming scheduled posts in the queue.</p>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300"
              >
                Go to Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {nextScheduledPost && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <Link
                href="/calendar"
                className="text-xs font-medium text-purple-400 hover:underline flex items-center gap-1"
              >
                View in Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
