'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function UserEditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    async function fetchPost() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data } = await supabase.from('blogs').select('*').eq('id', params.id).eq('author_id', user.id).single();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setCoverImage(data.cover_image_url || '');
      }
      setLoaded(true);
    }
    fetchPost();
  }, [params.id, router]);

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'blog-covers');
      setCoverImage(url);
    } catch (err: any) { alert('Upload failed'); }
    setBusy(false);
  }

  async function savePost() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('blogs').update({ title, content, cover_image_url: coverImage }).eq('id', params.id);
    if (error) alert(error.message);
    else router.push('/dashboard/blog');
    setBusy(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-forest-800">✏️ Edit Post</h1>

      <input className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
      
      <textarea className="w-full p-3 rounded-xl border border-gray-200 text-sm h-64 font-mono" value={content} onChange={(e) => setContent(e.target.value)} />

      <div>
        <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
          📷 Change Cover Image
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        {coverImage && <img src={coverImage} alt="Cover" className="h-16 mt-2 rounded-md" />}
      </div>

      <button onClick={savePost} disabled={busy} className="w-full bg-blue-600 text-white py-4 rounded-xl font-extrabold shadow-md">
        {busy ? 'Saving...' : '💾 SAVE CHANGES'}
      </button>
    </div>
  );
}