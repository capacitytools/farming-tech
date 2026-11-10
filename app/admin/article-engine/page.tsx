'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const CATEGORIES = ['Farming', 'Poultry', 'Rabbits', 'Livestock', 'Fish', 'Business'];

export default function QuickPostPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Farming');
  const [coverImage, setCoverImage] = useState('');
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedEbook, setSelectedEbook] = useState('');

  // 🚨 NEW: Product Card State
  const [productTitle, setProductTitle] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productImage, setProductImage] = useState('');

  async function handleImageUpload(e: any, type: 'cover' | 'product') {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, type === 'cover' ? 'blog-covers' : 'products');
      if (type === 'cover') setCoverImage(url);
      else setProductImage(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function publishPost() {
    if (!title || !content) return alert('Title and Content are required.');
    
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('blogs').insert({
      title,
      slug,
      content,
      category,
      cover_image_url: coverImage,
      status: 'published',
      product_cta: selectedEbook || null, // E-book link
      product_title: productTitle || null, // 🚨 New
      product_link: productLink || null,   // 🚨 New
      product_image: productImage || null, // 🚨 New
      author_name: 'Farming Tech & Business',
      indexable: true,
    });

    if (error) {
      alert('Error publishing: ' + error.message);
    } else {
      setMsg('🚀 Article Published Successfully!');
      setTimeout(() => router.push('/admin/blogs'), 1500);
    }
    setBusy(false);
  }

  // We need to load ebooks when the page opens
  useState(() => {
    async function loadEbooks() {
      const supabase = createClient();
      const { data } = await supabase.from('ebooks').select('id, title').eq('is_active', true);
      setEbooks(data || []);
    }
    loadEbooks();
  });

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">⚡ Quick Post + Product</h1>
        <p className="text-xs text-gray-500">Paste your formatted text, add a product, and publish.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-100 shadow-sm">
        
        {/* TITLE & CATEGORY */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Article Title</label>
          <input className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm font-bold outline-none" placeholder="e.g. Broiler vs Noiler" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
          <select className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* CONTENT */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Article Body (Markdown)</label>
          <textarea className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm h-64 font-mono outline-none" placeholder="Paste your formatted AI text here..." value={content} onChange={(e) => setContent(e.target.value)} />
        </div>

        {/* COVER IMAGE */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-200">
              📷 Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
            </label>
            {coverImage && <img src={coverImage} alt="Cover" className="h-10 w-10 object-cover rounded-md border border-gray-200" />}
          </div>
        </div>

        {/* 🚨 THE NEW PRODUCT CARD SECTION 🚨 */}
        <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200 space-y-3">
          <p className="text-sm font-extrabold text-amber-800">🛍️ Attach a Product Card (Optional)</p>
          <p className="text-[10px] text-amber-600">Attach a product, tool, or e-book to the bottom of this article.</p>
          
          <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Product Title (e.g. 256 Egg Incubator)" value={productTitle} onChange={e => setProductTitle(e.target.value)} />
          
          <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Affiliate Link (e.g. https://your-site.com/go/incubator)" value={productLink} onChange={e => setProductLink(e.target.value)} />
          
          <div className="flex items-center gap-2">
            <label className="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
              📷 Upload Product Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'product')} />
            </label>
            {productImage && <img src={productImage} alt="Product" className="h-10 w-10 object-cover rounded-md border border-gray-200" />}
          </div>
        </div>

        {/* EBOOK CTA */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Feature E-book (Optional)</label>
          <select className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none" value={selectedEbook} onChange={(e) => setSelectedEbook(e.target.value)}>
            <option value="">- No Ebook -</option>
            {ebooks.map(eb => <option key={eb.id} value={eb.id}>{eb.title}</option>)}
          </select>
        </div>

        <button onClick={publishPost} disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform disabled:opacity-50 mt-4">
          {busy ? 'Publishing...' : '🚀 PUBLISH ARTICLE'}
        </button>
      </div>
    </div>
  );
}