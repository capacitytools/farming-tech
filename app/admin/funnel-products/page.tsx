'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';
import Link from 'next/link';

export default function FunnelProductsManager() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data } = await supabase.from('funnel_products').select('*').order('price', { ascending: false });
    setProducts(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleImageUpload(e: any, id: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'funnel-covers');
      const supabase = createClient();
      await supabase.from('funnel_products').update({ cover_url: url }).eq('id', id);
      flash('✅ Image uploaded!');
      load();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function saveProduct(id: string, updatedData: any) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('funnel_products').update(updatedData).eq('id', id);
    if (error) alert('Error saving: ' + error.message);
    else flash('✅ Product updated!');
    setBusy(false);
  }

  function updateField(id: string, field: string, value: any) {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-800">📦 Funnel Products</h1>
          <p className="text-xs text-gray-500">Manage covers, briefs, and TOCs for the sales page.</p>
        </div>
        <Link href="/admin" className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-2 rounded-lg">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg">{msg}</p>}

      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-extrabold text-forest-900 uppercase">{p.slug}</h2>
              <span className="text-sm font-bold text-forest-600">₦{p.price.toLocaleString()}</span>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                {p.cover_url ? <img src={p.cover_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Cover</div>}
              </div>
              <div>
                <label className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-200">
                  {busy ? 'Uploading...' : '📷 Upload Cover Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, p.id)} disabled={busy} />
                </label>
              </div>
            </div>

            {/* BRIEF */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Brief Description</label>
              <textarea 
                className="w-full p-2 mt-1 rounded-lg border border-gray-200 text-xs" 
                rows={2}
                value={p.brief || ''} 
                onChange={(e) => updateField(p.id, 'brief', e.target.value)}
                onBlur={() => saveProduct(p.id, { brief: p.brief })}
              />
            </div>

            {/* TOC */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Table of Contents (One per line)</label>
              <textarea 
                className="w-full p-2 mt-1 rounded-lg border border-gray-200 text-xs font-mono" 
                rows={4}
                value={(p.toc || []).join('\n')} 
                onChange={(e) => updateField(p.id, 'toc', e.target.value.split('\n'))}
                onBlur={() => saveProduct(p.id, { toc: p.toc })}
              />
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}