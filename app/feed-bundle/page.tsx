'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49"; 

const WHATSAPP_NUMBER = '2347033143508';
const WHATSAPP_MESSAGE = encodeURIComponent('Hello, I want to get the Feed Formulation Ebooks. Please send me the options and prices.');
const SELAR_LINK = 'https://selar.co/your-selar-link'; // Put your link here later

const PRODUCTS_DATA: any = {
  bundle: {
    name: 'The Complete Feed Formulation Bundle',
    price: 6000,
    oldPrice: 10000,
    cover: 'https://res.cloudinary.com/your-bundle-cover.jpg',
    brief: 'Get all 4 guides and master feed formulation for every animal on your farm. Save over ₦4,000 compared to buying them individually.',
    toc: ['Rabbit Feed Formulas', 'Poultry Feed Formulas', 'Goat & Sheep Formulas', 'Fish Feed Formulas'],
  },
  rabbit: {
    name: 'Rabbit Feed Formulation Guide',
    price: 2500,
    oldPrice: 4000,
    cover: 'https://res.cloudinary.com/your-rabbit-cover.jpg',
    brief: 'Stop wasting money on commercial pellets. Learn how to mix your own high-protein rabbit feed using local ingredients.',
    toc: ['Nutritional Requirements', 'Sourcing Local Ingredients', 'The Master Formula', 'Mixing & Storage'],
  },
  poultry: {
    name: 'Poultry Feed Formulation Guide',
    price: 2500,
    oldPrice: 4000,
    cover: 'https://res.cloudinary.com/your-poultry-cover.jpg',
    brief: 'Broiler and Layer feed formulas that cut costs by 40% without slowing down growth or reducing egg production.',
    toc: ['Broiler Starter/Grower/Finisher', 'Layer Mash Formula', 'Cost Calculations', 'Common Feed Mistakes'],
  },
  goat: {
    name: 'Goat & Sheep Feed Formulation Guide',
    price: 2500,
    oldPrice: 4000,
    cover: 'https://res.cloudinary.com/your-goat-cover.jpg',
    brief: 'Formulate balanced rations for your goats and sheep. Includes formulas for kids, pregnant does, and fattening rams.',
    toc: ['Nutrient Requirements by Age', 'Forage vs Concentrate', 'Mixing the Ration', 'Feeding Schedule'],
  },
  fish: {
    name: 'Fish Feed Formulation Guide',
    price: 2500,
    oldPrice: 4000,
    cover: 'https://res.cloudinary.com/your-fish-cover.jpg',
    brief: 'Catfish and Tilapia feed formulas. Learn how to make floating feeds locally and save massively on fish farming costs.',
    toc: ['Protein Requirements', 'Local Ingredient Sourcing', 'Extrusion & Floating Feed', 'Feeding Rates'],
  }
};

export default function FeedBundlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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

    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        setEmail(u.email || '');
        setName(u.user_metadata?.full_name || '');
      }
    }
    checkAuth();
  }, []);

  async function captureLead() {
    if (!email || leadSaved) return;
    const supabase = createClient();
    await supabase.from('newsletter_subscribers').upsert({
      email: email,
      name: name,
      whatsapp: whatsapp,
      source: 'feed_bundle_funnel',
      cart_status: 'lead',
      selected_product: selectedProduct,
      amount: PRODUCTS_DATA[selectedProduct].price
    }, { onConflict: 'email' });
    setLeadSaved(true);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!email || !name) return alert('Please fill in your name and email');
    setBusy(true);

    const supabase = createClient();
    
    await supabase.from('newsletter_subscribers').upsert({
      email: email,
      name: name,
      whatsapp: whatsapp,
      source: 'feed_bundle_funnel',
      cart_status: 'abandoned',
      selected_product: selectedProduct,
      amount: PRODUCTS_DATA[selectedProduct].price
    }, { onConflict: 'email' });

    // 🚨 ALERT: CHECKOUT STARTED 🚨
    fetch('/api/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout_started',
        name, email, whatsapp,
        product: PRODUCTS_DATA[selectedProduct].name,
        amount: PRODUCTS_DATA[selectedProduct].price
      })
    }).catch(() => {});

    const selected = PRODUCTS_DATA[selectedProduct];
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: selected.price * 100,
      currency: 'NGN',
      ref: 'FEED-' + Date.now(),
      metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: selectedProduct }] },
      callback: function (response: any) {
        supabase.from('newsletter_subscribers').update({ cart_status: 'paid' }).eq('email', email);
        
        // 🚨 ALERT: SALE CONFIRMED 🚨
        fetch('/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale_confirmed',
            name, email,
            product: PRODUCTS_DATA[selectedProduct].name,
            amount: PRODUCTS_DATA[selectedProduct].price
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

  const currentProduct = PRODUCTS_DATA[selectedProduct];

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
            <img src={currentProduct.cover} alt={currentProduct.name} className="w-24 h-32 object-cover rounded-lg shadow-sm flex-shrink-0" />
            <div>
              <h2 className="text-lg font-extrabold text-forest-900 leading-tight">{currentProduct.name}</h2>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{currentProduct.brief}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-extrabold text-forest-800">₦{currentProduct.price.toLocaleString()}</span>
                <span className="text-xs text-gray-400 line-through">₦{currentProduct.oldPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-forest-50 rounded-xl p-3 border border-forest-100">
            <p className="text-[10px] font-bold text-forest-800 uppercase tracking-wider mb-1">What's Inside:</p>
            <ul className="text-xs text-forest-900 space-y-1">
              {currentProduct.toc.map((item: string, i: number) => (
                <li key={i}>✅ {item}</li>
              ))}
            </ul>
          </div>
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
              <option value="bundle">⭐ The Complete Bundle (All 4) - ₦6,000</option>
              <option value="rabbit">Rabbit Feed Formulation - ₦2,500</option>
              <option value="poultry">Poultry Feed Formulation - ₦2,500</option>
              <option value="goat">Goat & Sheep Feed Formulation - ₦2,500</option>
              <option value="fish">Fish Feed Formulation - ₦2,500</option>
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
            {busy ? 'Processing...' : `Pay ₦${currentProduct.price.toLocaleString()} Now`}
          </button>
        </form>

        {/* 🚨 NEW: ALTERNATIVE CHANNELS 🚨 */}
        <div className="mt-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Or buy through another channel</p>
          
          <div className="space-y-3">
            {/* WHATSAPP */}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-extrabold text-gray-900">Get it on WhatsApp</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Chat with us to choose your options and pay directly.</p>
              </div>
            </a>

            {/* SELAR */}
            <a 
              href={SELAR_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[#0F172A] flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                S
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-extrabold text-gray-900">Get it on Selar</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Buy securely through our Selar store page.</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* AFFILIATE SECTION */}
      <div className="px-4 mt-12 max-w-md mx-auto">
        <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-lg">
          <h2 className="text-xl font-extrabold mb-2">💰 Want to Resell These Ebooks?</h2>
          <p className="text-xs text-gray-300 mb-4">Join our affiliate program. Get your unique link, share it on WhatsApp or Facebook, and earn <strong className="text-amber-400">30% commission</strong> on every sale.</p>
          <div className="space-y-2 text-xs text-gray-400">
            <p>✅ Free to join</p>
            <p>✅ Instant payout to your bank account</p>
            <p>✅ Access to sales flyers, ad banners, and YouTube video links</p>
          </div>
        </div>
      </div>

    </div>
  );
}