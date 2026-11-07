'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PublicNewsletterPage({ params }: { params: { id: string } }) {
  const [owner, setOwner] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function getOwner() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('full_name, avatar_url, bio').eq('id', params.id).single();
      setOwner(data);
    }
    getOwner();
  }, [params.id]);

  async function subscribe(e: any) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('newsletter_subscribers').insert({
      owner_id: params.id,
      email: email.trim(),
      name: name.trim() || null
    });

    if (error) {
      if (error.code === '23505') setMsg('You are already subscribed!');
      else setMsg('Error: ' + error.message);
    } else {
      setDone(true);
      setMsg('✅ Subscribed successfully!');
    }
    setBusy(false);
  }

  if (!owner) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center p-4">
      <div className="glass-card bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-center space-y-4">
        {owner.avatar_url ? (
          <img src={owner.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-forest-100" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-forest-600 text-white flex items-center justify-center text-3xl font-bold mx-auto">{owner.full_name?.[0] || 'F'}</div>
        )}
        <div>
          <h1 className="text-xl font-extrabold text-forest-900">Subscribe to {owner.full_name || 'My Newsletter'}</h1>
          <p className="text-xs text-gray-500 mt-1">{owner.bio || 'Get weekly farming tips, guides, and updates directly in your inbox.'}</p>
        </div>

        {done ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm">
            🎉 You're on the list! Check your inbox soon.
          </div>
        ) : (
          <form onSubmit={subscribe} className="space-y-3 text-left">
            <input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" placeholder="Your Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" type="email" placeholder="Your Email Address *" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {msg && <p className="text-xs text-red-500 font-bold">{msg}</p>}
            <button type="submit" disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md disabled:opacity-50">
              {busy ? 'Subscribing...' : '📩 Join the Newsletter'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-gray-100">
          <Link href="/" className="text-[10px] font-bold text-gray-400 hover:text-forest-600">Powered by Farming Tech & Business</Link>
        </div>
      </div>
    </div>
  );
}