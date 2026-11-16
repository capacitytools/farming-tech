'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const THEMES = [
  { id: 'theme-green', name: 'Classic Green', color: 'bg-green-800' },
  { id: 'theme-dark', name: 'Modern Dark', color: 'bg-gray-900' },
  { id: 'theme-gold', name: 'Premium Gold', color: 'bg-yellow-600' },
  { id: 'theme-blue', name: 'Trust Blue', color: 'bg-blue-800' },
];

export default function FunnelBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [ctaText, setCtaText] = useState('Get Instant Access');
  const [ctaLink, setCtaLink] = useState('');
  const [theme, setTheme] = useState('theme-green');

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);
    }
    init();
  }, [router]);

  async function createFunnel() {
    if (!title || !bodyCopy || !ctaLink) return alert('Please fill all required fields');
    setLoading(true);
    
    const supabase = createClient();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const { error } = await supabase.from('funnels').insert({
      user_id: user.id,
      slug,
      theme,
      title,
      subheadline,
      body_copy: bodyCopy,
      cta_text: ctaText,
      cta_link: ctaLink,
    });

    if (error) {
      alert('Error creating funnel: ' + error.message);
    } else {
      alert('🚀 Funnel Created Successfully!');
      router.push(`/funnel/${slug}`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER */}
      <div className="bg-forest-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-extrabold">🚀 Funnel Builder</h1>
        <p className="text-xs text-forest-200 mt-1">Create a high-converting landing page to capture leads.</p>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
        
        {/* THEME SELECTION */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">1. Choose a Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <div 
                key={t.id} 
                onClick={() => setTheme(t.id)}
                className={`h-16 rounded-xl cursor-pointer flex items-center justify-center text-[10px] font-bold text-white text-center p-1 ${t.color} ${theme === t.id ? 'ring-4 ring-forest-400 scale-105' : 'opacity-70'}`}
              >
                {t.name}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">2. Funnel Content</p>
          
          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold" placeholder="Main Title (e.g. Get the 2026 Poultry Feed Guide)" value={title} onChange={e => setTitle(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Subheadline (e.g. Stop wasting money on commercial feed)" value={subheadline} onChange={e => setSubheadline(e.target.value)} />
          
          <textarea className="w-full p-3 rounded-xl border border-gray-200 text-sm h-32" placeholder="Body Copy (The sales pitch. Why should they download this?)" value={bodyCopy} onChange={e => setBodyCopy(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Button Text (e.g. Get the Guide Now)" value={ctaText} onChange={e => setCtaText(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Button Link (e.g. https://drive.google.com/your-pdf)" value={ctaLink} onChange={e => setCtaLink(e.target.value)} />
        </div>

        <button onClick={createFunnel} disabled={loading} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform">
          {loading ? 'Creating Funnel...' : '🚀 PUBLISH FUNNEL'}
        </button>

      </div>
    </div>
  );
}