'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserContent, updateContentItem, deleteContentItem } from '@/services/firestoreService';
import { ContentItem, ContentStatus } from '@/types';
import { Calendar as CalendarIcon, Clock, Edit3, Trash2, CheckCircle2, AlertCircle, FileText, X, Sparkles, Filter, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useAuth();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ContentStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Edit schedule state
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [editHook, setEditHook] = useState('');
  const [editBody, setEditBody] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await getUserContent(user.uid);
      setContentList(items);
    } catch (err) {
      console.error('Failed to load content for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredContent = contentList.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  const handleStartEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditHook(item.hook);
    setEditBody(item.body);
    // Format date for datetime-local input
    const dateObj = item.scheduledAt ? new Date(item.scheduledAt) : new Date(Date.now() + 86400000);
    const isoLocal = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduleDateTime(isoLocal);
  };

  const handleSaveSchedule = async () => {
    if (!editingItem) return;
    const newScheduledAt = scheduleDateTime ? new Date(scheduleDateTime).toISOString() : editingItem.scheduledAt;
    await updateContentItem(editingItem.id, {
      hook: editHook,
      body: editBody,
      scheduledAt: newScheduledAt,
      status: editingItem.status === 'DRAFT' ? 'SCHEDULED' : editingItem.status,
      updatedAt: new Date().toISOString(),
    });
    setEditingItem(null);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item from calendar schedule?')) {
      await deleteContentItem(id);
      await loadData();
    }
  };

  const tabs: { label: string; value: ContentStatus | 'ALL'; count: number }[] = [
    { label: 'All Posts', value: 'ALL', count: contentList.length },
    { label: 'Draft', value: 'DRAFT', count: contentList.filter((i) => i.status === 'DRAFT').length },
    { label: 'Approved', value: 'APPROVED', count: contentList.filter((i) => i.status === 'APPROVED').length },
    { label: 'Scheduled', value: 'SCHEDULED', count: contentList.filter((i) => i.status === 'SCHEDULED').length },
    { label: 'Published', value: 'PUBLISHED', count: contentList.filter((i) => i.status === 'PUBLISHED').length },
    { label: 'Failed', value: 'FAILED', count: contentList.filter((i) => i.status === 'FAILED').length },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            Scheduling Overview
          </div>
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, schedule, edit time slots, and monitor published LinkedIn posts.
          </p>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Calendar Items List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading calendar items...</div>
      ) : filteredContent.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <CalendarIcon className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm font-medium">No posts found under status filter "{activeTab}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Topic / Status Badge Icon */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-blue-400 bg-blue-600/10 px-2.5 py-0.5 rounded-md">
                      {item.topic}
                    </span>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
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

                    {item.scheduledAt && (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.scheduledAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{item.hook}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.body}</p>

                  {item.failureReason && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-2">
                      Failure Reason: {item.failureReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <button
                  onClick={() => handleStartEdit(item)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Schedule
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete scheduled post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Scheduled Post</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hook Title</label>
                <input
                  type="text"
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Post Body</label>
                <textarea
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
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
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 shadow-lg shadow-purple-600/20"
              >
                Save Schedule Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
