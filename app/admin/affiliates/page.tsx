'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function AffiliateManagerPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imgError, setImgError] = useState(false);
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

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'products');
      setImageUrl(url);
      setImgError(false);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function createLink(e: any) {
    e.preventDefault();
    if (!title || !slug || !destinationUrl) return flash('Title, Slug and URL are required.');
    setBusy(true);

    const supabase = createClient();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const { error } = await supabase.from('affiliate_links').insert({
      title,
      slug: cleanSlug,
      destination_url: destinationUrl,
      image_url: imageUrl || null,
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
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">💰 Affiliate Manager</h1>
        <p className="text-xs text-gray-500">Create tracked links and product images.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <form onSubmit={createLink} className="glass-card p-4 rounded-2xl space-y-3">
        <p className="text-sm font-extrabold text-forest-700">1. CREATE A NEW PRODUCT LINK</p>
        
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Product Name</label>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mt-1" placeholder="e.g., 256-500 Egg Incubator" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Short Link (Slug)</label>
          <div className="flex items-center mt-1">
            <span className="bg-gray-100 p-2 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-500">/go/</span>
            <input className="w-full p-2 rounded-r-xl border border-gray-200 bg-white/70 text-sm" placeholder="egg-incubator" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">AliExpress Affiliate URL</label>
          <input className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm mt-1" placeholder="https://s.click.aliexpress.com/..." value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
        </div>

        {/* 🚨 TWO OPTIONS FOR IMAGE 🚨 */}
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
          <label className="text-[10px] font-bold text-amber-800 uppercase">Product Image (Optional)</label>
          
          <div className="flex gap-2 mt-2">
            <input className="flex-1 p-2 rounded-lg border border-amber-200 text-xs" placeholder="Paste Image URL..." value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImgError(false); }} />
            
            <label className="bg-white border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shadow-sm">
              📷 Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          
          {imageUrl && (
            <div className="mt-2 flex justify-center bg-white p-2 rounded-lg border border-amber-100">
              {imgError ? (
                <p className="text-xs text-red-500 font-bold">⚠️ Invalid image URL</p>
              ) : (
                <img src={imageUrl} alt="Preview" className="h-16 object-contain" onError={() => setImgError(true)} />
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-purple-600 text-white py-3 rounded-xl font-extrabold text-sm disabled:opacity-50">
          {busy ? 'Creating...' : '➕ CREATE PRODUCT LINK'}
        </button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-extrabold text-forest-700">2. YOUR PRODUCTS ({links.length})</p>
        {links.map((link) => (
          <div key={link.id} className="glass-card p-4 rounded-2xl flex gap-3 items-center border border-gray-100">
            {link.image_url ? (
              <img src={link.image_url} alt="" className="w-12 h-12 object-cover rounded-lg bg-white" />
            ) : (
              <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center text-xl">📦</div>
            )}
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