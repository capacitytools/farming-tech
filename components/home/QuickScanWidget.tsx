'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScanLine, Camera, Sparkles } from 'lucide-react';

export default function QuickScanWidget() {
  return (
    <section className="px-4 pt-5">
      <Link href="/scanner">
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-600 to-forest-800 p-5 shadow-glass"
        >
          {/* Decorative scan-line animation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gold-400"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <ScanLine className="w-7 h-7 text-gold-400" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-white font-extrabold text-lg leading-tight">
                AI Agri-Doctor
                <Sparkles className="w-4 h-4 text-gold-400" />
              </p>
              <p className="text-forest-100 text-xs mt-0.5">
                Snap a photo of a sick animal or crop for instant diagnosis
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-center gap-2 bg-gold-500 text-forest-900 font-bold text-sm py-3 rounded-2xl">
            <Camera className="w-4 h-4" />
            Scan Now
          </div>
        </motion.div>
      </Link>
    </section>
  );
}
