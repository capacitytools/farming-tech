'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadToCloudinary } from '@/lib/upload';
import { Image as ImageIcon, Link as LinkIcon, MessageCircle, Download } from 'lucide-react';

const THEMES = [
  { id: 'theme-green', name: 'Classic Green', color: 'bg-forest-600', bg: 'bg-forest-50' },
  { id: 'theme-dark', name: 'Modern Dark', color: 'bg-gray-900', bg: 'bg-gray-100' },
  { id: 'theme-gold', name: 'Premium Gold', color: 'bg-yellow-600', bg: 'bg-yellow-50' },
  { id: 'theme-blue', name: 'Trust Blue', color: 'bg-blue-700', bg: 'bg-blue-50' },
];

const CTA_TYPES = [
  { id: 'download', label: 'Download File', icon: Download },
  { id: 'whatsapp', label: 'WhatsApp Link', icon: MessageCircle },
  { id: 'purchase', label: 'Buy Now Link', icon: LinkIcon },
];

export default function FunnelBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [ctaText, setCtaText] = useState('Get Instant Access');
  const [ctaLink, setCtaLink] = useState('');
  const [ctaType, setCtaType] = useState('download');
  const [heroImage, setHeroImage] = useState('');
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

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file, 'funnels');
      setHeroImage(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  }

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
      cta_type: ctaType,
      hero_image: heroImage,
    });

    if (error) {
      alert('Error creating funnel: ' + error.message);
    } else {
      alert('🚀 Funnel Created Successfully!');
      router.push(`/funnel/${slug}`);
    }
    setLoading(false);
  }

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];

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
                className={`h-16 rounded-xl cursor-pointer flex items-center justify-center text-[10px] font-bold text-white text-center p-1 ${t.color} ${theme === t.id ? 'ring-4 ring-forest-400 scale-105 shadow-lg' : 'opacity-70'}`}
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

          {/* HERO IMAGE UPLOAD */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hero Image (Optional)</label>
            <div className="flex gap-2">
              <input className="flex-1 p-2 rounded-lg border border-gray-200 text-xs" placeholder="Image URL..." value={heroImage} onChange={e => setHeroImage(e.target.value)} />
              <label className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shadow-sm">
                {uploading ? 'Wait...' : '📷 Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {heroImage && <img src={heroImage} alt="Hero" className="h-20 object-cover mt-2 rounded-lg" />}
          </div>
        </div>

        {/* CTA CONFIGURATION */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">3. Call to Action</p>
          
          <div className="grid grid-cols-3 gap-2">
            {CTA_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setCtaType(type.id)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${ctaType === type.id ? 'border-forest-500 bg-forest-50 text-forest-800' : 'border-gray-100 text-gray-500'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{type.label}</span>
                </button>
              );
            })}
          </div>

          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Button Text (e.g. Get the Guide Now)" value={ctaText} onChange={e => setCtaText(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Button Link (e.g. https://drive.google.com/...)" value={ctaLink} onChange={e => setCtaLink(e.target.value)} />
        </div>

        {/* LIVE PREVIEW */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Live Preview</p>
          <div className={`p-4 rounded-xl border-2 border-dashed border-gray-300 ${activeTheme.bg}`}>
            {heroImage && <img src={heroImage} alt="Preview" className="w-full h-24 object-cover rounded-lg mb-2" />}
            <h3 className="text-sm font-extrabold text-gray-900 text-center">{title || 'Your Main Title'}</h3>
            <p className="text-[10px] text-gray-600 text-center">{subheadline || 'Your Subheadline'}</p>
            <div className={`mt-2 py-2 rounded-lg text-center text-white text-xs font-bold ${activeTheme.color}`}>
              {ctaText || 'Your Button Text'}
            </div>
          </div>
        </div>

        <button onClick={createFunnel} disabled={loading || uploading} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md active:scale-95 transition-transform">
          {loading ? 'Creating Funnel...' : '🚀 PUBLISH FUNNEL'}
        </button>

      </div>
    </div>
  );
}