'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserTopics, createTopic, updateTopic, deleteTopic } from '@/services/firestoreService';
import { Topic } from '@/types';
import { Tag, Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight, Sparkles, Layers } from 'lucide-react';

export default function TopicsPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadTopics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetched = await getUserTopics(user.uid);
      setTopics(fetched);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [user]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !user) return;
    const name = newTopicName.trim();
    const id = `topic_${Date.now()}`;
    const newTopic: Topic = {
      id,
      userId: user.uid,
      name,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createTopic(newTopic);
    setNewTopicName('');
    await loadTopics();
  };

  const handleToggleEnabled = async (topic: Topic) => {
    await updateTopic(topic.id, { enabled: !topic.enabled });
    await loadTopics();
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditingName(topic.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    await updateTopic(id, { name: editingName.trim() });
    setEditingTopicId(null);
    await loadTopics();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this content topic?')) {
      await deleteTopic(id);
      await loadTopics();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Tag className="w-4 h-4" />
            Content Strategy
          </div>
          <h1 className="text-2xl font-bold text-white">Topic Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure target tech topics for automated LinkedIn post research and generation.
          </p>
        </div>

        {/* Add Topic Quick Form */}
        <form onSubmit={handleAddTopic} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new topic (e.g. Next.js)..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newTopicName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </form>
      </div>

      {/* Topics Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Configured Topics ({topics.length})
          </span>
          <span className="text-xs text-slate-400">
            {topics.filter((t) => t.enabled).length} Enabled
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading topics...</div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No topics configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleEnabled(topic)}
                    className="text-slate-400 hover:text-white transition"
                    title={topic.enabled ? 'Disable topic' : 'Enable topic'}
                  >
                    {topic.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>

                  {editingTopicId === topic.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-3 py-1 bg-slate-950 border border-blue-500 rounded-lg text-sm text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(topic.id)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingTopicId(null)}
                        className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${topic.enabled ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {topic.name}
                        </span>
                        {topic.enabled ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Added: {new Date(topic.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(topic)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Edit topic"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
