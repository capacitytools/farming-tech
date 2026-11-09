'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SingleVideoPage() {
  const params = useParams();
  const [video, setVideo] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchVideo() {
      const supabase = createClient();
      const { data } = await supabase.from('videos').select('*, profiles(full_name, avatar_url)').eq('id', params.id).single();
      if (data) setVideo(data);
      setLoaded(true);
    }
    fetchVideo();
  }, [params.id]);

  function getYouTubeId(url: string) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  if (!loaded) return <p className="text-center p-10">Loading video...</p>;
  if (!video) return <p className="text-center p-10">Video not found.</p>;

  const rawUrl = video.youtube_id || video.youtube_url || video.video_url || '';
  const finalYtId = rawUrl.length === 11 ? rawUrl : getYouTubeId(rawUrl);

  return (
    <div className="min-h-screen bg-forest-900 p-4 max-w-2xl mx-auto flex flex-col justify-center">
      
      <div className="text-center mb-4">
        <Link href="/" className="text-xl font-extrabold text-white">🌾 Farming Tech & Business</Link>
        <p className="text-xs text-forest-300">Watch. Learn. Grow.</p>
      </div>

      <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-forest-700">
        <div className="relative w-full aspect-[9/16]">
          {finalYtId ? (
            <iframe src={`https://www.youtube.com/embed/${finalYtId}?modestbranding=1&rel=0`} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media;" allowFullScreen />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">Video Unavailable</div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-forest-800 p-4 rounded-2xl">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{video.category}</p>
        <h1 className="text-xl font-extrabold text-white mt-1">{video.title}</h1>
        <p className="text-xs text-forest-300 mt-2">By {video.profiles?.full_name || 'Farmer'}</p>
      </div>

      {video.product_title && video.product_link && (
        <div className="mt-4 bg-amber-50 p-4 rounded-2xl flex items-center gap-3 border-2 border-amber-300">
          {video.product_image && <img src={video.product_image} className="w-16 h-16 object-cover rounded-lg" alt="" />}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Featured Product</p>
            <p className="text-sm font-extrabold text-amber-900">{video.product_title}</p>
            <a href={video.product_link} className="block mt-2 bg-amber-500 text-white text-center py-2 rounded-lg text-xs font-bold">Buy Now →</a>
          </div>
        </div>
      )}
      
      <Link href="/reels" className="text-center text-forest-300 text-xs mt-6 underline">← Back to all Reels</Link>
    </div>
  );
}