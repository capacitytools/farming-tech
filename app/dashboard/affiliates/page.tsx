'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function UserAffiliatePage() {
  const [loaded, setLoaded] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch ONLY this user's links
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('owner_id', user.id) // 🚨 The magic filter
      .order('created_at', { ascending: false });
      
    setLinks(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'products');
      setImageUrl(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function createLink(e: any) {
    e.preventDefault();
    if (!title || !slug || !destinationUrl) return flash('All fields required.');
    setBusy(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We add a unique code to the slug so users don't clash with each other
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const userSlug = `${cleanSlug}-${user.id.slice(0, 4)}`; 

    const { error } = await supabase.from('affiliate_links').insert({
      title,
      slug: userSlug,
      destination_url: destinationUrl,
      image_url: imageUrl || null,
      owner_id: user.id, // 🚨 Link it to this user
    });

    if (error) {
      alert('Error creating link: ' + error.message);
    } else {
      flash('✅ Link created successfully!');
      setTitle(''); setSlug(''); setDestinationUrl(''); setImageUrl('');
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

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9-]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🔗 My Affiliate Vault</h1>
        <p className="text-xs text-gray-500">Create your own product links to make money.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <form onSubmit={createLink} className="glass-card p-4 rounded-2xl space-y-3">
        <p className="text-sm font-extrabold text-forest-700">1. NEW PRODUCT</p>
        
        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="Product Name (e.g. 256 Egg Incubator)" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        
        <div className="flex items-center mt-1">
          <span className="bg-gray-100 p-2 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-500">/go/</span>
          <input className="w-full p-2 rounded-r-xl border border-gray-200 text-sm" placeholder="egg-incubator" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>

        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="Affiliate URL (AliExpress, Jumia, etc)" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />

        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
          <div className="flex gap-2 mt-2">
            <input className="flex-1 p-2 rounded-lg border border-amber-200 text-xs" placeholder="Paste Image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <label className="bg-white border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shadow-sm">
              📷 Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          {imageUrl && <img src={imageUrl} className="h-16 object-contain mt-2" />}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm disabled:opacity-50">
          {busy ? 'Creating...' : '➕ CREATE LINK'}
        </button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-extrabold text-forest-700">2. MY PRODUCTS ({links.length})</p>
        {links.map((link) => (
          <div key={link.id} className="glass-card p-4 rounded-2xl flex gap-3 items-center border border-gray-100">
            {link.image_url ? <img src={link.image_url} className="w-12 h-12 object-cover rounded-lg bg-white" /> : <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center text-xl">📦</div>}
            <div className="flex-1">
              <p className="text-xs font-bold text-forest-900 line-clamp-1">{link.title}</p>
              <p className="text-[10px] text-amber-600 font-bold">👁️ {link.clicks} clicks</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => copyLink(link.slug)} className="bg-forest-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold">🔗 Link</button>
              <button onClick={() => { navigator.clipboard.writeText(`[product:${link.slug}]`); flash('Copied!'); }} className="bg-gray-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold">📝 Code</button>
              <button onClick={() => deleteLink(link.id)} className="text-red-500 text-[10px] font-bold text-center">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}