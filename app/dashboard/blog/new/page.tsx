'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const THEMES = [
  { id: 'theme-1', name: 'Classic Green' },
  { id: 'theme-2', name: 'Modern Dark' },
  { id: 'theme-3', name: 'Magazine Style' },
  { id: 'theme-4', name: 'Minimalist' },
  { id: 'theme-5', name: 'Agri-Bold' },
  // You can add more here later
];

export default function UserNewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Farming');
  const [coverImage, setCoverImage] = useState('');
  const [theme, setTheme] = useState('theme-1');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);

      // Fetch user's OWN affiliate links
      const { data } = await supabase.from('affiliate_links').select('id, title, image_url').eq('owner_id', u.id);
      setProducts(data || []);
    }
    init();
  }, [router]);

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
      linked_products: selectedProducts,
      theme_id: theme, // 🚨 Save the selected theme
      author_id: user.id, // 🚨 CRITICAL: Links post to this user!
      author_name: user.email?.split('@')[0] || 'Farmer',
      indexable: true,
    });

    if (error) {
      alert('Error publishing: ' + error.message);
    } else {
      setMsg('🚀 Article Published!');
      setTimeout(() => router.push('/dashboard/blog'), 1500);
    }
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">✍️ Write New Post</h1>
        <p className="text-xs text-gray-500">Publish your article, choose a theme, and add products.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-100 shadow-sm">
        
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold outline-none" placeholder="Article Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        
        <select className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
          {['Farming', 'Poultry', 'Rabbits', 'Livestock', 'Fish', 'Business'].map(c => <option key={c}>{c}</option>)}
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

        {/* 🚨 SELECT THEME 🚨 */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Choose a Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <div 
                key={t.id} 
                onClick={() => setTheme(t.id)}
                className={`p-2 rounded-lg border text-center text-xs font-bold cursor-pointer transition-colors ${theme === t.id ? 'bg-forest-100 border-forest-500 text-forest-800' : 'bg-white border-gray-200 text-gray-500'}`}
              >
                {t.name}
              </div>
            ))}
          </div>
        </div>

        {/* 🚨 SELECT THEIR OWN PRODUCTS 🚨 */}
        <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200 space-y-2">
          <p className="text-sm font-extrabold text-amber-800">🛍️ Attach Your Products</p>
          {products.length === 0 ? (
             <p className="text-xs text-amber-600">You haven't created any affiliate links yet. Go to your Affiliate Vault first.</p>
          ) : (
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
          )}
        </div>

        <button onClick={publishPost} disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md mt-2">
          {busy ? 'Publishing...' : '🚀 PUBLISH ARTICLE'}
        </button>
      </div>
    </div>
  );
}