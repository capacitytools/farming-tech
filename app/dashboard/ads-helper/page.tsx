'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook Ads', color: 'bg-blue-600', icon: '📘' },
  { id: 'tiktok', name: 'TikTok Ads', color: 'bg-red-600', icon: '🎵' },
  { id: 'instagram', name: 'Instagram Ads', color: 'bg-gradient-to-r from-purple-600 to-pink-600', icon: '📸' },
  { id: 'google', name: 'Google Ads', color: 'bg-purple-600', icon: '🔍' },
];

export default function AdsHelperDashboard() {
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // Form State
  const [platform, setPlatform] = useState('facebook');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [country, setCountry] = useState('Nigeria');

  async function generateAd() {
    if (!product || !audience) return alert('Please fill all fields');
    setLoading(true);
    setGeneratedData(null);

    let key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      const p = window.prompt('Paste your Google Gemini API key:');
      if (!p) return;
      key = p.trim();
      localStorage.setItem('ftb_gemini_key', key);
    }

    const systemPrompt = `You are an Expert ${platform} Ads Manager. Generate a campaign for:
    Product: ${product}
    Audience: ${audience}
    Country: ${country}
    
    Output ONLY valid JSON. No markdown, no conversational text.
    Format:
    {
      "ad_plan": "3-sentence strategy.",
      "sales_copy": "High-converting ad caption.",
      "image_prompt": "AI image generator prompt.",
      "landing_page": "/feeds"
    }`;

    // 🚨 SWAPPED TO 2.5-FLASH FOR FASTER RESPONSE 🚨
    const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
    let text = '';

    for (let i = 0; i < models.length; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: 'Generate the campaign.' }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) break;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // If the first model times out, try the next one
          if (i === models.length - 1) {
            alert('Google AI is very busy right now. Please try again in a minute.');
            setLoading(false);
            return;
          }
          console.warn('Model timed out, trying fallback...');
          continue;
        }
        console.error(err);
      }
    }

    if (!text) {
      alert('AI failed to respond. Please check your internet and try again.');
      setLoading(false);
      return;
    }

    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('ad_campaigns').insert({
          user_id: user.id,
          platform,
          product_name: product,
          audience,
          country,
          ad_plan: parsed.ad_plan,
          sales_copy: parsed.sales_copy,
          landing_page_url: parsed.landing_page,
        });
      }

      setGeneratedData(parsed);
    } catch (e) {
      console.error('Raw Output:', text);
      alert('AI format error. Please try again.');
    }
    setLoading(false);
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

        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">2. Campaign Details</p>
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-purple-500 outline-none" placeholder="Product / Service" value={product} onChange={e => setProduct(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-blue-500 outline-none" placeholder="Target Audience" value={audience} onChange={e => setAudience(e.target.value)} />
          
          <input className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm focus:border-red-500 outline-none" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />

          <button onClick={generateAd} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-red-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 mt-4">
            {loading ? 'Generating... (Please wait)' : '✨ GENERATE CAMPAIGN'}
          </button>
        </div>

        {generatedData && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-purple-900/50 p-4 rounded-2xl border border-purple-500">
              <p className="text-xs font-bold text-purple-300 uppercase mb-2">📊 Ad Strategy</p>
              <p className="text-sm">{generatedData.ad_plan}</p>
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