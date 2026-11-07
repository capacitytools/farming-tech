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

  // Composer State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');

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

  function generateEmailHTML() {
    if (!subject || !message) return flash('Please add a subject and message.');
    
    // 🚨 THE AD INJECTION HERE 🚨
    const adCode = `<div style="text-align:center; margin: 20px 0; padding: 15px; border: 1px dashed #ccc; background: #f9f9f9;">
      <p style="font-size:10px; color:#888; margin:0 0 5px 0;">Advertisement</p>
      <a href="https://www.farmingtechbusiness.com" target="_blank">
        <img src="https://res.cloudinary.com/jnvtguiz/image/upload/v1/ads/newsletter_ad.jpg" alt="Farming Tech Ad" style="max-width:100%; border-radius:8px;" />
      </a>
      <p style="font-size:11px; margin-top:5px;"><a href="https://www.farmingtechbusiness.com/ebooks" style="color:#166534; font-weight:bold; text-decoration:none;">📚 Get the Best Farming E-books Here</a></p>
    </div>`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333;">
      <div style="background: #166534; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 20px;">${profile?.full_name || 'Farming Tech'} Newsletter</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #166534; font-size: 18px;">${subject}</h2>
        <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        
        ${adCode}
        
        <p style="font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          You are receiving this email because you subscribed to ${profile?.full_name || 'this farmer'}. 
          <br/><br/>
          Sent via <a href="https://www.farmingtechbusiness.com" style="color: #166534; font-weight: bold; text-decoration: none;">Farming Tech & Business</a>.
        </p>
      </div>
    </div>`;

    setHtmlPreview(html);
    flash('✅ HTML Generated!');
  }

  function copyEmailHTML() {
    if (!htmlPreview) return;
    navigator.clipboard.writeText(htmlPreview);
    flash('📋 HTML copied! Paste into your email tool.');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!user) return <p className="text-center p-10">Please log in to access your dashboard.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">📧 My Newsletter Studio</h1>
        <p className="text-xs text-gray-500">Build your audience, write your newsletter, and export it.</p>
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
          </div>
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">📥 Export CSV</button>
        </div>
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {subscribers.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-xs">
              <div>
                <p className="font-bold text-forest-800">{s.name || 'Anonymous'}</p>
                <p className="text-gray-500">{s.email}</p>
              </div>
            </div>
          ))}
          {subscribers.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No subscribers yet. Share your link!</p>}
        </div>
      </div>

      {/* 🚨 THE COMPOSER + AD INJECTION 🚨 */}
      <div className="glass-card p-4 rounded-2xl space-y-3 border-2 border-blue-300">
        <p className="text-sm font-extrabold text-blue-800">3. Write Your Newsletter</p>
        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm" placeholder="Subject Line" value={subject} onChange={e => setSubject(e.target.value)} />
        <textarea className="w-full p-2 rounded-xl border border-gray-200 text-sm" rows={6} placeholder="Write your message here..." value={message} onChange={e => setMessage(e.target.value)} />
        
        <button onClick={generateEmailHTML} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold">Generate HTML (With Ad)</button>
        
        {htmlPreview && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-gray-500">HTML Generated!</p>
            <div className="flex gap-2">
               <button onClick={copyEmailHTML} className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">📋 Copy HTML</button>
               <a href="#" onClick={(e) => { e.preventDefault(); const w = window.open('', '_blank'); w?.document.write(htmlPreview); }} className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-xs font-bold text-center">👁️ Preview</a>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        <Link href="/profile" className="text-xs font-bold text-forest-600 hover:underline">← Back to Profile</Link>
      </div>
    </div>
  );
}