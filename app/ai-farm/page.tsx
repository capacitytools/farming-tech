'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Sprout, Bird, Beef, Calculator, ClipboardList, Briefcase, 
  PenTool, BookOpen, Search, Tractor, Bot, ShoppingBag, Camera 
} from 'lucide-react';
import AdviserChat from '@/components/ai-farm/AdviserChat';

type View = 'hub' | 'animal' | 'crop' | 'ask';

const ANIMAL_SYSTEM_PROMPT = `You are the FTB Animal Adviser. 
RULES:
1. SEARCHER FIRST: Ask follow-up questions (Age, Breed, Feed, Symptoms, Housing) before giving definitive advice.
2. SAFETY: Never present an uncertain visual observation or text description as a confirmed disease diagnosis. 
3. STRUCTURE: Use clear headings: Observation, Possible Causes, Info Needed, Management Actions, When to contact a vet.
4. TONE: Practical, farmer-friendly, professional. Never use AI filler ("In today's world").
5. CONTEXT: Assume Nigerian/African agricultural context unless specified otherwise.`;

const CROP_SYSTEM_PROMPT = `You are the FTB Crop Adviser.
RULES:
1. SEARCHER FIRST: Ask follow-up questions (Crop type, Soil, Season, Symptoms, Fertilizer used) before advising.
2. STRUCTURE: Use clear headings: Observation, Possible Causes, Info Needed, Management Actions.
3. TONE: Practical, agronomic, professional. 
4. CONTEXT: Assume Nigerian/African agricultural context unless specified otherwise.`;

const ASK_SYSTEM_PROMPT = `You are the FTB General Search & Knowledge Assistant.
RULES:
1. Answer agricultural questions clearly and practically.
2. If you don't know, say so. Do not fabricate dosages, chemical mixtures, or scientific facts.
3. Use transparent language: "Farmers commonly...", "Research indicates...".
4. Keep answers concise and structured.`;

export default function AIFarmHub() {
  const [view, setView] = useState<View>('hub');
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('farm_records').select('*').order('created_at', { ascending: false }).limit(3);
        setFarms(data || []);
      }      setLoaded(true);
    })();
  }, []);

  if (!loaded) return <div className="p-10 text-center text-gray-500">Loading AI Farm...</div>;

  if (view === 'animal') return <AdviserChat title="Animal Adviser" icon="🐔" systemPrompt={ANIMAL_SYSTEM_PROMPT} onBack={() => setView('hub')} />;
  if (view === 'crop') return <AdviserChat title="Crop Adviser" icon="🌱" systemPrompt={CROP_SYSTEM_PROMPT} onBack={() => setView('hub')} />;
  if (view === 'ask') return <AdviserChat title="Ask FTB" icon="🔎" systemPrompt={ASK_SYSTEM_PROMPT} onBack={() => setView('hub')} />;

  const tools = [
    { id: 'animal', label: 'Animal Adviser', icon: Bird, color: 'bg-amber-100 text-amber-700' },
    { id: 'crop', label: 'Crop Adviser', icon: Sprout, color: 'bg-green-100 text-green-700' },
    { id: 'camera', label: 'Image Analyzer', icon: Camera, color: 'bg-blue-100 text-blue-700', href: '/scanner' }, // Reuses existing scanner
    { id: 'calc', label: 'Farm Calculator', icon: Calculator, color: 'bg-purple-100 text-purple-700' },
    { id: 'plan', label: 'Farm Planner', icon: ClipboardList, color: 'bg-indigo-100 text-indigo-700' },
    { id: 'biz', label: 'Farm Business', icon: Briefcase, color: 'bg-rose-100 text-rose-700' },
    { id: 'content', label: 'Content Studio', icon: PenTool, color: 'bg-pink-100 text-pink-700' },
    { id: 'learn', label: 'Learn With AI', icon: BookOpen, color: 'bg-teal-100 text-teal-700' },
    { id: 'ask', label: 'Ask FTB', icon: Search, color: 'bg-gray-100 text-gray-700' },
    { id: 'myfarm', label: 'My Farm', icon: Tractor, color: 'bg-forest-100 text-forest-700' },
    { id: 'agent', label: 'Farm Agent', icon: Bot, color: 'bg-cyan-100 text-cyan-700' },
    { id: 'market', label: 'Marketplace', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700', href: '/market' },
  ];

  return (
    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-forest-950">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sprout className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">AI FARM</h1>
            <p className="text-xs text-forest-200">Your intelligent farming assistant</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        
        {/* MY FARM SNAPSHOT (If logged in and has farms) */}
        {user && farms.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border-l-4 border-gold-500 bg-white dark:bg-forest-900">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Farm Snapshot</p>
              <button className="text-[10px] font-bold text-forest-600">Manage</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">              {farms.map((f) => (
                <div key={f.id} className="min-w-[140px] bg-forest-50 dark:bg-forest-800 p-3 rounded-xl">
                  <p className="text-sm font-extrabold text-forest-900 dark:text-white truncate">{f.farm_name}</p>
                  <p className="text-[10px] text-forest-600 dark:text-forest-300">{f.current_count} {f.farm_type}</p>
                  <p className="text-[9px] text-gray-500 mt-1">{f.stage || 'Active'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOOLS GRID */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">AI Tools & Advisers</p>
          <div className="grid grid-cols-3 gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const Wrapper = tool.href ? Link : 'button';
              return (
                <Wrapper
                  key={tool.id}
                  href={tool.href || '#'}
                  onClick={() => !tool.href && setView(tool.id as View)}
                  className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-forest-800 dark:text-forest-100 text-center leading-tight">{tool.label}</p>
                </Wrapper>
              );
            })}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="space-y-2">
            <button onClick={() => setView('animal')} className="w-full flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-left active:scale-[0.98]">
              <span className="text-xl">🐔</span>
              <div>
                <p className="text-sm font-bold text-forest-900 dark:text-white">My birds are growing slowly</p>
                <p className="text-[10px] text-gray-500">Get instant poultry management advice</p>
              </div>
            </button>
            <button onClick={() => setView('crop')} className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-left active:scale-[0.98]">
              <span className="text-xl">🌱</span>
              <div>
                <p className="text-sm font-bold text-forest-900 dark:text-white">Leaves are turning yellow</p>                <p className="text-[10px] text-gray-500">Diagnose crop nutrient deficiencies</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}