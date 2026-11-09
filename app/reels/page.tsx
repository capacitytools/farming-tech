'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';

const CATEGORIES = [
  'All',
  'Livestock & Poultry',
  'Farm Equipment',
  'AgriTech & AI',
  'Crops & Aquaculture',
  'Agribusiness',
  'Gadgets & Tools'
];

export default function ReelsPage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All');
  const [showComposer, setShowComposer] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  // Composer State
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState('Farm Equipment');
  const [productTitle, setProductTitle] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productImage, setProductImage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);

    let query = supabase.from('videos').select('*, profiles(full_name, avatar_url)').order('created_at', { ascending: false });
    if (activeCat !== 'All') {
      query = query.eq('category', activeCat);
    }
    
    const { data } = await query;
    setVideos(data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, [activeCat]);

  function flash(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadToCloudinary(file, 'products');
      setProductImage(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setBusy(false);
  }

  async function publishVideo() {
    if (!youtubeUrl) return alert('YouTube URL is required.');
    setBusy(true);
    const supabase = createClient();

    const { error } = await supabase.from('videos').insert({
      author_id: user.id,
      context: 'reels', 
      aspect_ratio: 'portrait',
      title,
      youtube_url: youtubeUrl,
      category,
      product_title: productTitle || null,
      product_link: productLink || null,
      product_image: productImage || null,
    });

    if (error) {
      alert('Error saving video: ' + error.message);
    } else {
      setShowComposer(false);
      setTitle(''); setYoutubeUrl(''); setProductTitle(''); setProductLink(''); setProductImage('');
      load();
    }
    setBusy(false);
  }

  // 🚨 THE ULTIMATE YOUTUBE LINK PARSER 🚨
  function getYouTubeId(url: string) {
    if (!url) return '';
    // Handles youtube.com, youtu.be, shorts, embeds, etc.
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  // 🚨 SHARE FUNCTION (Links back to YOUR site) 🚨
  function shareVideo(video: any, platform: string) {
    // This is the secret: We share YOUR url, not YouTube's url.
    const myBrandUrl = `https://www.farmingtechbusiness.com/reels`; 
    const text = `Watch this Agri-Reel on Farming Tech & Business: ${video.title || 'Amazing farm video'} 🌾`;
    
    if (platform === 'wa') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + myBrandUrl)}`, '_blank');
    } else if (platform === 'fb') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(myBrandUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(myBrandUrl);
      flash('🔗 Link copied to your platform!');
    }
  }

  if (!loaded) return <p className="text-center p-10">Loading Reels...</p>;

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-5 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">🎬 Agri-Reels</h1>
        <p className="text-[11px] text-forest-200 mt-0.5">Watch, learn, and shop farm equipment.</p>
        
        {user && (
          <button 
            onClick={() => setShowComposer(!showComposer)} 
            className="mt-3 bg-amber-400 text-forest-900 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition-transform w-full"
          >
            {showComposer ? '✕ Close Uploader' : '📹 Upload New Video / Reel'}
          </button>
        )}
        {msg && <p className="text-xs font-bold text-amber-300 mt-2 bg-black/30 p-2 rounded-lg">{msg}</p>}
      </div>

      {/* UPLOAD FORM */}
      {showComposer && user && (
        <div className="p-4 bg-white shadow-inner border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">YouTube Video URL *</label>
              <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Video Title</label>
                <input className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" placeholder="e.g. Best Incubator" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
                <select className="w-full p-2 rounded-xl border border-gray-200 text-sm mt-1" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* PRODUCT CARD */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
              <p className="text-xs font-bold text-amber-800">🛍️ Attach a Product Card (Optional)</p>
              <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Product Name (e.g., 256 Egg Incubator)" value={productTitle} onChange={e => setProductTitle(e.target.value)} />
              <input className="w-full p-2 rounded-lg border border-amber-200 text-xs" placeholder="Affiliate Link (e.g., farmingtechbusiness.com/go/incubator)" value={productLink} onChange={e => setProductLink(e.target.value)} />
              <div className="flex items-center gap-2">
                <label className="bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                  📷 Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {productImage && <img src={productImage} className="h-8 w-8 rounded object-cover" alt="Product" />}
              </div>
            </div>

            <button onClick={publishVideo} disabled={busy} className="w-full bg-forest-800 text-white py-3 rounded-xl font-extrabold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-50">
              {busy ? 'Publishing...' : '🚀 PUBLISH VIDEO'}
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCat(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeCat === cat ? 'bg-forest-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAGAZINE VIDEO FEED */}
      <div className="p-4 space-y-8">
        {videos.map(video => {
          const ytId = getYouTubeId(video.youtube_url);
          
          return (
            <div key={video.id} className="bg-forest-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-forest-700">
              
              {/* 🚨 BRANDED VIDEO PLAYER FRAME 🚨 */}
              <div className="relative w-full aspect-[9/16] bg-black">
                {ytId ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0`} // 🚨 Hides YouTube branding where possible
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs">Video Unavailable</div>
                )}
              </div>

              {/* BRANDED INFO SECTION */}
              <div className="p-4 bg-gradient-to-b from-forest-900 to-forest-800">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">{video.category}</p>
                    <h2 className="text-lg font-extrabold text-white leading-tight">{video.title || 'Agri-Reel'}</h2>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-forest-900">FTB</div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 border-t border-forest-700 pt-3">
                  {video.profiles?.avatar_url ? (
                    <img src={video.profiles.avatar_url} className="w-7 h-7 rounded-full border border-forest-500" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-[10px] font-bold text-white">
                      {video.profiles?.full_name?.[0] || 'F'}
                    </div>
                  )}
                  <p className="text-xs font-bold text-forest-200">{video.profiles?.full_name || 'Farmer'}</p>
                  
                  {/* 🚨 SHARE BUTTONS 🚨 */}
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => shareVideo(video, 'wa')} className="text-lg bg-forest-800 p-1.5 rounded-lg shadow-sm hover:bg-forest-700">📤</button>
                    <button onClick={() => shareVideo(video, 'fb')} className="text-lg bg-forest-800 p-1.5 rounded-lg shadow-sm hover:bg-forest-700">f</button>
                    <button onClick={() => shareVideo(video, 'copy')} className="text-lg bg-forest-800 p-1.5 rounded-lg shadow-sm hover:bg-forest-700">🔗</button>
                  </div>
                </div>
              </div>

              {/* SHOPPABLE PRODUCT CARD */}
              {video.product_title && video.product_link && (
                <div className="m-4 mt-0 p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3 shadow-lg">
                  {video.product_image ? (
                    <img src={video.product_image} className="w-14 h-14 object-cover rounded-lg bg-white" alt={video.product_title} />
                  ) : (
                    <div className="w-14 h-14 bg-amber-200 rounded-lg flex items-center justify-center text-2xl">🛍️</div>
                  )}
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Featured Product</p>
                    <p className="text-xs font-extrabold text-amber-900 leading-tight mb-1.5 line-clamp-2">{video.product_title}</p>
                    <a href={video.product_link} target="_blank" rel="noopener noreferrer" className="block bg-amber-500 text-white text-center py-1.5 rounded-lg text-[10px] font-extrabold shadow-sm active:scale-95">
                      Buy Now →
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🎬</p>
            <p className="text-sm font-bold text-gray-700">No videos here yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to upload a video in this category!</p>
          </div>
        )}
      </div>
    </div>
  );
}