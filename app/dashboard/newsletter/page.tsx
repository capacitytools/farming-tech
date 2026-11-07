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

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [manualEmails, setManualEmails] = useState('');
  const [sendMode, setSendMode] = useState<'saved' | 'manual'>('saved');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(p);
        
        // Only fetch subscribers if they are verified or admin
        if (p?.role === 'admin' || p?.verified === true) {
          const { data: subs } = await supabase.from('newsletter_subscribers').select('*').eq('owner_id', u.id);
          setSubscribers(subs || []);
        }
      }
      setLoaded(true);
    }
    load();
  }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 4000);
  }

  async function handleSend() {
    if (!subject || !message) return flash('Please add a subject and message.');

    let emailsToSend: string[] = [];

    if (sendMode === 'saved') {
      emailsToSend = subscribers.map(s => s.email);
    } else {
      emailsToSend = manualEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
    }

    if (emailsToSend.length === 0) return flash('No valid emails to send to.');
    if (emailsToSend.length > 100) return flash('You cannot send to more than 100 emails at once.');

    if (!window.confirm(`Send to ${emailsToSend.length} farmers?`)) return;
    setSending(true);

    try {
      const res = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          subject,
          message,
          replyTo: replyTo || undefined,
          emails: emailsToSend,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      flash(`🚀 Sent successfully to ${data.count} farmers!`);
      setSubject('');
      setMessage('');
      setManualEmails('');
    } catch (err: any) {
      alert('Send failed: ' + err.message);
    }
    setSending(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!user) return <p className="text-center p-10">Please log in.</p>;

  // 🚨 THE VIP GATE 🚨
  const isAuthorized = profile?.role === 'admin' || profile?.verified === true;

  if (!isAuthorized) {
    return (
      <div className="p-6 pb-24 max-w-md mx-auto text-center mt-10">
        <div className="glass-card p-8 rounded-3xl border-2 border-amber-400 bg-amber-50">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-extrabold text-amber-900 mb-2">VIP Feature</h1>
          <p className="text-sm text-amber-800 mb-6">
            The Newsletter Studio is currently exclusive to Verified Farmers and Admins to protect our email servers from spam.
          </p>
          <Link href="/wallet" className="block bg-amber-500 text-white py-3 rounded-xl font-extrabold shadow-md">
            Get Verified Now →
          </Link>
          <Link href="/profile" className="block mt-3 text-xs font-bold text-amber-700 hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  // ... THE REST OF YOUR CODE (SEND FORM) ...
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">✉️ Send Newsletter</h1>
        <p className="text-xs text-gray-500">Write a message, attach your email, and blast it to your list.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-2 bg-green-50 p-2 rounded-lg">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl border border-gray-100 space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Email (for replies)</label>
        <input 
          type="email" 
          placeholder="e.g., yourname@gmail.com" 
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-forest-500 outline-none" 
          value={replyTo}
          onChange={e => setReplyTo(e.target.value)}
        />
        <p className="text-[9px] text-gray-400">When farmers reply, it will go to this address.</p>
      </div>

      <div className="glass-card p-4 rounded-2xl border border-gray-100 space-y-3">
        <input 
          placeholder="Subject Line *" 
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-forest-500 outline-none" 
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <textarea 
          placeholder="Write your message here... Be helpful and friendly." 
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm h-40 focus:ring-2 focus:ring-forest-500 outline-none resize-none" 
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </div>

      <div className="glass-card p-4 rounded-2xl border border-gray-100 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setSendMode('saved')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${sendMode === 'saved' ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            My List ({subscribers.length})
          </button>
          <button onClick={() => setSendMode('manual')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${sendMode === 'manual' ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Manual Input
          </button>
        </div>

        {sendMode === 'saved' ? (
          <p className="text-xs text-gray-600">Will send to all <strong>{subscribers.length}</strong> subscribers.</p>
        ) : (
          <div>
            <textarea 
              placeholder="Paste emails separated by commas: (e.g., farmer1@gmail.com, farmer2@yahoo.com)" 
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs h-20 focus:ring-2 focus:ring-forest-500 outline-none resize-none" 
              value={manualEmails}
              onChange={e => setManualEmails(e.target.value)}
            />
            <p className="text-[9px] text-gray-400 mt-1">Separate each email with a comma.</p>
          </div>
        )}
      </div>

      <button 
        onClick={handleSend} 
        disabled={sending}
        className="w-full bg-forest-800 text-white py-4 rounded-2xl font-extrabold text-sm shadow-xl active:scale-95 transition-transform disabled:opacity-50"
      >
        {sending ? 'Sending...' : '🚀 SEND NEWSLETTER'}
      </button>

      <div className="text-center">
        <Link href="/profile" className="text-xs font-bold text-forest-600 hover:underline">← Back to Profile</Link>
      </div>
    </div>
  );
}