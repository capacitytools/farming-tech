'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';
import { X, Save } from 'lucide-react';

export default function AdminQuickEdit({ blog }: { blog: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(blog.title);
  const [content, setContent] = useState(blog.content);
  const [coverImage, setCoverImage] = useState(blog.cover_image_url || '');

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
    if (!title || !content) return alert('Title and content required');
    setBusy(true);
    
    const supabase = createClient();
    const { error } = await supabase.from('blogs').update({
      title,
      content,
      cover_image_url: coverImage
    }).eq('id', blog.id);

    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      setIsOpen(false);
      // 🚨 THE MAGIC: Force Next.js to refresh the page with the new data 🚨
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <>
      {/* FLOATING EDIT BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-forest-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-2 border-white"
        title="Quick Edit Post"
      >
        <span className="text-xl">✏️</span>
      </button>

      {/* EDIT MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-extrabold text-forest-900">✏️ Quick Edit Article</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                <input className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-forest-500" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Cover Image</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-200">
                    📷 Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {coverImage && <img src={coverImage} alt="Cover" className="h-10 w-10 object-cover rounded-md border border-gray-200" />}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Article Body (Markdown)</label>
                <textarea className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm h-64 font-mono outline-none focus:ring-2 focus:ring-forest-500" value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button onClick={saveChanges} disabled={busy} className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {busy ? 'Saving...' : 'Save & Refresh Page'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}