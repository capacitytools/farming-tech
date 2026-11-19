'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

export default function MediaLibraryPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
    setMedia(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title || !description) return alert('Please enter a Title and Description first.');

    setBusy(true);
    try {
      // 1. Upload to Cloudinary
      const url = await uploadToCloudinary(file, 'blog-media');

      // 2. Save to database
      const supabase = createClient();
      const { error } = await supabase.from('media_library').insert({
        title,
        description,
        url,
      });

      if (error) throw error;

      flash('✅ Image uploaded successfully!');
      setTitle(''); setDescription('');
      load();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  function copyMarkdown(url: string, altText: string) {
    const code = `![${altText}](${url})`;
    navigator.clipboard.writeText(code);
    flash('📋 Markdown code copied to clipboard!');
  }

  async function deleteMedia(id: string) {
    if (!window.confirm('Remove this image from the library?')) return;
    const supabase = createClient();
    await supabase.from('media_library').delete().eq('id', id);
    load();
  }

  if (!loaded) return <p className="text-center p-10">Loading Media Library...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🖼️ Media Library</h1>
        <p className="text-xs text-gray-500">Upload images, get Markdown codes, and paste them into your articles.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1 bg-green-50 p-2 rounded-lg">{msg}</p>}
      </div>

      {/* UPLOAD FORM */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <p className="text-sm font-extrabold text-forest-700">1. Upload New Image</p>
        
        <input 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-forest-500 outline-none" 
          placeholder="Image Title (e.g., Holland Lop Rabbit)" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        
        <textarea 
          className="w-full p-3 rounded-xl border border-gray-200 text-sm h-20 focus:ring-2 focus:ring-forest-500 outline-none" 
          placeholder="Describe the image for Google (ALT text). E.g., A white Holland Lop rabbit sitting on a rug in an apartment." 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />

        <label className={`block w-full text-center py-4 rounded-xl font-extrabold text-sm shadow-md cursor-pointer transition-colors ${busy || !title || !description ? 'bg-gray-300 text-gray-500' : 'bg-forest-600 text-white hover:bg-forest-700'}`}>
          {busy ? 'Uploading to Cloudinary...' : '📷 Select Image from Phone'}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={busy || !title || !description} 
          />
        </label>
        <p className="text-[10px] text-gray-400 text-center">Please fill Title and Description before uploading.</p>
      </div>

      {/* MEDIA LIST */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold text-gray-700">Your Images ({media.length})</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {media.map((m) => (
            <div key={m.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <img src={m.url} alt={m.description} className="w-20 h-20 object-cover rounded-lg bg-gray-50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-forest-900 line-clamp-1">{m.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{m.description}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button 
                  onClick={() => copyMarkdown(m.url, m.description)} 
                  className="flex-1 bg-forest-600 text-white py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  📋 Copy Markdown Code
                </button>
                <button 
                  onClick={() => deleteMedia(m.id)} 
                  className="w-12 bg-red-50 text-red-500 rounded-lg text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        {media.length === 0 && <p className="text-center text-gray-500 py-6">No images in your library yet.</p>}
      </div>

      <div className="text-center">
        <Link href="/admin" className="text-xs font-bold text-forest-600 hover:underline">← Back to Admin Console</Link>
      </div>
    </div>
  );
}