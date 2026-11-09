'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';
import Link from 'next/link';

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Farming');
  const [coverImage, setCoverImage] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    async function fetchBlog() {
      const supabase = createClient();
      const { data, error } = await supabase.from('blogs').select('*').eq('id', params.id).single();
      
      if (data && !error) {
        setTitle(data.title || '');
        setContent(data.content || '');
        setCategory(data.category || 'Farming');
        setCoverImage(data.cover_image_url || '');
        setSlug(data.slug || '');
      } else {
        alert('Article not found');
        router.push('/admin/blogs');
      }
      setLoaded(true);
    }
    fetchBlog();
  }, [params.id, router]);

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

  async function saveChanges() {
    if (!title || !content) return alert('Title and Content are required.');
    
    setBusy(true);
    const supabase = createClient();

    const { error } = await supabase.from('blogs').update({
      title,
      content,
      category,
      cover_image_url: coverImage,
    }).eq('id', params.id);

    if (error) {
      alert('Error updating: ' + error.message);
    } else {
      setMsg('✅ Article Updated Successfully!');
      setTimeout(() => {
        router.push('/admin/blogs'); // Redirect back to control room
      }, 1500);
    }
    setBusy(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading article data...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-800">✏️ Edit Article</h1>
          <p className="text-xs text-gray-500">Update your content and save instantly.</p>
        </div>
        <Link href="/admin/blogs" className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">Cancel</Link>
      </div>
      
      {msg && <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg">{msg}</p>}

      <div className="glass-card p-4 rounded-2xl space-y-4 border border-gray-100 shadow-sm">
        
        {/* TITLE */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Article Title</label>
          <input 
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-forest-500 outline-none" 
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
            className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm h-80 font-mono focus:ring-2 focus:ring-forest-500 outline-none" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
          />
        </div>

        {/* COVER IMAGE */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-200">
              📷 Change Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {coverImage && <img src={coverImage} alt="Cover" className="h-12 w-12 object-cover rounded-md border border-gray-200" />}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button 
          onClick={saveChanges} 
          disabled={busy} 
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform disabled:opacity-50 mt-4"
        >
          {busy ? 'Saving Changes...' : '💾 SAVE & UPDATE ARTICLE'}
        </button>

      </div>
    </div>
  );
}