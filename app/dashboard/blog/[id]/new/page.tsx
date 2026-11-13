'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function StudioNewPost({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);
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
    } catch (err: any) { alert('Upload failed'); }
    setBusy(false);
  }

  async function publishPost() {
    if (!title || !content) return alert('Title and Content are required.');
    setBusy(true);
    const supabase = createClient();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('blogs').insert({
      title, slug, content, cover_image_url: coverImage,
      status: 'published', blog_id: params.id, author_id: user.id, 
      author_name: user.email?.split('@')[0] || 'Farmer', indexable: true,
    });

    if (error) alert('Error: ' + error.message);
    else router.push(`/dashboard/blog/${params.id}`);
    setBusy(false);
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-extrabold text-forest-800">✍️ New Post</h1>
      <input className="w-full p-3 rounded-xl border text-sm font-bold" placeholder="Article Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full p-3 rounded-xl border text-sm h-64 font-mono" placeholder="Write your article here..." value={content} onChange={(e) => setContent(e.target.value)} />
      <div>
        <label className="bg-white border px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm">📷 Upload Cover Image
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        {coverImage && <img src={coverImage} className="h-16 mt-2 rounded-md" />}
      </div>
      <button onClick={publishPost} disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md">{busy ? 'Publishing...' : '🚀 Publish'}</button>
    </div>
  );
}