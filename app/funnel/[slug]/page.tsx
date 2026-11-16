'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PublicFunnelPage() {
  const params = useParams();
  const [funnel, setFunnel] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lead Form State
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFunnel() {
      const supabase = createClient();
      const { data } = await supabase.from('funnels').select('*').eq('slug', params.slug).single();
      setFunnel(data);
      setLoading(false);
    }
    loadFunnel();
  }, [params.slug]);

  async function captureLead(e: any) {
    e.preventDefault();
    if (!name || !whatsapp) return alert('Please enter your name and WhatsApp number');
    setSubmitting(true);

    const supabase = createClient();
    
    // Save the lead to the database
    await supabase.from('funnel_leads').insert({
      funnel_id: funnel.id,
      name,
      whatsapp,
    });

    // Unlock the page
    setIsUnlocked(true);
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-900" />;
  if (!funnel) return <div className="p-10 text-center font-bold">Funnel not found.</div>;

  // Theme Styling
  const isDark = funnel.theme === 'theme-dark';
  const bgClass = isDark ? 'bg-gray-900 text-white' : funnel.theme === 'theme-gold' ? 'bg-yellow-50 text-gray-900' : funnel.theme === 'theme-blue' ? 'bg-blue-900 text-white' : 'bg-green-50 text-gray-900';
  const cardClass = isDark || funnel.theme === 'theme-blue' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const btnClass = funnel.theme === 'theme-gold' ? 'bg-yellow-600 text-white' : funnel.theme === 'theme-blue' ? 'bg-blue-600 text-white' : 'bg-forest-600 text-white';

  return (
    <div className={`min-h-screen py-12 px-4 ${bgClass}`}>
      <div className="max-w-xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold leading-tight mb-3">{funnel.title}</h1>
          <p className="text-sm opacity-80">{funnel.subheadline}</p>
        </div>

        {/* THE GATEKEEPER */}
        {!isUnlocked ? (
          <div className={`p-6 rounded-3xl shadow-xl border ${cardClass}`}>
            <p className="text-center font-bold text-sm mb-4">Enter your details below to unlock this exclusive resource.</p>
            
            <form onSubmit={captureLead} className="space-y-3">
              <input 
                type="text" 
                placeholder="Your Full Name" 
                className="w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input 
                type="tel" 
                placeholder="Your WhatsApp Number" 
                className="w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-900"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-md ${btnClass}`}
              >
                {submitting ? 'Processing...' : '🔓 Unlock Now'}
              </button>
            </form>
            <p className="text-[10px] text-center opacity-60 mt-3">We respect your privacy. No spam.</p>
          </div>
        ) : (
          /* THE UNLOCKED CONTENT */
          <div className={`p-6 rounded-3xl shadow-xl border animate-in fade-in duration-500 ${cardClass}`}>
            <div className="text-center mb-6">
              <span className="text-4xl">🎉</span>
              <h2 className="text-xl font-extrabold mt-2">Access Granted!</h2>
              <p className="text-xs opacity-70">Thank you, {name}. You can now access the content below.</p>
            </div>
            
            <div className="prose prose-sm mb-6 whitespace-pre-line opacity-90">
              {funnel.body_copy}
            </div>

            <a 
              href={funnel.cta_link} 
              target="_blank" 
              className={`block text-center w-full py-4 rounded-xl font-extrabold text-sm shadow-md ${btnClass}`}
            >
              {funnel.cta_text}
            </a>
          </div>
        )}
        
      </div>
    </div>
  );
}