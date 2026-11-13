'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CohortLandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      setLoaded(true);
    }
    checkAuth();
  }, []);

  const WHATSAPP_LINK = "https://chat.whatsapp.com/Clk6Hvs5aal3C6CD29FDOl?s=cl&p=a&iam=2";

  if (!loaded) return <div className="min-h-screen bg-forest-900" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-forest-800 to-forest-950 text-white px-6 py-12 rounded-b-[3rem] shadow-xl text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-gold-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <span className="inline-block bg-gold-500 text-forest-900 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-sm">
          Free Practical Masterclass
        </span>
        
        <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
          Make Your First <span className="text-gold-400">$500</span> as a Farmer, Writer, or Creator.
        </h1>
        
        <p className="text-sm text-forest-200 font-medium max-w-md mx-auto mb-6">
          Discover how to use AI tools and your farm knowledge to generate income online. <strong className="text-white">No need for 10,000 followers.</strong>
        </p>

        <div className="flex flex-col gap-2 items-center text-xs font-bold text-forest-300 bg-white/10 p-3 rounded-2xl max-w-xs mx-auto backdrop-blur-sm border border-white/10">
          <p>📅 Saturday, 21st November 2026</p>
          <p>⏰ 7:00 PM (WAT)</p>
        </div>
      </div>

      {/* THE 3 IMAGES (Visual Proof/Speakers) */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <img src="https://res.cloudinary.com/jnvtguiz/image/upload/v1/placeholder1.jpg" alt="Farmer" className="w-full h-32 object-cover rounded-2xl shadow-lg border-2 border-white" />
          <img src="https://res.cloudinary.com/jnvtguiz/image/upload/v1/placeholder2.jpg" alt="AI Tech" className="w-full h-32 object-cover rounded-2xl shadow-lg border-2 border-white mt-4" />
          <img src="https://res.cloudinary.com/jnvtguiz/image/upload/v1/placeholder3.jpg" alt="Writer" className="w-full h-32 object-cover rounded-2xl shadow-lg border-2 border-white" />
        </div>
      </div>

      {/* WHAT YOU WILL LEARN */}
      <div className="px-6 mt-12">
        <h2 className="text-xl font-extrabold text-forest-900 mb-4 text-center">What You Will Learn</h2>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-bold text-forest-800">AI Content Generation</p>
              <p className="text-xs text-gray-500">Write viral farm articles in minutes.</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="text-sm font-bold text-forest-800">Affiliate Marketing</p>
              <p className="text-xs text-gray-500">Monetize your knowledge with AliExpress & Jumia.</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <div>
              <p className="text-sm font-bold text-forest-800">Pinterest Traffic Secrets</p>
              <p className="text-xs text-gray-500">Drive thousands of visitors without followers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 THE REGISTRATION / WHATSAPP LOCK 🚨 */}
      <div className="px-6 mt-12 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-forest-100 text-center">
          <h3 className="text-lg font-extrabold text-forest-900 mb-2">Join the VIP Training Group</h3>
          <p className="text-xs text-gray-500 mb-6">To get the Zoom link and class materials, you must join our exclusive WhatsApp group.</p>
          
          {user ? (
            // IF LOGGED IN, SHOW THE BIG GREEN BUTTON
            <a 
              href={WHATSAPP_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-5 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] transition-all transform hover:scale-[1.02] active:scale-95"
            >
              🚀 JOIN THE WHATSAPP GROUP
            </a>
          ) : (
            // IF NOT LOGGED IN, FORCE THEM TO REGISTER
            <div className="space-y-3">
              <Link 
                href="/login" 
                className="block w-full bg-forest-600 text-white py-4 rounded-2xl font-extrabold text-sm shadow-md hover:bg-forest-700 transition-colors"
              >
                🔒 Create Free Account to Unlock Group
              </Link>
              <p className="text-[10px] text-gray-400">Already have an account? <Link href="/login" className="text-forest-600 font-bold underline">Log in here</Link></p>
            </div>
          )}
        </div>
      </div>

      {/* URGENCY BANNER */}
      <div className="px-6 mb-12">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
          <p className="text-xs font-bold text-amber-800">⚠️ Limited slots available.</p>
          <p className="text-[10px] text-amber-600 mt-1">Only the first 500 registered members will get access to the live Q&A session.</p>
        </div>
      </div>

    </div>
  );
}