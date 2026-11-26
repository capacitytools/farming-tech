'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49"; 
const WHATSAPP_NUMBER = '2347033143508';

export default function DynamicFunnelPage() {
  const params = useParams();
  const router = useRouter();
  
  const [loaded, setLoaded] = useState(false);
  const [funnel, setFunnel] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    async function loadFunnel() {
      const supabase = createClient();
      
      const { data: f } = await supabase.from('funnels').select('*').eq('slug', params.slug).single();
      if (!f) return setLoaded(true);
      setFunnel(f);

      const { data: prods } = await supabase.from('funnel_products').select('*').eq('funnel_id', f.id).order('sort_order');
      setProducts(prods || []);
      
      // Auto-select the most expensive product (usually the bundle) by default
      if (prods && prods.length > 0) {
        const sorted = [...prods].sort((a, b) => Number(b.price) - Number(a.price));
        setSelectedProduct(sorted[0]);
      }
      
      setLoaded(true);
    }
    loadFunnel();
  }, [params.slug]);

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!email || !name || !selectedProduct) return alert('Please fill in your name and email');
    setBusy(true);

    const supabase = createClient();
    await supabase.from('newsletter_subscribers').upsert({
      email, name, whatsapp,
      source: funnel.slug,
      cart_status: 'abandoned',
      selected_product: selectedProduct.slug,
      amount: selectedProduct.price
    }, { onConflict: 'email' });

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: selectedProduct.price * 100,
      currency: 'NGN',
      ref: 'FUNNEL-' + Date.now(),
      metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: selectedProduct.slug }] },
      callback: function (response: any) {
        supabase.from('newsletter_subscribers').update({ cart_status: 'paid' }).eq('email', email);
        router.push(`/funnel/${funnel.slug}/success?ref=${response.reference}&product=${selectedProduct.slug}`);
      },
      onClose: function () {
        setBusy(false);
      }
    });
    handler.openIframe();
  }

  if (!loaded) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div></div>;
  if (!funnel) return <div className="p-10 text-center font-bold">Funnel not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* DYNAMIC HEADER */}
      <div className="bg-gradient-to-br from-forest-800 to-forest-950 text-white px-6 py-12 rounded-b-[3rem] shadow-xl text-center">
        <h1 className="text-3xl font-extrabold leading-tight mb-4">{funnel.headline}</h1>
        <p className="text-sm text-forest-200 font-medium max-w-md mx-auto mb-6">{funnel.subheadline}</p>
      </div>

      {/* PRODUCT SHOWCASE */}
      {selectedProduct && (
        <div className="px-4 -mt-6 relative z-10 max-w-md mx-auto mb-4">
          <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-forest-100">
            <div className="flex gap-3 items-start">
              {selectedProduct.cover_url && (
                <img src={selectedProduct.cover_url} alt={selectedProduct.name} className="w-24 h-32 object-cover rounded-lg shadow-sm flex-shrink-0" />
              )}
              <div>
                <h2 className="text-lg font-extrabold text-forest-900 leading-tight">{selectedProduct.name}</h2>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{selectedProduct.brief}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl font-extrabold text-forest-800">₦{Number(selectedProduct.price).toLocaleString()}</span>
                  <span className="text-xs text-gray-400 line-through">₦{Number(selectedProduct.old_price).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {selectedProduct.toc && selectedProduct.toc.length > 0 && (
              <div className="mt-4 bg-forest-50 rounded-xl p-3 border border-forest-100">
                <p className="text-[10px] font-bold text-forest-800 uppercase tracking-wider mb-1">What's Inside:</p>
                <ul className="text-xs text-forest-900 space-y-1">
                  {selectedProduct.toc.map((item: string, i: number) => (
                    <li key={i}>✅ {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="px-4 relative z-10 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-forest-100 space-y-4">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Choose Your Package</label>
            <select 
              className="w-full p-3 mt-1 rounded-xl border border-gray-200 font-bold text-forest-900 bg-forest-50 outline-none" 
              value={selectedProduct?.id || ''} 
              onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value))}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ₦{Number(p.price).toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input type="email" className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp Number</label>
            <input type="tel" className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <input type="checkbox" checked={isAffiliate} onChange={(e) => setIsAffiliate(e.target.checked)} className="w-5 h-5 accent-forest-600" />
            <label className="text-xs font-bold text-amber-900">Become an Affiliate & Earn 30% Commission</label>
          </div>

          <button disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-[0_0_20px_rgba(22,101,52,0.4)] active:scale-95 transition-transform disabled:opacity-50">
            {busy ? 'Processing...' : `Pay ₦${Number(selectedProduct?.price || 0).toLocaleString()} Now`}
          </button>
        </form>

        {/* WHATSAPP FALLBACK */}
        <div className="mt-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Or buy through WhatsApp</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I want to buy from your funnel: ' + funnel.name)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white p-4 rounded-2xl font-bold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}