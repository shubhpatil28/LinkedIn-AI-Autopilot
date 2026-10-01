'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserContent, getUserTopics, getUserSettings, saveContentItem, updateContentItem, deleteContentItem } from '@/services/firestoreService';
import { performTopicResearch } from '@/services/researchService';
import { generateLinkedInPostContent } from '@/services/aiService';
import { generateTopicVisual } from '@/services/visualService';
import { ContentItem, Topic, UserSettings } from '@/types';
import { Sparkles, FileText, CheckCircle2, Trash2, Edit3, ExternalLink, Clock, RefreshCw, Layers, Check, X, ShieldAlert } from 'lucide-react';

export default function ContentPage() {
  const { user } = useAuth();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editHook, setEditHook] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editHashtags, setEditHashtags] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [items, userTopics, userSettings] = await Promise.all([
        getUserContent(user.uid),
        getUserTopics(user.uid),
        getUserSettings(user.uid),
      ]);
      setContentList(items);
      const enabledTopics = userTopics.filter((t) => t.enabled);
      setTopics(enabledTopics);
      if (enabledTopics.length > 0 && !selectedTopic) {
        setSelectedTopic(enabledTopics[0].name);
      }
      setSettings(userSettings);
    } catch (err) {
      console.error('Failed to load content data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Main Generation Pipeline
  const handleGenerate = async () => {
    if (!selectedTopic || !user) return;
    setGenerating(true);
    try {
      const topicObj = topics.find((t) => t.name === selectedTopic);
      const topicId = topicObj ? topicObj.id : `topic_${Date.now()}`;

      // Step 1: Topic Research
      const research = await performTopicResearch(selectedTopic);

      // Step 2: AI Content Generation
      const postContent = await generateLinkedInPostContent(
        selectedTopic,
        research,
        settings?.writingStyle || 'Professional & Technical',
        settings?.language || 'English'
      );

      // Step 3: Visual Generation
      const imageUrl = await generateTopicVisual(selectedTopic, postContent.hook);

      // Default schedule time: tomorrow at configured posting time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = (settings?.postingTime || '09:00').split(':');
      tomorrow.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Check Mode
      const isFullAuto = settings?.publishingMode === 'Full Auto';
      const initialStatus = isFullAuto ? 'SCHEDULED' : 'DRAFT';

      const newItem: ContentItem = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: user.uid,
        topicId,
        topic: selectedTopic,
        hook: postContent.hook,
        body: postContent.body,
        cta: postContent.cta,
        hashtags: postContent.hashtags,
        imageUrl,
        sourceUrls: research.sourceUrls,
        status: initialStatus,
        scheduledAt: tomorrow.toISOString(),
        publishedAt: null,
        linkedinPostId: null,
        failureReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveContentItem(newItem);
      await loadData();
    } catch (err) {
      console.error('Generation error:', err);
      alert('Content generation failed. Please check your network or configuration.');
    } finally {
      setGenerating(false);
    }
  };

  // Actions
  const handleApprove = async (item: ContentItem) => {
    await updateContentItem(item.id, {
      status: 'APPROVED',
      updatedAt: new Date().toISOString(),
    });
    await loadData();
  };

  const handleSchedule = async (item: ContentItem) => {
    const defaultTime = item.scheduledAt || new Date(Date.now() + 86400000).toISOString();
    await updateContentItem(item.id, {
      status: 'SCHEDULED',
      scheduledAt: defaultTime,
      updatedAt: new Date().toISOString(),
    });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this generated content preview?')) {
      await deleteContentItem(id);
      await loadData();
    }
  };

  const startEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditHook(item.hook);
    setEditBody(item.body);
    setEditCta(item.cta);
    setEditHashtags(item.hashtags.join(' '));
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const hashtagArr = editHashtags
      .split(/\s+/)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))
      .filter((h) => h.length > 1);

    await updateContentItem(editingItem.id, {
      hook: editHook,
      body: editBody,
      cta: editCta,
      hashtags: hashtagArr,
      updatedAt: new Date().toISOString(),
    });
    setEditingItem(null);
    await loadData();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & Generator Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            AI Content Pipeline
          </div>
          <h1 className="text-2xl font-bold text-white">Content Preview & Studio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Mode: <span className="text-slate-200 font-semibold">{settings?.publishingMode || 'Human Approval'}</span> — Review, edit, and approve AI-generated technical posts.
          </p>
        </div>

        {/* Generator Controls */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 border border-slate-800 rounded-xl">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.name}>
                Topic: {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating || topics.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-600/25 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Researching & Generating...' : 'Generate Post'}
          </button>
        </div>
      </div>

      {/* Content List & Preview Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading generated content...</div>
      ) : contentList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-lg font-semibold text-white">No content generated yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Select an enabled topic above and click "Generate Post" to trigger real-time research, AI copy generation, and topic visual creation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {contentList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 transition hover:border-slate-700 space-y-4"
            >
              {/* Card Top Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg">
                    {item.topic}
                  </span>
                  <span className="text-xs text-slate-400">
                    Created: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.status === 'SCHEDULED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : item.status === 'APPROVED'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : item.status === 'FAILED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Main Content Layout: Text Preview + Image Visual */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-4">
                  {/* Hook */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hook</span>
                    <h3 className="text-base font-bold text-white leading-snug">{item.hook}</h3>
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Main Content</span>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      {item.body}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Call To Action</span>
                    <p className="text-xs text-blue-300 italic bg-blue-950/20 border border-blue-900/30 p-2.5 rounded-lg">
                      💬 {item.cta}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.hashtags.map((h, i) => (
                      <span key={i} className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded-md">
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Research Source URLs */}
                  {item.sourceUrls && item.sourceUrls.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400 font-medium">Research Sources:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.sourceUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {new URL(url).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Image Preview */}
                <div className="md:col-span-5 flex flex-col space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Generated Visual</span>
                  <div className="relative aspect-[1200/630] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
                    <img src={item.imageUrl} alt="Generated Visual" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.status !== 'APPROVED' && item.status !== 'SCHEDULED' && item.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}

                  {item.status !== 'SCHEDULED' && item.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handleSchedule(item)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Schedule Post
                    </button>
                  )}

                  <button
                    onClick={() => startEdit(item)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete post preview"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Generated Post</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hook</label>
                <input
                  type="text"
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Main Content (Body)</label>
                <textarea
                  rows={6}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Call To Action (CTA)</label>
                <input
                  type="text"
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hashtags</label>
                <input
                  type="text"
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
