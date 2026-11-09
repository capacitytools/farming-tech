'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import VideoComposer from '@/components/VideoComposer';
import AdBanner from '@/components/AdBanner';

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

  if (!loaded) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="bg-forest-900 text-white p-4 rounded-b-3xl">
        <h1 className="text-2xl font-extrabold mb-2">🎬 Agri-Reels</h1>
        <p className="text-xs text-forest-200">Watch, learn, and buy farm equipment.</p>
        
        {user && (
          <button onClick={() => setShowComposer(!showComposer)} className="mt-3 bg-amber-400 text-forest-900 px-4 py-2 rounded-xl text-xs font-bold shadow-md">
            {showComposer ? 'Close Composer' : '+ Upload Video'}
          </button>
        )}
      </div>

      {/* COMPOSER */}
      {showComposer && user && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <VideoComposer context="feed" initialAspect="portrait" onDone={() => { setShowComposer(false); load(); }} />
        </div>
      )}

      {/* CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto p-4 border-b border-gray-200 bg-white">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCat(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors ${activeCat === cat ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* VIDEO FEED */}
      <div className="p-4 space-y-6">
        {videos.map(video => (
          <div key={video.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            
            {/* VIDEO PLAYER (Assuming you have a VideoCard component, if not, use an iframe) */}
            <div className="relative w-full aspect-[9/16] bg-black">
              <iframe 
                src={`https://www.youtube.com/embed/${video.youtube_url.split('v=')[1]?.split('&')[0] || video.youtube_url.split('/').pop()}`} 
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>

            {/* VIDEO INFO */}
            <div className="p-4">
              <p className="text-xs font-bold text-forest-600 uppercase mb-1">{video.category}</p>
              <h2 className="text-lg font-extrabold text-forest-900">{video.title || 'Farm Video'}</h2>
              
              <div className="flex items-center gap-2 mt-2">
                {video.profiles?.avatar_url && <img src={video.profiles.avatar_url} className="w-6 h-6 rounded-full" alt="" />}
                <p className="text-xs font-bold text-gray-700">{video.profiles?.full_name || 'Farmer'}</p>
              </div>
            </div>

            {/* 🚨 PRODUCT AD CARD 🚨 */}
            {video.product_title && video.product_link && (
              <div className="m-4 mt-0 p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3">
                {video.product_image ? (
                  <img src={video.product_image} className="w-16 h-16 object-cover rounded-lg bg-white" alt={video.product_title} />
                ) : (
                  <div className="w-16 h-16 bg-amber-200 rounded-lg flex items-center justify-center text-2xl">🛍️</div>
                )}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Featured Product</p>
                  <p className="text-sm font-extrabold text-amber-900 leading-tight mb-2">{video.product_title}</p>
                  <a href={video.product_link} target="_blank" rel="noopener noreferrer" className="block bg-amber-500 text-white text-center py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95">
                    Check Price & Buy →
                  </a>
                </div>
              </div>
            )}

            {/* ADSENSE AD SLOT (Between videos) */}
            <div className="p-4 border-t border-gray-100">
              <AdBanner slot="reels_infeed" />
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-center text-gray-500 py-10">No videos in this category yet.</p>}
      </div>
    </div>
  );
}