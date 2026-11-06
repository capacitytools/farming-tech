'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const PIN_W = 1000;
const PIN_H = 1500;

const PIN_STYLES = [
  {
    key: 'bold-band',
    label: '1. Bold Bottom Band',
    desc: 'Forest green band at the bottom.',
    build: (text: string) =>
      'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0F3F1A,l_text:Arial_72_bold:' + encodeURIComponent(text) + ',co_white,g_south,y_120,w_900,c_fit',
  },
  {
    key: 'top-headline',
    label: '2. Top Headline',
    desc: 'Semi-transparent band at the top.',
    build: (text: string) =>
      'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto/co_rgb:0B1F14,l_text:Arial_68_bold:' + encodeURIComponent(text) + ',co_white,g_north,y_100,w_900,c_fit',
  },
  {
    key: 'clean-photo',
    label: '3. Clean Photo',
    desc: 'No text. Best for Instagram/Facebook.',
    build: () => 'c_fill,w_' + PIN_W + ',h_' + PIN_H + ',g_auto,q_auto,f_auto',
  },
];

function buildPinUrl(coverUrl: string, styleKey: string, title: string): string {
  if (!coverUrl || !coverUrl.includes('/upload/')) return '';
  const style = PIN_STYLES.find((s) => s.key === styleKey) || PIN_STYLES[0];
  return coverUrl.replace('/upload/', '/upload/' + style.build(title) + '/');
}

export default function PinterestStudioPage() {
  const [admin, setAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  
  // Image Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImageUrl, setAiImageUrl] = useState('');
  const [imageSize, setImageSize] = useState<'1024x1536' | '1024x1024'>('1024x1536');
  const [generating, setGenerating] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  // Pin State
  const [style, setStyle] = useState('bold-band');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin' || p?.role === 'editor');
    }

    const { data: b } = await supabase
      .from('blogs')
      .select('id,title,slug,category,cover_image_url,meta_description,excerpt,primary_keyword')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    setBlogs(b || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  function pickBlog(b: any) {
    setSelected(b);
    setCustomTitle(b.title.slice(0, 60));
    setCustomDesc((b.meta_description || b.excerpt || b.title) + ' \n\n#FarmingNigeria #' + (b.primary_keyword || b.category || 'Agriculture').replace(/\s+/g, ''));
    setAiImageUrl(b.cover_image_url || '');
    
    // Auto-generate a great image prompt using the title
    setAiPrompt('Photorealistic, high quality, beautiful lighting, ' + b.title + ', in a Nigerian farming setting, lush green environment, professional photography, 8k resolution');
  }

  async function generateAIImage() {
    if (!aiPrompt) return flash('Enter a prompt first.');
    setGenerating(true);
    
    // Pollinations AI is a free, no-API-key image generator
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=${imageSize.split('x')[0]}&height=${imageSize.split('x')[1]}&nologo=true&seed=${seed}`;
    
    // We just set the URL, the browser will load the image. 
    setAiImageUrl(url);
    setGenerating(false);
    flash('Image generated!');
  }

  async function saveAsCover() {
    if (!aiImageUrl) return;
    setSavingCover(true);
    flash('Uploading to Cloudinary...');
    
    try {
      // Fetch the AI image as a blob
      const response = await fetch(aiImageUrl);
      const blob = await response.blob();
      
      // Convert blob to File
      const file = new File([blob], 'ai-cover.jpg', { type: 'image/jpeg' });
      
      // Upload to your existing Cloudinary function
      const secureUrl = await uploadToCloudinary(file, 'blog-covers');
      
      // Update Supabase
      const supabase = createClient();
      const { error } = await supabase.from('blogs').update({ cover_image_url: secureUrl }).eq('id', selected.id);
      
      if (error) throw error;
      
      // Update local state so the Pin generator sees it
      setAiImageUrl(secureUrl);
      setSelected({ ...selected, cover_image_url: secureUrl });
      flash('Cover saved to database successfully!');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setSavingCover(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading...</p>;
  if (!admin) return <p className="text-center p-10">Admin access only.</p>;

  const pinUrl = selected ? buildPinUrl(aiImageUrl || selected.cover_image_url, style, customTitle) : '';

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🪄 AI Image & Pin Studio</h1>
        <p className="text-xs text-gray-500">Generate AI covers, save them to your blog, and create Pinterest pins.</p>
        {msg && <p className="text-xs font-bold text-green-700 mt-1">{msg}</p>}
      </div>

      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-sm font-extrabold text-forest-700">1. PICK AN ARTICLE</p>
        <select
          className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
          value={selected?.id || ''}
          onChange={(e) => {
            const b = blogs.find((x) => x.id === e.target.value);
            if (b) pickBlog(b);
          }}
        >
          <option value="">- Select article -</option>
          {blogs.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {selected && (
        <>
          <div className="glass-card p-4 rounded-2xl space-y-2 border-2 border-purple-400">
            <p className="text-sm font-extrabold text-purple-700">2. GENERATE AI COVER IMAGE</p>
            <textarea
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setImageSize('1024x1536')} className={'flex-1 py-2 rounded-lg text-xs font-bold ' + (imageSize === '1024x1536' ? 'bg-purple-600 text-white' : 'bg-gray-100')}>Vertical (Pin/Reels)</button>
              <button onClick={() => setImageSize('1024x1024')} className={'flex-1 py-2 rounded-lg text-xs font-bold ' + (imageSize === '1024x1024' ? 'bg-purple-600 text-white' : 'bg-gray-100')}>Square (Insta/FB)</button>
            </div>
            
            <button onClick={generateAIImage} disabled={generating} className="w-full bg-purple-600 text-white py-3 rounded-xl font-extrabold text-sm mt-2">
              {generating ? 'Generating Image...' : '🪄 GENERATE AI IMAGE'}
            </button>

            {aiImageUrl && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-center bg-gray-100 p-2 rounded-xl">
                  <img src={aiImageUrl} alt="AI Generated" className="rounded-lg max-h-64 object-cover" />
                </div>
                <div className="flex gap-2">
                  <button onClick={generateAIImage} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-xs font-bold">🔄 Regenerate</button>
                  <button onClick={saveAsCover} disabled={savingCover} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold">
                    {savingCover ? 'Saving...' : '💾 Save as Blog Cover'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">3. PINTEREST OVERLAY</p>
            <textarea
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
              rows={2}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value.slice(0, 60))}
            />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PIN_STYLES.map((s) => (
                <button key={s.key} onClick={() => setStyle(s.key)} className={'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ' + (style === s.key ? 'border-forest-600 bg-forest-50' : 'border-gray-200 text-gray-500')}>
                  {s.label}
                </button>
              ))}
            </div>
            
            {pinUrl ? (
              <div className="bg-gray-100 rounded-2xl p-2 flex justify-center mt-2">
                <img src={pinUrl} alt="Pin" className="rounded-xl shadow-glass" style={{ width: '100%', maxWidth: 280, aspectRatio: '2 / 3' }} />
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Generate an image above to see the pin.</p>
            )}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-2">
            <p className="text-sm font-extrabold text-forest-700">4. PINTEREST DESCRIPTION</p>
            <textarea
              className="w-full p-2 rounded-xl border border-gray-200 bg-white/70 text-sm"
              rows={4}
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value.slice(0, 500))}
            />
            <button onClick={() => { navigator.clipboard.writeText(customDesc); flash('Copied!'); }} className="w-full bg-forest-600 text-white py-2 rounded-xl text-xs font-bold">COPY DESCRIPTION</button>
            <a
              href={'https://www.pinterest.com/pin-builder/?url=' + encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : '') + '/blog/' + selected.slug) + '&media=' + encodeURIComponent(pinUrl) + '&description=' + encodeURIComponent(customDesc)}
              target="_blank" rel="noopener noreferrer"
              className="block text-center bg-red-600 text-white py-3 rounded-xl font-extrabold text-sm mt-2"
            >
              🚀 POST TO PINTEREST
            </a>
          </div>
        </>
      )}
    </div>
  );
}