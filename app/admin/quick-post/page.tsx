'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function QuickPostPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Farming');
  const [coverImage, setCoverImage] = useState('');
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedEbook, setSelectedEbook] = useState('');

  // Fetch admin status and ebooks for the dropdown
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin' && profile?.role !== 'editor') return router.push('/');

      setAdmin(true);

      // Fetch ebooks for the CTA dropdown
      const { data: eb } = await supabase.from('ebooks').select('id, title').eq('is_active', true);
      setEbooks(eb || []);
      
      setLoaded(true);
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

  async function publishPost() {
    if (!title || !content) return alert('Title and Content are required.');
    
    setBusy(true);
    const supabase = createClient();
    
    // Auto-generate a clean slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('blogs').insert({
      title,
      slug,
      content,
      category,
      cover_image_url: coverImage,
      status: 'published', // 🚨 Always publishes immediately
      product_cta: selectedEbook || null, // Links the ebook
      author_name: 'Farming Tech & Business',
      indexable: true,
    });

    if (error) {
      alert('Error publishing: ' + error.message);
    } else {
      setMsg('🚀 Article Published Successfully!');
      setTimeout(() => {
        router.push('/admin/blogs'); // Redirect back to control room
      }, 1500);
    }
    setBusy(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return null;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">⚡ Quick Post</h1>
        <p className="text-xs text-gray-500">Paste your formatted text and publish instantly.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-100 shadow-sm">
        
        {/* TITLE */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Article Title</label>
          <input 
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-forest-500 outline-none" 
            placeholder="e.g. Broiler vs Noiler vs Sasso" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
          <select 
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Farming</option>
            <option>Poultry</option>
            <option>Rabbits</option>
            <option>Livestock</option>
            <option>Fish</option>
            <option>Business</option>
          </select>
        </div>

        {/* CONTENT */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Article Body (Markdown)</label>
          <textarea 
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm h-64 font-mono focus:ring-2 focus:ring-forest-500 outline-none" 
            placeholder="Paste your fully formatted AI text here..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
          />
        </div>

        {/* COVER IMAGE */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-200">
              📷 Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {coverImage && <img src={coverImage} alt="Cover" className="h-10 w-10 object-cover rounded-md border border-gray-200" />}
          </div>
        </div>

        {/* EBOOK CTA */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Feature E-book (Optional)</label>
          <select 
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none" 
            value={selectedEbook} 
            onChange={(e) => setSelectedEbook(e.target.value)}
          >
            <option value="">- No Ebook -</option>
            {ebooks.map(eb => (
              <option key={eb.id} value={eb.id}>{eb.title}</option>
            ))}
          </select>
        </div>

        {/* PUBLISH BUTTON */}
        <button 
          onClick={publishPost} 
          disabled={busy} 
          className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform disabled:opacity-50 mt-4"
        >
          {busy ? 'Publishing...' : '🚀 PUBLISH IMMEDIATELY'}
        </button>

      </div>
    </div>
  );
}