'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [nativeScript, setNativeScript] = useState('');
  const [pushScript, setPushScript] = useState('');
  const [bannerScript, setBannerScript] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).single();
      if (data) {
        setNativeScript(data.adsterra_native_script ?? '');
        setPushScript(data.adsterra_push_script ?? '');
        setBannerScript(data.adsterra_banner_script ?? '');
        setAnnouncement(data.site_announcement ?? '');
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await supabase
      .from('admin_settings')
      .update({
        adsterra_native_script: nativeScript,
        adsterra_push_script: pushScript,
        adsterra_banner_script: bannerScript,
        site_announcement: announcement,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white">Settings & Ad Codes</h1>
        <p className="text-sm text-forest-400 mt-1">
          Paste your Adsterra scripts here — no code deploy needed. Changes go live instantly.
        </p>
      </div>

      <div className="glass-card p-5 space-y-2">
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100">
          Adsterra Native Banner Script
        </label>
        <p className="text-xs text-forest-400">Displayed at the top of the home feed.</p>
        <textarea
          value={nativeScript}
          onChange={(e) => setNativeScript(e.target.value)}
          rows={5}
          placeholder="<script async data-cfasync='false' src='//pl000000.highperformanceformat.com/...'></script>"
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <div className="glass-card p-5 space-y-2">
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100">
          Adsterra Banner Script
        </label>
        <p className="text-xs text-forest-400">Displayed above the bottom navigation bar.</p>
        <textarea
          value={bannerScript}
          onChange={(e) => setBannerScript(e.target.value)}
          rows={5}
          placeholder="<script type='text/javascript' src='//pl000000....js'></script>"
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <div className="glass-card p-5 space-y-2">
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100">
          Adsterra Push Notification Script
        </label>
        <p className="text-xs text-forest-400">Loaded once, site-wide (all pages).</p>
        <textarea
          value={pushScript}
          onChange={(e) => setPushScript(e.target.value)}
          rows={5}
          placeholder="<script src='//pl000000....js'></script>"
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <div className="glass-card p-5 space-y-2">
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100">
          Site-wide Announcement Banner (optional)
        </label>
        <input
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="e.g. New: Fish Farming course now live! 🐟"
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto sm:px-10">
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
