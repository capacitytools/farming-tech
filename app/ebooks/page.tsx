'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { currencySymbol } from '@/lib/currency';

export default function EbooksPage() {
  const [user, setUser] = useState<any>(null);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      const { data } = await supabase
        .from('ebooks')
        .select('*, profiles(full_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setEbooks(data || []);
      setLoaded(true);
    }
    load();
  }, []);

  function copyShareLink(id: string, affiliateCode: string) {
    // 🚨 FIXED: Uses your custom domain instead of the Vercel URL 🚨
    const baseUrl = 'https://www.farmingtechbusiness.com';
    const url = affiliateCode 
      ? `${baseUrl}/ebooks?id=${id}&ref=${affiliateCode}`
      : `${baseUrl}/ebooks?id=${id}`;
      
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }

  if (!loaded) return <p className="text-center p-10">Loading E-book Store...</p>;

  return (
    <div className="pb-24 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">📚 E-book Store</h1>
        <p className="text-xs text-forest-200 mt-1">Tap any ebook for full details. Price 0 = free gift. Share links with your code and earn.</p>
      </div>

      <div className="p-4 space-y-4 mt-2">
        {ebooks.map((ebook) => {
          const affiliateCode = user?.user_metadata?.referral_code || user?.id?.slice(0, 6) || '';
          
          return (
            <div key={ebook.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex gap-3 p-3">
                {/* COVER */}
                <div className="w-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative aspect-[2/3]">
                  {ebook.cover_url ? (
                    <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-sm font-extrabold text-forest-900 line-clamp-2 leading-tight">{ebook.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">by {ebook.profiles?.full_name || 'Farmer'}</p>
                  
                  <div className="mt-2">
                    <span className="inline-block bg-forest-50 text-forest-800 text-xs font-extrabold px-3 py-1 rounded-lg">
                      {Number(ebook.price) === 0 ? 'FREE' : `${currencySymbol(ebook.currency || 'NGN')}${Number(ebook.price).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 p-3 pt-0 mt-auto">
                <Link href={`/ebooks?id=${ebook.id}`} className="flex-1 bg-forest-600 text-white py-2 rounded-xl text-xs font-bold text-center">
                  View Details
                </Link>
                <button 
                  onClick={() => copyShareLink(ebook.id, affiliateCode)} 
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${copied === ebook.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {copied === ebook.id ? '✅ Copied!' : '🔗 Share Link'}
                </button>
              </div>
            </div>
          );
        })}
        
        {ebooks.length === 0 && <p className="text-center text-gray-500 py-10">No ebooks available yet.</p>}
      </div>
    </div>
  );
}