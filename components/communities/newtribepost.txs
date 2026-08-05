'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ImagePlus, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/uploadImage';

export default function NewTribePost({ tribeId }: { tribeId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!content.trim()) return;
    setPosting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to post.');
        setPosting(false);
        return;
      }

      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'listing-images', 'tribe-posts/');
      }

      const { error } = await supabase.from('tribe_posts').insert({
        tribe_id: tribeId,
        author_id: user.id,
        content,
        image_url: imageUrl,
      });

      if (error) throw error;

      setContent('');
      setImageFile(null);
      setImagePreview(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to post.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="glass-card p-4 mb-4">
      {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share a tip, question, or update with the tribe..."
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm text-forest-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
      />

      {imagePreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagePreview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-xl" />
      )}

      <div className="flex items-center justify-between mt-3">
        <label className="flex items-center gap-1.5 text-xs font-bold text-forest-500 cursor-pointer">
          <ImagePlus className="w-4 h-4" />
          Add photo
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <button
          onClick={handlePost}
          disabled={posting || !content.trim()}
          className="flex items-center gap-1.5 bg-forest-600 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Post
        </button>
      </div>
    </div>
  );
}
