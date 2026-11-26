'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function FunnelProductsManager() {
  const router = useRouter();
  const params = useParams();
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [funnel, setFunnel] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // New Product Form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOldPrice, setNewOldPrice] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: f } = await supabase.from('funnels').select('*').eq('id', params.id).single();
    setFunnel(f);

    const { data: prods } = await supabase.from('funnel_products').select('*').eq('funnel_id', params.id).order('sort_order');
    setProducts(prods || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, [params.id]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function createProduct(e: any) {
    e.preventDefault();
    if (!newName || !newSlug || !newPrice) return alert('Name, Slug and Price are required');
    setBusy(true);
    const supabase = createClient();
    
    const { error } = await supabase.from('funnel_products').insert({
      funnel_id: params.id,
      name: newName,
      slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      price: Number(newPrice),
      old_price: Number(newOldPrice || newPrice),
      toc: [],
      sort_order: products.length
    });

    if (error) alert(error.message);
    else {
      flash('✅ Product added!');
      setShowAdd(false);
      setNewName(''); setNewSlug(''); setNewPrice(''); setNewOldPrice('');
      load();
    }
    setBusy(false);
  }

  async function updateProduct(id: string, data: any) {
    const supabase = createClient();
    await supabase.from('funnel_products').update(data).eq('id', id);
    load();
  }

  async function handleImageUpload(e: any, id: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'funnel-covers');
      await updateProduct(id, { cover_url: url });
      flash('✅ Cover uploaded!');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('Delete this product?')) return;
    const supabase = createClient();
    await supabase.from('funnel_products').delete().eq('id', id);
    load();
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-forest-800">{funnel?.name}</h1>
          <p className="text-xs text-gray-500 font-mono">/funnel/{funnel?.slug}</p>
        </div>
        <Link href="/admin/funnels" className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-2 rounded-lg">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg">{msg}</p>}

      <button onClick={() => setShowAdd(!showAdd)} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold shadow-md">
        {showAdd ? 'Cancel' : '➕ Add Product to Funnel'}
      </button>

      {showAdd && (
        <form onSubmit={createProduct} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <input className="w-full p-2 rounded-lg border text-sm font-bold" placeholder="Product Name" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} />
          <input className="w-full p-2 rounded-lg border text-sm bg-gray-50 font-mono" placeholder="Product Slug (e.g., rabbit-guide)" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" className="w-full p-2 rounded-lg border text-sm" placeholder="Price (₦)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            <input type="number" className="w-full p-2 rounded-lg border text-sm" placeholder="Old Price (₦)" value={newOldPrice} onChange={e => setNewOldPrice(e.target.value)} />
          </div>
          <button disabled={busy} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">{busy ? 'Adding...' : 'Save Product'}</button>
        </form>
      )}

      <div className="space-y-4 mt-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-sm font-extrabold text-forest-900">{p.name}</h2>
              <button onClick={() => deleteProduct(p.id)} className="text-red-500 text-xs font-bold">Delete</button>
            </div>

            <div className="flex gap-3 items-center">
              <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                {p.cover_url ? <img src={p.cover_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No Cover</div>}
              </div>
              <div className="flex-1">
                <label className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                  {busy ? '...' : '📷 Upload Cover'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, p.id)} />
                </label>
                <p className="text-[10px] text-gray-500 mt-1">Price: ₦{Number(p.price).toLocaleString()} (Old: ₦{Number(p.old_price).toLocaleString()})</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                Brief Description
                <span className="text-green-600">Auto-saves on blur</span>
              </label>
              <textarea 
                className="w-full p-2 mt-1 rounded-lg border border-gray-200 text-xs" rows={2}
                value={p.brief || ''} 
                onChange={(e) => setProducts(products.map(x => x.id === p.id ? { ...x, brief: e.target.value } : x))}
                onBlur={() => updateProduct(p.id, { brief: p.brief })}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">
                Table of Contents (One per line)
                <span className="text-green-600">Auto-saves on blur</span>
              </label>
              <textarea 
                className="w-full p-2 mt-1 rounded-lg border border-gray-200 text-xs font-mono" rows={4}
                value={(p.toc || []).join('\n')} 
                onChange={(e) => setProducts(products.map(x => x.id === p.id ? { ...x, toc: e.target.value.split('\n') } : x))}
                onBlur={() => updateProduct(p.id, { toc: p.toc })}
              />
            </div>

          </div>
        ))}
        {products.length === 0 && <p className="text-center text-gray-500 text-sm">No products added to this funnel yet.</p>}
      </div>

    </div>
  );
}