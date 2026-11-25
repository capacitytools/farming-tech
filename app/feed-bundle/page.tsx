'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49"; // Your existing key

export default function FeedBundlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('bundle');
  const [busy, setBusy] = useState(false);

  // Product Pricing
  const products = {
    rabbit: { name: 'Rabbit Feed Formulation', price: 2500 },
    poultry: { name: 'Poultry Feed Formulation', price: 2500 },
    goat: { name: 'Goat & Sheep Feed Formulation', price: 2500 },
    fish: { name: 'Fish Feed Formulation', price: 2500 },
    bundle: { name: 'The Complete Bundle (All 4)', price: 6000 },
  };

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

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!email || !name) return alert('Please fill in your name and email');
    setBusy(true);

    // 1. Save Lead to Database (even before they pay)
    const supabase = createClient();
    await supabase.from('newsletter_subscribers').upsert({
      email: email,
      name: name,
      whatsapp: whatsapp,
      source: 'feed_bundle_funnel'
    }, { onConflict: 'email' });

    // 2. Handle Affiliate Registration
    if (isAffiliate) {
      // Generate a simple referral code
      const refCode = name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000);
      await supabase.from('profiles').upsert({
        email: email,
        full_name: name,
        whatsapp: whatsapp,
        referral_code: refCode,
        role: 'affiliate'
      }, { onConflict: 'email' });
    }

    // 3. Trigger Paystack Payment
    const selected = products[selectedProduct as keyof typeof products];
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: selected.price * 100, // Paystack uses kobo
      currency: 'NGN',
      ref: 'FEED-' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: "Product", variable_name: "product", value: selectedProduct },
          { display_name: "Affiliate Status", variable_name: "affiliate", value: isAffiliate ? "Yes" : "No" }
        ]
      },
      callback: function (response: any) {
        // Redirect to the download page with the reference
        router.push(`/feed-bundle/success?ref=${response.reference}&product=${selectedProduct}`);
      },
      onClose: function () {
        setBusy(false);
        alert('Payment cancelled. You can try again.');
      }
    });
    handler.openIframe();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HERO */}
      <div className="bg-gradient-to-br from-forest-800 to-forest-950 text-white px-6 py-12 rounded-b-[3rem] shadow-xl text-center">
        <span className="inline-block bg-amber-400 text-forest-900 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
          Instant Download
        </span>
        <h1 className="text-3xl font-extrabold leading-tight mb-4">
          Stop Buying Commercial Feed. <br/> Start <span className="text-amber-400">Formulating Your Own.</span>
        </h1>
        <p className="text-sm text-forest-200 font-medium max-w-md mx-auto mb-6">
          Get the exact formulas used by professional farmers to cut feed costs by 40% and maximize profit.
        </p>
        
        {/* Ebook Covers */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-6">
          <div className="bg-white/10 p-2 rounded-lg border border-white/20"><span className="text-2xl">🐇</span><p className="text-[8px] mt-1">Rabbit</p></div>
          <div className="bg-white/10 p-2 rounded-lg border border-white/20"><span className="text-2xl">🐔</span><p className="text-[8px] mt-1">Poultry</p></div>
          <div className="bg-white/10 p-2 rounded-lg border border-white/20"><span className="text-2xl">🐐</span><p className="text-[8px] mt-1">Goat</p></div>
          <div className="bg-white/10 p-2 rounded-lg border border-white/20"><span className="text-2xl">🐟</span><p className="text-[8px] mt-1">Fish</p></div>
        </div>
      </div>

      {/* SALES FORM */}
      <div className="px-4 -mt-6 relative z-10 max-w-md mx-auto">
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
            <input type="email" className="w-full p-3 mt-1 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-forest-500" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            {busy ? 'Processing...' : `Pay ₦${products[selectedProduct as keyof typeof products].price.toLocaleString()} Now`}
          </button>
          <p className="text-[10px] text-gray-400 text-center">Secure payment powered by Paystack. Instant download after payment.</p>
        </form>
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