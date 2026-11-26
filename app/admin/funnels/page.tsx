'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function FunnelsManager() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data } = await supabase.from('funnels').select('*').order('created_at', { ascending: false });
    setFunnels(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function createFunnel(e: any) {
    e.preventDefault();
    if (!name || !slug) return alert('Name and URL Slug are required');
    setBusy(true);
    const supabase = createClient();
    
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { error } = await supabase.from('funnels').insert({
      name,
      slug: cleanSlug,
      headline,
      subheadline,
    });

    if (error) alert(error.message);
    else {
      flash('✅ Funnel created! Now add products to it.');
      setShowCreate(false);
      setName(''); setSlug(''); setHeadline(''); setSubheadline('');
      load();
    }
    setBusy(false);
  }

  async function deleteFunnel(id: string) {
    if (!window.confirm('Delete this funnel? All products inside will be removed.')) return;
    const supabase = createClient();
    await supabase.from('funnels').delete().eq('id', id);
    load();
  }

  function copyLink(slug: string) {
    const url = `https://www.farmingtechbusiness.com/funnel/${slug}`;
    navigator.clipboard.writeText(url);
    flash('🔗 Link copied to clipboard!');
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-800">🚀 Funnels</h1>
          <p className="text-xs text-gray-500">Manage all your sales pages in one place.</p>
        </div>
        <Link href="/admin" className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-2 rounded-lg">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-green-700 mt-1 bg-green-50 p-2 rounded-lg">{msg}</p>}

      {/* CREATE BUTTON */}
      <button onClick={() => setShowCreate(!showCreate)} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold shadow-md">
        {showCreate ? 'Cancel' : '➕ Create New Funnel'}
      </button>

      {/* CREATE FORM */}
      {showCreate && (
        <form onSubmit={createFunnel} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <input className="w-full p-2 rounded-lg border text-sm font-bold" placeholder="Funnel Name (e.g., Fish Breeding Masterclass)" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} />
          <input className="w-full p-2 rounded-lg border text-sm bg-gray-50 font-mono" placeholder="URL Slug (e.g., fish-breeding)" value={slug} onChange={e => setSlug(e.target.value)} />
          <input className="w-full p-2 rounded-lg border text-sm" placeholder="Main Headline (e.g., Master Fish Breeding Today)" value={headline} onChange={e => setHeadline(e.target.value)} />
          <textarea className="w-full p-2 rounded-lg border text-sm" rows={2} placeholder="Subheadline" value={subheadline} onChange={e => setSubheadline(e.target.value)} />
          <button disabled={busy} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">{busy ? 'Creating...' : 'Save Funnel'}</button>
        </form>
      )}

      {/* FUNNEL LIST */}
      <div className="space-y-4 mt-6">
        {funnels.map((f, index) => (
          <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0 font-extrabold text-forest-800">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-forest-900 truncate">{f.name}</h3>
                <p className="text-[10px] text-forest-600 font-mono mt-0.5 truncate">/funnel/{f.slug}</p>
                <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{f.headline}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <Link href={`/admin/funnels/${f.id}`} className="flex-1 bg-forest-600 text-white py-2 rounded-lg text-xs font-bold text-center">
                ⚙️ Manage Products
              </Link>
              <button onClick={() => copyLink(f.slug)} className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-xs font-bold">
                🔗 Copy Link
              </button>
              <button onClick={() => deleteFunnel(f.id)} className="w-10 bg-red-50 text-red-500 rounded-lg text-sm flex items-center justify-center">
                🗑️
              </button>
            </div>

          </div>
        ))}
        {funnels.length === 0 && <p className="text-center text-gray-500 text-sm py-10">You haven't created any funnels yet.</p>}
      </div>

    </div>
  );
}