'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook Ads', color: 'bg-blue-600', icon: '📘' },
  { id: 'tiktok', name: 'TikTok Ads', color: 'bg-red-600', icon: '🎵' },
  { id: 'instagram', name: 'Instagram Ads', color: 'bg-gradient-to-r from-purple-600 to-pink-600', icon: '📸' },
  { id: 'google', name: 'Google Ads', color: 'bg-purple-600', icon: '🔍' },
];

const GOALS = [
  'Get more sales',
  'Get more WhatsApp messages',
  'Build brand awareness',
];

export default function AdsHelperDashboard() {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // Form State
  const [platform, setPlatform] = useState('facebook');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [goal, setGoal] = useState('Get more sales');

  // 🚨 THE SMART TEMPLATE ENGINE (NO AI NEEDED) 🚨
  async function generateAd() {
    if (!product || !audience) return alert('Please fill all fields');
    setLoading(true);
    setGeneratedData(null);

    // Simulate a tiny load time for UX
    setTimeout(async () => {
      const p = product.toUpperCase();
      const a = audience.toLowerCase();
      const c = country;

      // 1. Generate the Ad Plan
      const adPlan = `Target ${a} in ${c} using a ${platform} campaign. 
      Budget: Start with a low daily budget (e.g., ₦2,000 - ₦5,000) and scale up when you get a positive ROI. 
      Strategy: Since your goal is to "${goal}", use a direct-response video or image showing the ${p} in action, followed by a strong call-to-action.`;

      // 2. Generate the Sales Copy based on the Goal
      let salesCopy = '';
      if (goal === 'Get more sales') {
        salesCopy = `🚨 Attention ${a} in ${c}!\n\nAre you tired of struggling with old methods? We just launched the ${p} to help you save time and make more money.\n\n✅ High quality and proven to work.\n✅ Perfect for beginners and experts.\n\n👇 Click the link below to get yours at a special price today:\n[Insert Link Here]`;
      } else if (goal === 'Get more WhatsApp messages') {
        salesCopy = `👋 Hello ${a} in ${c}!\n\nLooking for the best ${p}? Stop searching. We have exactly what you need.\n\nSend us a direct WhatsApp message right now to place your order and get fast delivery.\n\n📲 Click here to chat with us: [Insert WhatsApp Link]`;
      } else {
        salesCopy = `🌾 Calling all ${a} in ${c}!\n\nHave you seen the new ${p}? It is changing the way things are done. \n\nJoin thousands of others who are already seeing results.\n\n👉 Learn more on our website: [Insert Link]`;
      }

      // 3. Generate the Image Prompt
      const imagePrompt = `Professional photorealistic image of ${product} in a ${c} setting. High quality, 8k resolution, stunning lighting, marketing photography style, focusing on the product as the hero, no text.`;

      // 4. Save to Database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('ad_campaigns').insert({
          user_id: user.id,
          platform,
          product_name: product,
          audience,
          country,
          ad_plan: adPlan,
          sales_copy: salesCopy,
          landing_page_url: '/feeds',
        });
      }

      setGeneratedData({
        ad_plan: adPlan,
        sales_copy: salesCopy,
        image_prompt: imagePrompt,
        landing_page: '/feeds'
      });
      
      setLoading(false);
    }, 500);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24 font-sans">
      
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-red-900 p-6 rounded-b-3xl shadow-2xl">
        <h1 className="text-3xl font-extrabold">🚀 Ads Helper</h1>
        <p className="text-sm text-gray-300 mt-1">Generate ads, landing pages, and copy in seconds.</p>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6 mt-4">
        
        {/* 1. PLATFORM */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">1. Select Platform</p>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map(p => (
              <button 
                key={p.id} 
                onClick={() => setPlatform(p.id)}
                className={`p-4 rounded-2xl font-bold flex items-center gap-2 transition-all ${platform === p.id ? `${p.color} text-white shadow-lg scale-105` : 'bg-gray-800 text-gray-400'}`}
              >
                <span className="text-2xl">{p.icon}</span> {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. DETAILS */}
        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">2. Campaign Details</p>
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-purple-500 outline-none" placeholder="Product / Service (e.g. Feed Formulation E-book)" value={product} onChange={e => setProduct(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-blue-500 outline-none" placeholder="Target Audience (e.g. Poultry Farmers)" value={audience} onChange={e => setAudience(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-red-500 outline-none" placeholder="Country (e.g. Nigeria)" value={country} onChange={e => setCountry(e.target.value)} />

          {/* 3. GOAL */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Campaign Goal</p>
            <select className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-green-500 outline-none" value={goal} onChange={e => setGoal(e.target.value)}>
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <button onClick={generateAd} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-red-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 mt-4">
            {loading ? 'Building Your Campaign...' : '✨ GENERATE CAMPAIGN'}
          </button>
        </div>

        {/* RESULTS */}
        {generatedData && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-purple-900/50 p-4 rounded-2xl border border-purple-500">
              <p className="text-xs font-bold text-purple-300 uppercase mb-2">📊 Ad Strategy</p>
              <p className="text-sm whitespace-pre-line">{generatedData.ad_plan}</p>
              <button onClick={() => copyToClipboard(generatedData.ad_plan)} className="mt-2 text-[10px] bg-purple-600 text-white px-3 py-1 rounded-lg">Copy</button>
            </div>

            <div className="bg-blue-900/50 p-4 rounded-2xl border border-blue-500">
              <p className="text-xs font-bold text-blue-300 uppercase mb-2">📝 Sales Copy</p>
              <p className="text-sm whitespace-pre-line">{generatedData.sales_copy}</p>
              <button onClick={() => copyToClipboard(generatedData.sales_copy)} className="mt-2 text-[10px] bg-blue-600 text-white px-3 py-1 rounded-lg">Copy</button>
            </div>

            <div className="bg-red-900/50 p-4 rounded-2xl border border-red-500">
              <p className="text-xs font-bold text-red-300 uppercase mb-2">🎨 Image Prompt</p>
              <p className="text-sm font-mono text-xs">{generatedData.image_prompt}</p>
              <button onClick={() => copyToClipboard(generatedData.image_prompt)} className="mt-2 text-[10px] bg-red-600 text-white px-3 py-1 rounded-lg">Copy Prompt</button>
            </div>

            <div className="bg-green-900/50 p-4 rounded-2xl border border-green-500">
              <p className="text-xs font-bold text-green-300 uppercase mb-2">🔗 Landing Page</p>
              <p className="text-sm">farmingtechbusiness.com{generatedData.landing_page}</p>
              <button onClick={() => copyToClipboard(`https://www.farmingtechbusiness.com${generatedData.landing_page}`)} className="mt-2 text-[10px] bg-green-600 text-white px-3 py-1 rounded-lg">Copy Link</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}