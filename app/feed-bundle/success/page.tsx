'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const EBOOK_LINKS: any = {
  rabbit: 'https://drive.google.com/your-rabbit-ebook-link',
  poultry: 'https://drive.google.com/your-poultry-ebook-link',
  goat: 'https://drive.google.com/your-goat-ebook-link',
  fish: 'https://drive.google.com/your-fish-ebook-link',
  bundle: 'https://drive.google.com/your-bundle-folder-link',
};

const EBOOK_TITLES: any = {
  rabbit: 'Rabbit Feed Formulation Guide',
  poultry: 'Poultry Feed Formulation Guide',
  goat: 'Goat & Sheep Feed Formulation Guide',
  fish: 'Fish Feed Formulation Guide',
  bundle: 'The Complete Feed Formulation Bundle (All 4)',
};

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
        // 🚨 VERIFY PAYMENT WITH PAYSTACK API 🚨
        // NOTE: You need to add PAYSTACK_SECRET_KEY to your Vercel environment variables
        const res = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || 'sk_live_YOUR_SECRET_KEY_HERE'}`,
          },
        });
        const data = await res.json();
        
        if (data.status && data.data.status === 'success') {
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

        <Link href="/" className="block text-sm font-bold text-forest-600 underline">← Back to Home</Link>
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