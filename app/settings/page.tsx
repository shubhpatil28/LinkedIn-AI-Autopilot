'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getUserSettings, saveUserSettings, getLinkedInConnectionClientSafe } from '@/services/firestoreService';
import { UserSettings, LinkedInConnection } from '@/types';
import { Settings, Save, CheckCircle2, Shield, Globe, Clock, Sliders, Linkedin, Sparkles, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    userId: user?.uid || '',
    topics: ['AI', 'Coding', 'JavaScript', 'React', 'Web Development'],
    postsPerDay: 1,
    postingTime: '09:00',
    timezone: 'Asia/Kolkata',
    language: 'English',
    writingStyle: 'Professional & Technical',
    publishingMode: 'Human Approval',
    updatedAt: new Date().toISOString(),
  });
  const [linkedinConnection, setLinkedinConnection] = useState<Omit<LinkedInConnection, 'accessToken'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const [loadedSettings, conn] = await Promise.all([
          getUserSettings(user.uid),
          getLinkedInConnectionClientSafe(user.uid),
        ]);
        setSettings(loadedSettings);
        setLinkedinConnection(conn);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated: UserSettings = {
        ...settings,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      };
      await saveUserSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkedInConnect = () => {
    window.location.href = '/api/auth/linkedin';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Settings className="w-4 h-4" />
            System Configuration
          </div>
          <h1 className="text-2xl font-bold text-white">Application Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure automation behavior, publishing modes, timezone, and official LinkedIn OAuth integration.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved
          </div>
        )}
      </div>

      {/* LinkedIn OAuth Connection Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500 border border-blue-500/20">
              <Linkedin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Official LinkedIn Integration</h3>
              <p className="text-xs text-slate-400">Member OAuth 2.0 Authorization Flow (`w_member_social` permission)</p>
            </div>
          </div>

          <div>
            {linkedinConnection ? (
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected ({linkedinConnection.memberName || 'Profile Active'})
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400 max-w-xl">
            Connect your personal LinkedIn account using official OAuth. No browser automation or password sharing. Your secrets remain strictly server-side.
          </p>
          <button
            onClick={handleLinkedInConnect}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/25 shrink-0"
          >
            <Linkedin className="w-4 h-4" />
            {linkedinConnection ? 'Reconnect LinkedIn Account' : 'Connect LinkedIn Profile'}
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Automation & Content Parameters</h3>
          <p className="text-xs text-slate-400">Adjust how AI generates and schedules content for your profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Publishing Mode */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Publishing Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 border rounded-xl cursor-pointer transition flex items-start gap-3 ${
                  settings.publishingMode === 'Human Approval'
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="publishingMode"
                  value="Human Approval"
                  checked={settings.publishingMode === 'Human Approval'}
                  onChange={() => setSettings({ ...settings, publishingMode: 'Human Approval' })}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-sm block text-white">Human Approval Mode (Default)</span>
                  <p className="text-xs text-slate-400 mt-1">
                    AI drafts content for your preview. Posts require manual user approval before being queued for LinkedIn publishing.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 border rounded-xl cursor-pointer transition flex items-start gap-3 ${
                  settings.publishingMode === 'Full Auto'
                    ? 'bg-purple-600/10 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="publishingMode"
                  value="Full Auto"
                  checked={settings.publishingMode === 'Full Auto'}
                  onChange={() => setSettings({ ...settings, publishingMode: 'Full Auto' })}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-semibold text-sm block text-white">Full Auto Mode</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated Topic Selection → Research → AI Gen → Visual Gen → Quality Check → Schedule → Auto Publish.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Posts per day */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Posts Per Day</label>
            <input
              type="number"
              min={1}
              max={5}
              value={settings.postsPerDay}
              onChange={(e) => setSettings({ ...settings, postsPerDay: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Posting Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Preferred Posting Time</label>
            <input
              type="time"
              value={settings.postingTime}
              onChange={(e) => setSettings({ ...settings, postingTime: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - Default)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Content Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="German">German</option>
              <option value="French">French</option>
            </select>
          </div>

          {/* Writing Style */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">AI Writing Style</label>
            <input
              type="text"
              value={settings.writingStyle}
              onChange={(e) => setSettings({ ...settings, writingStyle: e.target.value })}
              placeholder="e.g. Professional & Technical, Educational, Thought Leadership..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
