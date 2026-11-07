'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CreatorNewsletterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(p);
        const { data: subs } = await supabase.from('newsletter_subscribers').select('*').eq('owner_id', u.id).order('created_at', { ascending: false });
        setSubscribers(subs || []);
      }
      setLoaded(true);
    }
    load();
  }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function copyLink() {
    const url = `${window.location.origin}/newsletter/${user.id}`;
    navigator.clipboard.writeText(url);
    flash('📋 Newsletter Link copied!');
  }

  function exportCSV() {
    if (subscribers.length === 0) return flash('No subscribers yet.');
    const headers = ['Name', 'Email', 'Subscribed Date'];
    const rows = [headers.join(',')];
    subscribers.forEach(s => {
      rows.push([`"${s.name || ''}"`, s.email, new Date(s.created_at).toLocaleDateString()].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my_newsletter_subscribers.csv';
    link.click();
    flash('📊 CSV Downloaded!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!user) return <p className="text-center p-10">Please log in to access your dashboard.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📧 My Newsletter</h1>
        <p className="text-xs text-gray-500">Build your audience and export their details.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-forest-400 bg-forest-50">
        <p className="text-sm font-extrabold text-forest-900">1. Your Public Signup Link</p>
        <p className="text-xs text-gray-600">Share this link on WhatsApp, Facebook, or your bio. When farmers click it, they join your list.</p>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-forest-200">
          <p className="text-[10px] font-mono text-forest-700 truncate flex-1">/newsletter/{user.id}</p>
          <button onClick={copyLink} className="bg-forest-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Copy Link</button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-forest-800">2. Your Subscribers ({subscribers.length})</p>
            <p className="text-[10px] text-gray-500">Download your list to send via Mailchimp or Brevo.</p>
          </div>
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">
            📥 Export CSV
          </button>
        </div>

        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
          {subscribers.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-xs">
              <div>
                <p className="font-bold text-forest-800">{s.name || 'Anonymous Farmer'}</p>
                <p className="text-gray-500">{s.email}</p>
              </div>
              <p className="text-[9px] text-gray-400">{new Date(s.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {subscribers.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No subscribers yet. Share your link!</p>
          )}
        </div>
      </div>

      <div className="text-center mt-4">
        <Link href="/profile" className="text-xs font-bold text-forest-600 hover:underline">← Back to Profile</Link>
      </div>
    </div>
  );
}