'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAYSTACK_PUBLIC_KEY = "pk_live_00573ba36a45a7fa73d358fee60ae30f5ce1dd49"; 

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

  // 🚨 THE CART RESCUE: Save Lead when they type email 🚨
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
    
    // 1. Update Lead to Abandoned (until payment succeeds)
    await supabase.from('newsletter_subscribers').upsert({
      email: email,
      name: name,
      whatsapp: whatsapp,
      source: 'feed_bundle_funnel',
      cart_status: 'abandoned',
      selected_product: selectedProduct,
      amount: PRODUCTS_DATA[selectedProduct].price
    }, { onConflict: 'email' });

    // 2. Trigger WhatsApp Alert to YOU
    const alertMsg = encodeURIComponent(`🔥 *New Checkout Started!*\n\nName: ${name}\nEmail: ${email}\nProduct: ${PRODUCTS_DATA[selectedProduct].name}\nAmount: ₦${PRODUCTS_DATA[selectedProduct].price.toLocaleString()}\n\n(They haven't paid yet. If they abandon, follow up!)`);
    fetch(`https://api.callmebot.com/whatsapp.php?phone=2347033143508&text=${alertMsg}&apikey=YOUR_CALLMEBOT_API_KEY`).catch(() => {});

    // 3. Trigger Paystack
    const selected = PRODUCTS_DATA[selectedProduct];
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: selected.price * 100,
      currency: 'NGN',
      ref: 'FEED-' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: "Product", variable_name: "product", value: selectedProduct },
          { display_name: "Affiliate Status", variable_name: "affiliate", value: isAffiliate ? "Yes" : "No" }
        ]
      },
      callback: function (response: any) {
        // 4. Update Lead to PAID
        supabase.from('newsletter_subscribers').update({ cart_status: 'paid' }).eq('email', email);
        
        // 5. Send WhatsApp Alert (PAID)
        const paidMsg = encodeURIComponent(`💰 *SALE CONFIRMED!*\n\nName: ${name}\nEmail: ${email}\nProduct: ${PRODUCTS_DATA[selectedProduct].name}\nAmount: ₦${PRODUCTS_DATA[selectedProduct].price.toLocaleString()}`);
        fetch(`https://api.callmebot.com/whatsapp.php?phone=2347033143508&text=${paidMsg}&apikey=YOUR_CALLMEBOT_API_KEY`).catch(() => {});

        router.push(`/feed-bundle/success?ref=${response.reference}&product=${selectedProduct}`);
      },
      onClose: function () {
        setBusy(false);
        alert('Payment cancelled. If you had an issue, please try again or contact us on WhatsApp.');
      }
    });
    handler.openIframe();
  }

  const currentProduct = PRODUCTS_DATA[selectedProduct];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HERO */}
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

      {/* PRODUCT SHOWCASE */}
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

      {/* SALES FORM */}
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