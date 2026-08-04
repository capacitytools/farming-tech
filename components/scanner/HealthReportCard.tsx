'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  AlertTriangle, CheckCircle2, ShieldAlert, Skull,
  Stethoscope, Pill, ListChecks, RotateCcw, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DiagnosisResult {
  imageUrl: string;
  diagnosis: string;
  confidence: number; // 0-100
  severity: 'low' | 'moderate' | 'high' | 'critical';
  symptoms: string[];
  treatmentPlan: string[];
}

const SEVERITY_CONFIG = {
  low: { label: 'Low Concern', icon: CheckCircle2, color: 'text-forest-600', bg: 'bg-forest-100', ring: 'ring-forest-300' },
  moderate: { label: 'Moderate', icon: AlertTriangle, color: 'text-gold-600', bg: 'bg-gold-400/20', ring: 'ring-gold-400' },
  high: { label: 'High Concern', icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-100', ring: 'ring-orange-400' },
  critical: { label: 'Critical', icon: Skull, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-400' },
};

export default function HealthReportCard({
  result,
  onScanAgain,
}: {
  result: DiagnosisResult;
  onScanAgain: () => void;
}) {
  const severity = SEVERITY_CONFIG[result.severity];
  const SeverityIcon = severity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="px-4 pb-8"
    >
      {/* Scanned image with severity ring */}
      <div className={cn('relative w-full h-56 rounded-3xl overflow-hidden ring-4', severity.ring)}>
        <Image src={result.imageUrl} alt="Scanned subject" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/70 to-transparent" />
        <div className={cn('absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md', severity.bg)}>
          <SeverityIcon className={cn('w-4 h-4', severity.color)} />
          <span className={cn('text-xs font-extrabold', severity.color)}>{severity.label}</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-extrabold text-lg leading-tight">{result.diagnosis}</p>
          <p className="text-forest-100 text-xs font-semibold mt-0.5">
            {result.confidence}% confidence
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-4 glass-card-sm p-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-forest-500">AI Confidence Score</p>
          <p className="text-xs font-extrabold text-forest-700 dark:text-forest-200">{result.confidence}%</p>
        </div>
        <div className="w-full h-2.5 bg-forest-100 dark:bg-forest-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full"
          />
        </div>
      </div>

      {/* Symptoms */}
      <div className="mt-4 glass-card p-5">
        <p className="flex items-center gap-2 font-extrabold text-forest-900 dark:text-white mb-3">
          <Stethoscope className="w-4.5 h-4.5 text-forest-600" />
          Observed Symptoms
        </p>
        <div className="space-y-2">
          {result.symptoms.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-forest-700 dark:text-forest-200">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment plan */}
      <div className="mt-4 glass-card p-5">
        <p className="flex items-center gap-2 font-extrabold text-forest-900 dark:text-white mb-3">
          <Pill className="w-4.5 h-4.5 text-forest-600" />
          Recommended Treatment
        </p>
        <div className="space-y-3">
          {result.treatmentPlan.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-forest-700 dark:text-forest-200 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 bg-gold-400/10 border border-gold-400/30 rounded-2xl p-4 flex gap-2.5">
        <ListChecks className="w-4.5 h-4.5 text-gold-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-forest-600 dark:text-forest-300 leading-relaxed">
          This AI diagnosis is a guide, not a replacement for a licensed veterinarian.
          For severe or critical cases, consult a vet or one of our Expert Teachers immediately.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <button onClick={onScanAgain} className="btn-secondary flex-1">
          <RotateCcw className="w-4 h-4" /> Scan Again
        </button>
        <button className="btn-primary flex-1">
          <Share2 className="w-4 h-4" /> Share Report
        </button>
      </div>

      {result.severity === 'high' || result.severity === 'critical' ? (
        <a href="/experts" className="btn-primary w-full mt-3 bg-red-600">
          <ShieldAlert className="w-4 h-4" /> Talk to a Vet Expert Now
        </a>
      ) : null}
    </motion.div>
  );
}
