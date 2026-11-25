'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 🚨 YOUR EXACT GOOGLE DRIVE LINKS 🚨
const EBOOK_LINKS: any = {
  rabbit: 'https://drive.google.com/file/d/1CnhoieYieCPXCl5jRXJzQrd38RhRmh4X/view?usp=drivesdk',
  poultry: 'https://drive.google.com/file/d/1811LWbAiB0VCzkYQZ439_HApW2rcNw__/view?usp=drivesdk',
  goat: 'https://drive.google.com/file/d/1nMpn-zaDKGYV9VIea-dDnDMPwdwsJT6Z/view?usp=drivesdk',
  fish: 'https://drive.google.com/file/d/1ddHeRwQvoKj-7JxHyrziDnEaodHcWS_z/view?usp=drivesdk',
  bundle: 'https://drive.google.com/drive/folders/1hHXbLI3d3nXK-8y1p_oAVycNcwD2I8sk',
};

const EBOOK_TITLES: any = {
  rabbit: 'Rabbit Feed Formulation Guide',
  poultry: 'Poultry Feed Formulation Guide',
  goat: 'Goat & Sheep Feed Formulation Guide',
  fish: 'Fish Feed Formulation Guide',
  bundle: 'The Complete Feed Formulation Bundle (All 4)',
};

// Your WhatsApp number (without the leading 0)
const WHATSAPP_NUMBER = '2347033143508';
const WHATSAPP_MESSAGE = encodeURIComponent('Hello, I want to get the Feed Formulation Ebooks. Please send me the options and prices.');

// Add your Selar link here when you have it
const SELAR_LINK = 'https://selar.co/your-selar-link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const product = searchParams.get('product') || 'bundle';
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function verifyPayment() {
      if (!ref) {
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`/api/verify-payment?reference=${ref}`);
        const data = await res.json();
        
        if (data.status && data.data && data.data.status === 'success') {
          setVerified(true);
        }
      } catch (err) {
        console.error('Verification failed', err);
      }
      setVerifying(false);
    }
    verifyPayment();
  }, [ref]);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-forest-800">Verifying your payment securely...</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-xl font-extrabold text-red-600 mb-2">Verification Failed</h1>
        <p className="text-sm text-gray-500 mb-6">We could not verify your payment. Please contact support at hello@farmingtechbusiness.com with your reference number.</p>
        <Link href="/feed-bundle" className="bg-forest-600 text-white px-6 py-3 rounded-xl font-bold">Try Again</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl mb-4">🎉</p>
      <h1 className="text-2xl font-extrabold text-forest-900 mb-2">Payment Successful!</h1>
      <p className="text-sm text-gray-600 mb-8">Thank you for your purchase. Your ebooks are ready to download.</p>

      <div className="w-full max-w-md space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-forest-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Your Purchase:</p>
          <h2 className="text-lg font-extrabold text-forest-800 mb-6">{EBOOK_TITLES[product]}</h2>
          
          <a 
            href={EBOOK_LINKS[product]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold text-lg shadow-[0_0_20px_rgba(22,101,52,0.4)] active:scale-95 transition-transform"
          >
            📥 Download Your Ebooks Now
          </a>
          <p className="text-[10px] text-gray-400 mt-2">The link opens Google Drive. Click "Download" to save the PDF to your phone.</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <p className="text-xs text-amber-800 font-bold">Want to earn 30% commission? Check your email for your affiliate link.</p>
        </div>

        {/* 🚨 NEW: WHATSAPP & SELAR BLOCKS 🚨 */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prefer to buy through other channels?</p>
          
          <div className="space-y-3">
            {/* WHATSAPP BLOCK */}
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-extrabold text-gray-900">Get it on WhatsApp</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Chat with us to choose your options and pay directly.</p>
              </div>
            </a>

            {/* SELAR BLOCK */}
            <a 
              href={SELAR_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-[#0F172A] flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                S
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-extrabold text-gray-900">Get it on Selar</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Buy securely through our Selar store page.</p>
              </div>
            </a>
          </div>
        </div>

        <Link href="/" className="block text-sm font-bold text-forest-600 underline pt-4">← Back to Home</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}