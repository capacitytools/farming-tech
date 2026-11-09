'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const CATEGORIES = [
  'Livestock & Poultry',
  'Farm Equipment',
  'AgriTech & AI',
  'Crops & Aquaculture',
  'Agribusiness',
  'Gadgets & Tools'
];

export default function VideoComposer({ context, initialAspect, onDone }: { context: string, initialAspect: string, onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState('Farm Equipment');
  
  // Product Card State
  const [productTitle, setProductTitle] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productImage, setProductImage] = useState('');
  
  const [busy, setBusy] = useState(false);

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'products');
      setProductImage(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function saveVideo() {
    if (!youtubeUrl) return alert('YouTube URL is required.');
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('videos').insert({
      author_id: user.id,
      context,
      aspect_ratio: initialAspect,
      title,
      youtube_url: youtubeUrl,
      category,
      product_title: productTitle || null,
      product_link: productLink || null,
      product_image: productImage || null,
    });

    if (error) alert('Error saving video: ' + error.message);
    else onDone();
    
    setBusy(false);
  }

  return (
    <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-200">
      <h3 className="font-extrabold text-forest-800">Add New Video/Reel</h3>
      
      {/* 1. YOUTUBE LINK */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase">YouTube Video URL *</label>
        <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
      </div>

      {/* 2. TITLE & CATEGORY */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Video Title</label>
          <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="e.g. Best Incubator" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
          <select className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* 3. PRODUCT CARD (OPTIONAL) */}
      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
        <p className="text-xs font-bold text-amber-800">🛍️ Attach a Product Card (Optional)</p>
        <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Product Name (e.g., 256 Egg Incubator)" value={productTitle} onChange={e => setProductTitle(e.target.value)} />
        <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Affiliate Link (e.g., farmingtechbusiness.com/go/incubator)" value={productLink} onChange={e => setProductLink(e.target.value)} />
        <div className="flex items-center gap-2">
          <label className="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
            📷 Upload Product Image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          {productImage && <img src={productImage} className="h-8 w-8 rounded object-cover" alt="Product" />}
        </div>
      </div>

      <button onClick={saveVideo} disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm">
        {busy ? 'Saving...' : '🚀 PUBLISH VIDEO'}
      </button>
    </div>
  );
}