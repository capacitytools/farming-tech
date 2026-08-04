'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import 'react-quill/dist/quill.snow.css';
import { ImagePlus, Loader2, Save, Send, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/uploadImage';

// react-quill must be client-only (no SSR) — Next.js will error otherwise
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link', 'image'],
    ['clean'],
  ],
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    cover_image_url?: string | null;
    category?: string;
    tags?: string[];
    seo_title?: string;
    seo_description?: string;
  };
}

export default function BlogEditor({ initialData }: BlogEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Poultry');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') ?? '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(initialData?.cover_image_url ?? null);
  const [scheduledFor, setScheduledFor] = useState('');

  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadImage(file, 'blog-images', 'covers/');
      setCoverImage(url);
    } catch (err: any) {
      setError('Cover image upload failed: ' + err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave(status: 'draft' | 'scheduled' | 'published') {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        title,
        slug: slugify(title),
        excerpt,
        content,
        cover_image_url: coverImage,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt,
        status,
        scheduled_for: status === 'scheduled' ? scheduledFor : null,
        published_at: status === 'published' ? new Date().toISOString() : null,
        author_id: user?.id,
      };

      if (initialData?.id) {
        const { error } = await supabase.from('blogs').update(payload).eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blogs').insert(payload);
        if (error) throw error;
      }

      router.push('/admin/blogs');
      router.refresh();
    } catch (err: any) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Cover image */}
      <div>
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
          Cover Image
        </label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="relative w-full h-48 rounded-2xl border-2 border-dashed border-forest-200 dark:border-forest-700 flex items-center justify-center overflow-hidden bg-forest-50 dark:bg-forest-800/50"
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : uploadingCover ? (
            <Loader2 className="w-6 h-6 text-forest-400 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-forest-400">
              <ImagePlus className="w-6 h-6" />
              <span className="text-sm font-semibold">Upload cover image</span>
            </div>
          )}
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 7 Signs Your Poultry Has Newcastle Disease"
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Category + Excerpt */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            {['Poultry', 'Goats', 'Fish', 'Rabbits', 'Pigs', 'Dogs', 'Crops', 'AI & Tech', 'Business'].map(
              (c) => (
                <option key={c} value={c}>{c}</option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="poultry, disease, vaccination"
            className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
          Excerpt (shown on cards & search results)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-forest-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Rich text editor */}
      <div>
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 block">
          Content
        </label>
        <div className="bg-white dark:bg-forest-800 rounded-xl overflow-hidden border border-forest-200 dark:border-forest-700">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={QUILL_MODULES}
            placeholder="Write your article here..."
            className="[&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-forest-900 dark:[&_.ql-editor]:text-white"
          />
        </div>
      </div>

      {/* SEO fields */}
      <div className="glass-card-sm p-4 space-y-3">
        <p className="text-sm font-bold text-forest-800 dark:text-forest-100">SEO Settings</p>
        <input
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          placeholder={`SEO Title (defaults to: "${title || 'post title'}")`}
          className="w-full px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        <textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={2}
          placeholder="SEO meta description (150-160 characters ideal)"
          className="w-full px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Scheduling */}
      <div className="glass-card-sm p-4">
        <label className="text-sm font-bold text-forest-800 dark:text-forest-100 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Schedule for later (optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 sticky bottom-4">
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="btn-secondary flex-1 min-w-[140px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Draft
        </button>
        {scheduledFor && (
          <button
            onClick={() => handleSave('scheduled')}
            disabled={saving}
            className="btn-secondary flex-1 min-w-[140px]"
          >
            <Clock className="w-4 h-4" /> Schedule
          </button>
        )}
        <button
          onClick={() => handleSave('published')}
          disabled={saving}
          className="btn-primary flex-1 min-w-[140px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publish Now
        </button>
      </div>
    </div>
  );
}
