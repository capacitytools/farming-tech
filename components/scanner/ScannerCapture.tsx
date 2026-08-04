'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, X, Scan, Sparkles } from 'lucide-react';
import HealthReportCard, { DiagnosisResult } from './HealthReportCard';
import { cn } from '@/lib/utils';

const TRIBE_FILTERS = [
  { id: 'poultry', label: 'Poultry', icon: '🐔' },
  { id: 'goats', label: 'Goats', icon: '🐐' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'rabbits', label: 'Rabbits', icon: '🐰' },
  { id: 'pigs', label: 'Pigs', icon: '🐖' },
  { id: 'crops', label: 'Crops', icon: '🌾' },
];

type ScanState = 'idle' | 'preview' | 'scanning' | 'result';

export default function ScannerCapture() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScanState>('idle');
  const [selectedTribe, setSelectedTribe] = useState('poultry');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setState('preview');
  }

  async function runDiagnosis() {
    if (!previewUrl) return;
    setState('scanning');

    // In production: upload image to Supabase `scan-images` bucket, then POST
    // to /api/scan which calls the vision AI model and writes to `ai_scans`.
    // Simulated here for UI demonstration purposes:
    await new Promise((resolve) => setTimeout(resolve, 2600));

    setResult({
      imageUrl: previewUrl,
      diagnosis: 'Possible Newcastle Disease (Early Stage)',
      confidence: 87,
      severity: 'high',
      symptoms: [
        'Greenish watery droppings observed',
        'Slight nasal discharge and labored breathing',
        'Reduced appetite and lethargy in the image posture',
      ],
      treatmentPlan: [
        'Isolate the affected bird from the rest of the flock immediately',
        'Provide vitamin-enriched water (multivitamin + electrolytes) for 3-5 days',
        'Contact a licensed vet for confirmatory testing and possible vaccination boost',
        'Disinfect coop, feeders, and waterers with an approved poultry disinfectant',
      ],
    });
    setState('result');
  }

  function reset() {
    setPreviewUrl(null);
    setResult(null);
    setState('idle');
  }

  if (state === 'result' && result) {
    return <HealthReportCard result={result} onScanAgain={reset} />;
  }

  return (
    <div className="px-4 pb-8">
      {/* Header */}
      <div className="pt-2 pb-5">
        <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white flex items-center gap-2">
          AI Agri-Doctor
          <Sparkles className="w-5 h-5 text-gold-500" />
        </h1>
        <p className="text-sm text-forest-500 mt-1">
          Snap a clear photo of the affected animal or crop for instant diagnosis.
        </p>
      </div>

      {/* Tribe filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {TRIBE_FILTERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTribe(t.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors',
              selectedTribe === t.id
                ? 'bg-forest-600 border-forest-600 text-white'
                : 'bg-white dark:bg-forest-800 border-forest-100 dark:border-forest-700 text-forest-600 dark:text-forest-300'
            )}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Capture zone */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-forest-900 shadow-glass">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-forest-800 to-forest-900"
            >
              {/* Viewfinder corners */}
              {['top-6 left-6 border-t-4 border-l-4', 'top-6 right-6 border-t-4 border-r-4', 'bottom-6 left-6 border-b-4 border-l-4', 'bottom-6 right-6 border-b-4 border-r-4'].map(
                (pos, i) => (
                  <div key={i} className={cn('absolute w-8 h-8 border-gold-400 rounded-sm', pos)} />
                )
              )}
              <Camera className="w-14 h-14 text-forest-500" strokeWidth={1.5} />
              <p className="text-forest-300 text-sm font-semibold px-8 text-center">
                Position the animal or crop clearly in frame
              </p>
            </motion.div>
          )}

          {(state === 'preview' || state === 'scanning') && previewUrl && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />

              {state === 'scanning' && (
                <>
                  <div className="absolute inset-0 bg-forest-900/40" />
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gold-400 shadow-[0_0_20px_4px_rgba(242,193,78,0.6)]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Scan className="w-10 h-10 text-gold-400" />
                    </motion.div>
                    <p className="text-white font-extrabold text-sm bg-forest-900/70 px-4 py-1.5 rounded-full">
                      Analyzing with AI...
                    </p>
                  </div>
                </>
              )}

              {state === 'preview' && (
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-forest-900/70 backdrop-blur flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Action buttons */}
      <div className="mt-5 flex gap-3">
        {state === 'idle' && (
          <>
            <button onClick={() => cameraInputRef.current?.click()} className="btn-primary flex-1">
              <Camera className="w-5 h-5" /> Take Photo
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
              <ImagePlus className="w-5 h-5" /> Upload
            </button>
          </>
        )}
        {state === 'preview' && (
          <button onClick={runDiagnosis} className="btn-primary w-full">
            <Scan className="w-5 h-5" /> Run Diagnosis
          </button>
        )}
        {state === 'scanning' && (
          <button disabled className="btn-primary w-full opacity-70">
            Analyzing...
          </button>
        )}
      </div>

      <p className="text-center text-xs text-forest-400 mt-4">
        {(0).toLocaleString()} scans run today across the platform · Powered by Farming Tech AI
      </p>
    </div>
  );
}
