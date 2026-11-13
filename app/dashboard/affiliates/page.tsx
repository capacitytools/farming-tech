'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function UserAffiliatePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
    
    // 1. Get User
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);

    // 2. Fetch Links (With error handling)
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('owner_id', u.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading affiliate links:", error);
      alert('Could not load your links. Please try again.');
    } else {
      setLinks(data || []);
    }
    
    setLoaded(true);
  }

  useEffect(() => { 
    load(); 
  }, []);

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
    
    // Add a unique code to the slug so users don't clash
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const userSlug = `${cleanSlug}-${user.id.slice(0, 4)}`; 

    const { error } = await supabase.from('affiliate_links').insert({
      title,
      slug: userSlug,
      destination_url: destinationUrl,
      image_url: imageUrl || null,
      owner_id: user.id,
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

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10">
        <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-forest-800">Loading your vault...</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🔗 My Affiliate Vault</h1>
        <p className="text-xs text-gray-500">Create your own product links to make money.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <form onSubmit={createLink} className="glass-card p-4 rounded-2xl space-y-3 bg-white border border-gray-100 shadow-sm">
        <p className="text-sm font-extrabold text-forest-700">1. NEW PRODUCT</p>
        
        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="Product Name (e.g. 256 Egg Incubator)" value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        
        <div className="flex items-center mt-1">
          <span className="bg-gray-100 p-2 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-500">/go/</span>
          <input className="w-full p-2 rounded-r-xl border border-gray-200 text-sm" placeholder="egg-incubator" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>

        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="Affiliate URL (AliExpress, Jumia, etc)" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />

        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
          <p className="text-[10px] font-bold text-amber-800 mb-1">Product Image (Optional)</p>
          <div className="flex gap-2 mt-2">
            <input className="flex-1 p-2 rounded-lg border border-amber-200 text-xs" placeholder="Paste Image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <label className="bg-white border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shadow-sm">
              📷 Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          {imageUrl && <img src={imageUrl} className="h-16 object-contain mt-2" />}
        </div>

        <button type="submit" disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm disabled:opacity-50 mt-2">
          {busy ? 'Creating...' : '➕ CREATE LINK'}
        </button>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-extrabold text-forest-700">2. MY PRODUCTS ({links.length})</p>
        
        {links.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm font-bold text-gray-500">You haven't created any links yet.</p>
          </div>
        )}

        {links.map((link) => (
          <div key={link.id} className="glass-card p-4 rounded-2xl flex gap-3 items-center border border-gray-100 bg-white">
            {link.image_url ? (
              <img src={link.image_url} className="w-12 h-12 object-cover rounded-lg bg-white border border-gray-100" />
            ) : (
              <div className="w-12 h-12 bg-forest-100 rounded-lg flex items-center justify-center text-xl">📦</div>
            )}
            <div className="flex-1 min-w-0">
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