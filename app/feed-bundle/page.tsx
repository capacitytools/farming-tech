'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49"; 
const WHATSAPP_NUMBER = '2347033143508';
const WHATSAPP_MESSAGE = encodeURIComponent('Hello, I want to get the Feed Formulation Ebooks. Please send me the options and prices.');
const SELAR_LINK = 'https://selar.co/your-selar-link';

export default function FeedBundlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any>({});
  const [loaded, setLoaded] = useState(false);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('bundle');
  const [busy, setBusy] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    async function init() {
      const supabase = createClient();
      
      // Auth check
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        setEmail(u.email || '');
        setName(u.user_metadata?.full_name || '');
      }

      // 🚨 Fetch Products from Database 🚨
      const { data } = await supabase.from('funnel_products').select('*');
      const prodMap: any = {};
      (data || []).forEach(p => { prodMap[p.slug] = p; });
      setProducts(prodMap);
      setLoaded(true);
    }
    init();
  }, []);

  async function captureLead() {
    if (!email || leadSaved) return;
    const supabase = createClient();
    await supabase.from('newsletter_subscribers').upsert({
      email, name, whatsapp,
      source: 'feed_bundle_funnel',
      cart_status: 'lead',
      selected_product: selectedProduct,
      amount: products[selectedProduct]?.price
    }, { onConflict: 'email' });
    setLeadSaved(true);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!email || !name) return alert('Please fill in your name and email');
    setBusy(true);

    const supabase = createClient();
    
    await supabase.from('newsletter_subscribers').upsert({
      email, name, whatsapp,
      source: 'feed_bundle_funnel',
      cart_status: 'abandoned',
      selected_product: selectedProduct,
      amount: products[selectedProduct]?.price
    }, { onConflict: 'email' });

    fetch('/api/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout_started',
        name, email, whatsapp,
        product: products[selectedProduct]?.name,
        amount: products[selectedProduct]?.price
      })
    }).catch(() => {});

    const selected = products[selectedProduct];
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: selected.price * 100,
      currency: 'NGN',
      ref: 'FEED-' + Date.now(),
      metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: selectedProduct }] },
      callback: function (response: any) {
        supabase.from('newsletter_subscribers').update({ cart_status: 'paid' }).eq('email', email);
        
        fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale_confirmed',
            name, email,
            product: products[selectedProduct]?.name,
            amount: products[selectedProduct]?.price
          })
        }).catch(() => {});

        router.push(`/feed-bundle/success?ref=${response.reference}&product=${selectedProduct}`);
      },
      onClose: function () {
        setBusy(false);
        alert('Payment cancelled. You can try again or use the WhatsApp/Selar options below.');
      }
    });
    handler.openIframe();
  }

  if (!loaded || !products[selectedProduct]) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div></div>;

  const currentProduct = products[selectedProduct];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      <div className="bg-gradient-to-br from-forest-800 to-forest-950 text-white px-6 py-12 rounded-b-[3rem] shadow-xl text-center">
        <span className="inline-block bg-amber-400 text-forest-900 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
          Limited Time Offer
        </span>
        <h1 className="text-3xl font-extrabold leading-tight mb-4">
          Stop Buying Commercial Feed. <br/> Start <span className="text-amber-400">Formulating Your Own.</span>
        </h1>
        <p className="text-sm text-forest-200 font-medium max-w-md mx-auto mb-6">
          Get the exact formulas used by professional farmers to cut feed costs by 40% and maximize profit.
        </p>
      </div>

      <div className="px-4 -mt-6 relative z-10 max-w-md mx-auto mb-4">
        <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-forest-100">
          <div className="flex gap-3 items-start">
            {currentProduct.cover_url && (
              <img src={currentProduct.cover_url} alt={currentProduct.name} className="w-24 h-32 object-cover rounded-lg shadow-sm flex-shrink-0" />
            )}
            <div>
              <h2 className="text-lg font-extrabold text-forest-900 leading-tight">{currentProduct.name}</h2>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{currentProduct.brief}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-extrabold text-forest-800">₦{Number(currentProduct.price).toLocaleString()}</span>
                <span className="text-xs text-gray-400 line-through">₦{Number(currentProduct.old_price).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {currentProduct.toc && currentProduct.toc.length > 0 && (
            <div className="mt-4 bg-forest-50 rounded-xl p-3 border border-forest-100">
              <p className="text-[10px] font-bold text-forest-800 uppercase tracking-wider mb-1">What's Inside:</p>
              <ul className="text-xs text-forest-900 space-y-1">
                {currentProduct.toc.map((item: string, i: number) => (
                  <li key={i}>✅ {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 relative z-10 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border-2 border-forest-100 space-y-4">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Choose Your Package</label>
            <select 
              className="w-full p-3 mt-1 rounded-xl border border-gray-200 font-bold text-forest-900 bg-forest-50 outline-none" 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="bundle">⭐ {products['bundle']?.name} (All 4) - ₦{Number(products['bundle']?.price).toLocaleString()}</option>
              <option value="rabbit">{products['rabbit']?.name} - ₦{Number(products['rabbit']?.price).toLocaleString()}</option>
              <option value="poultry">{products['poultry']?.name} - ₦{Number(products['poultry']?.price).toLocaleString()}</option>
              <option value="goat">{products['goat']?.name} - ₦{Number(products['goat']?.price).toLocaleString()}</option>
              <option value="fish">{products['fish']?.name} - ₦{Number(products['fish']?.price).toLocaleString()}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input type="email" className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={captureLead} required />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp Number</label>
            <input type="tel" className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" placeholder="e.g. 08012345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <input type="checkbox" id="affiliate" checked={isAffiliate} onChange={(e) => setIsAffiliate(e.target.checked)} className="w-5 h-5 accent-forest-600" />
            <label htmlFor="affiliate" className="text-xs font-bold text-amber-900">Become an Affiliate & Earn 30% Commission</label>
          </div>

          <button disabled={busy} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-[0_0_20px_rgba(22,101,52,0.4)] active:scale-95 transition-transform disabled:opacity-50">
            {busy ? 'Processing...' : `Pay ₦${Number(currentProduct.price).toLocaleString()} Now`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Or buy through another channel</p>
          
          <div className="space-y-3">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-extrabold text-gray-900">Get it on WhatsApp</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Chat with us to choose your options and pay directly.</p>
              </div>
            </a>

            <a href={SELAR_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-full bg-[#0F172A] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">S</div>
              <div className="flex-1 text-left">
                <p className="text-xs font-extrabold text-gray-900">Get it on Selar</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Buy securely through our Selar store page.</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}