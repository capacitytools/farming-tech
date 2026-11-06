'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AffiliateManagerPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin');
    }

    const { data } = await supabase.from('affiliate_links').select('*').order('created_at', { ascending: false });
    setLinks(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function createLink(e: any) {
    e.preventDefault();
    if (!title || !slug || !destinationUrl) return flash('All fields are required.');
    setBusy(true);

    const supabase = createClient();
    
    // Clean the slug (remove spaces, uppercase)
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const { error } = await supabase.from('affiliate_links').insert({
      title,
      slug: cleanSlug,
      destination_url: destinationUrl,
    });

    if (error) {
      alert('Error creating link: ' + error.message);
    } else {
      flash('✅ Link created successfully!');
      setTitle('');
      setSlug('');
      setDestinationUrl('');
      load();
    }
    setBusy(false);
  }

  async function deleteLink(id: string) {
    if (!window.confirm('Delete this link?')) return;
    const supabase = createClient();
    await supabase.from('affiliate_links').delete().eq('id', id);
    load();
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(url);
    flash('🔗 Link copied to clipboard!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">💰 Affiliate Link Manager</h1>
        <p className="text-xs text-gray-500">Create tracked links for Jumia, Amazon, or any farming supplier. Every click is logged.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      {/* CREATE FORM */}
      <form onSubmit={createLink} className="glass-card p-4 rounded-2xl space-y-3">
        <p className="text-sm font-extrabold text-forest-700">1. CREATE A NEW TRACKING LINK</p>
        
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Product/Offer Name</label>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mt-1" placeholder="e.g., Automatic Rabbit Cage on Jumia" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Short Link (Slug)</label>
          <div className="flex items-center mt-1">
            <span className="bg-gray-100 p-2 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-500">/go/</span>
            <input className="w-full p-2 rounded-r-xl border border-gray-200 bg-white/70 text-sm" placeholder="rabbit-cage" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Destination URL (Affiliate Link)</label>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mt-1" placeholder="https://jumia.com.ng/..." value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
        </div>

        <button type="submit" disabled={busy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-extrabold text-sm disabled:opacity-50">
          {busy ? 'Creating...' : '➕ CREATE TRACKING LINK'}
        </button>
      </form>

      {/* LIST OF LINKS */}
      <div className="space-y-3">
        <p className="text-sm font-extrabold text-forest-700">2. YOUR ACTIVE LINKS ({links.length})</p>
        
        {links.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No links yet. Create one above.</p>
        ) : links.map((link) => (
          <div key={link.id} className="glass-card p-4 rounded-2xl space-y-2 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-forest-900">{link.title}</p>
                <p className="text-[10px] text-gray-500 break-all">{link.destination_url}</p>
              </div>
              <button onClick={() => deleteLink(link.id)} className="text-red-500 text-xs font-bold px-2 py-1 bg-red-50 rounded-lg">Delete</button>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-forest-600 font-bold">/go/{link.slug}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">👁️ {link.clicks} clicks</span>
              </div>
              <button onClick={() => copyLink(link.slug)} className="bg-forest-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm">
                📋 Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}