'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const CATEGORIES = ['Farming', 'Poultry', 'Rabbits', 'Livestock', 'Fish', 'Business'];
const THEMES = [
  { id: 'theme-1', name: 'Classic Green' },
  { id: 'theme-2', name: 'Modern Dark' },
  { id: 'theme-3', name: 'Magazine Style' },
  { id: 'theme-4', name: 'Minimalist' },
  { id: 'theme-5', name: 'Agri-Bold' },
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
  const [audit, setAudit] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);

      const { data } = await supabase.from('affiliate_links').select('id, title, image_url').eq('owner_id', u.id);
      setProducts(data || []);
    }
    init();
  }, [router]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

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
    if (selectedProducts.includes(id)) setSelectedProducts(selectedProducts.filter(p => p !== id));
    else setSelectedProducts([...selectedProducts, id]);
  }

  function runAudit() {
    if (!content) return flash('Please write some content first.');
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const h2Count = (content.match(/## /g) || []).length;
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const paragraphs = content.split('\n\n');
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100).length;
    
    const checks = [];
    let score = 0;

    if (title.length >= 30 && title.length <= 65) { score += 10; checks.push({ label: 'Title Length', pass: true }); }
    else { checks.push({ label: 'Title Length', pass: false, action: 'Aim for 30-65 characters.' }); }
    if (wordCount >= 600) { score += 20; checks.push({ label: 'Word Count', pass: true }); }
    else { checks.push({ label: `Word Count (${wordCount})`, pass: false, action: 'Add more words (aim 600+).' }); }
    if (h2Count >= 2) { score += 20; checks.push({ label: 'Headings', pass: true }); }
    else { checks.push({ label: 'Headings', pass: false, action: 'Add 2+ headings using ##.' }); }
    if (linkCount >= 2) { score += 20; checks.push({ label: 'Links', pass: true }); }
    else { checks.push({ label: 'Links', pass: false, action: 'Add 2+ links.' }); }
    if (longParagraphs === 0) { score += 15; checks.push({ label: 'Readability', pass: true }); }
    else { checks.push({ label: 'Readability', pass: false, action: 'Split long paragraphs.' }); }
    if (content.includes('**')) { score += 15; checks.push({ label: 'Formatting', pass: true }); }
    else { checks.push({ label: 'Formatting', pass: false, action: 'Use **bold**.' }); }

    setAudit({ score, checks });
  }

  async function publishPost() {
    if (!title || !content) return alert('Title and Content are required.');
    setBusy(true);
    const supabase = createClient();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('blogs').insert({
      title, slug, content, category, cover_image_url: coverImage,
      status: 'published', linked_products: selectedProducts, theme_id: theme,
      author_id: user.id, author_name: user.email?.split('@')[0] || 'Farmer', indexable: true,
    });

    if (error) alert('Error: ' + error.message);
    else { setMsg('🚀 Published!'); setTimeout(() => router.push('/dashboard/blog'), 1500); }
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-forest-800">✍️ Write New Post</h1>
      {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}

      <div className="glass-card p-4 rounded-2xl space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold" placeholder="Article Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        
        <select className="w-full p-3 rounded-xl border border-gray-200 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <textarea className="w-full p-3 rounded-xl border border-gray-200 text-sm h-64 font-mono" placeholder="Paste your formatted article here..." value={content} onChange={(e) => setContent(e.target.value)} />

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

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Choose Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <div key={t.id} onClick={() => setTheme(t.id)} className={`p-2 rounded-lg border text-center text-xs font-bold cursor-pointer ${theme === t.id ? 'bg-forest-100 border-forest-500 text-forest-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200">
          <p className="text-sm font-extrabold text-amber-800 mb-2">🛍️ Attach Your Products</p>
          {products.length === 0 ? <p className="text-xs text-amber-600">No affiliate links yet. Create some first.</p> : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {products.map(p => (
                <div key={p.id} onClick={() => toggleProduct(p.id)} className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer ${selectedProducts.includes(p.id) ? 'bg-amber-200 border-amber-500' : 'bg-white border-amber-100'}`}>
                  {p.image_url ? <img src={p.image_url} className="w-8 h-8 object-cover rounded" /> : <div className="w-8 h-8 bg-gray-200 rounded"></div>}
                  <p className="text-[10px] font-bold text-amber-900 line-clamp-2">{p.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO AUDIT */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-extrabold text-blue-800">SEO Score</p>
            <button onClick={runAudit} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Check Score</button>
          </div>
          {audit && (
            <div className="space-y-2">
              <p className={`text-center text-2xl font-extrabold ${audit.score >= 80 ? 'text-green-600' : 'text-red-500'}`}>{audit.score}/100</p>
              {audit.checks.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{c.pass ? '✅' : '❌'}</span>
                  <span className={c.pass ? 'text-gray-600' : 'text-red-600 font-bold'}>{c.label} {!c.pass && `- ${c.action}`}</span>
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