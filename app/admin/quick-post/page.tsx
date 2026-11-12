'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const CATEGORIES = ['Farming', 'Poultry', 'Rabbits', 'Livestock', 'Fish', 'Business'];

export default function QuickPostPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Data states
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Farming');
  const [coverImage, setCoverImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // Selections
  const [selectedEbooks, setSelectedEbooks] = useState<string[]>([]); // 🚨 Array for ebooks
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const [eb, pr] = await Promise.all([
        supabase.from('ebooks').select('id, title, cover_url').eq('is_active', true),
        supabase.from('affiliate_links').select('id, title, image_url')
      ]);
      setEbooks(eb.data || []);
      setProducts(pr.data || []);
    }
    init();
  }, []);

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'blog-covers');
      setCoverImage(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  function toggleEbook(id: string) {
    if (selectedEbooks.includes(id)) {
      setSelectedEbooks(selectedEbooks.filter(p => p !== id));
    } else {
      setSelectedEbooks([...selectedEbooks, id]);
    }
  }

  function toggleProduct(id: string) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  }

  async function publishPost() {
    if (!title || !content) return alert('Title and Content are required.');
    
    setBusy(true);
    const supabase = createClient();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('blogs').insert({
      title,
      slug,
      content,
      category,
      cover_image_url: coverImage,
      status: 'published',
      linked_ebooks: selectedEbooks, // 🚨 Save the array
      linked_products: selectedProducts,
      video_url: videoUrl || null,
      author_name: 'Farming Tech & Business',
      indexable: true,
    });

    if (error) {
      alert('Error publishing: ' + error.message);
    } else {
      setMsg('🚀 Article Published!');
      setTimeout(() => router.push('/admin/blogs'), 1500);
    }
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🚀 Quick Post (Publish)</h1>
        <p className="text-xs text-gray-500">Add images, products, and publish your clean article.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-100 shadow-sm">
        
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none" placeholder="Article Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        
        <select className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <textarea className="w-full p-3 rounded-xl border border-gray-200 text-sm h-64 font-mono outline-none" placeholder="Paste your formatted article here..." value={content} onChange={(e) => setContent(e.target.value)} />

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
              📷 Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {coverImage && <img src={coverImage} alt="Cover" className="h-10 w-10 object-cover rounded-md" />}
          </div>
        </div>

        {/* 🚨 SELECT MULTIPLE EBOOKS 🚨 */}
        <div className="bg-blue-50 p-3 rounded-xl border-2 border-blue-200 space-y-2">
          <p className="text-sm font-extrabold text-blue-800">📚 Select E-books to Advertise</p>
          <p className="text-[10px] text-blue-600 mb-2">Tap to select. The first will show mid-article, the second at the bottom.</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {ebooks.map(eb => (
              <div 
                key={eb.id} 
                onClick={() => toggleEbook(eb.id)}
                className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${selectedEbooks.includes(eb.id) ? 'bg-blue-200 border-blue-500' : 'bg-white border-blue-100'}`}
              >
                {eb.cover_url ? <img src={eb.cover_url} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-gray-200 rounded"></div>}
                <p className="text-[10px] font-bold text-blue-900 line-clamp-2">{eb.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SELECT MULTIPLE PRODUCTS */}
        <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200 space-y-2">
          <p className="text-sm font-extrabold text-amber-800">🛍️ Select Products to Advertise</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {products.map(p => (
              <div 
                key={p.id} 
                onClick={() => toggleProduct(p.id)}
                className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${selectedProducts.includes(p.id) ? 'bg-amber-200 border-amber-500' : 'bg-white border-amber-100'}`}
              >
                {p.image_url ? <img src={p.image_url} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-gray-200 rounded"></div>}
                <p className="text-[10px] font-bold text-amber-900 line-clamp-2">{p.title}</p>
              </div>
            ))}
          </div>
        </div>

        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="YouTube Video URL (Optional)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />

        <button onClick={publishPost} disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md mt-2">
          {busy ? 'Publishing...' : '🚀 PUBLISH ARTICLE'}
        </button>
      </div>
    </div>
  );
}