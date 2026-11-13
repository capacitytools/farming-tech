'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Define the 10 themes visually
const THEMES = [
  { id: 'theme-1', name: 'Classic Green', color: 'bg-forest-600', desc: 'Clean, bright, and professional.' },
  { id: 'theme-2', name: 'Modern Dark', color: 'bg-gray-900', desc: 'Sleek dark mode for night reading.' },
  { id: 'theme-3', name: 'Magazine Style', color: 'bg-amber-500', desc: 'Bold typography and cards.' },
  { id: 'theme-4', name: 'Minimalist', color: 'bg-white border', desc: 'Just text and whitespace.' },
  { id: 'theme-5', name: 'Agri-Bold', color: 'bg-green-700', desc: 'Heavy headers and images.' },
  { id: 'theme-6', name: 'Earth Tones', color: 'bg-earth-500', desc: 'Brown and beige palette.' },
  { id: 'theme-7', name: 'Tech Blue', color: 'bg-blue-600', desc: 'For the AgriTech writers.' },
  { id: 'theme-8', name: 'Warm Sunset', color: 'bg-orange-500', desc: 'Orange gradients and soft corners.' },
  { id: 'theme-9', name: 'Nature Soft', color: 'bg-teal-600', desc: 'Calming teal and light gray.' },
  { id: 'theme-10', name: 'Editorial', color: 'bg-slate-800', desc: 'Newspaper-style serif fonts.' },
];

export default function ThemeSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedTheme, setSelectedTheme] = useState('theme-1');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return router.push('/login');
      setUser(u);

      // We need to check their existing posts to see what theme they currently use
      const { data } = await supabase.from('blogs').select('theme_id').eq('author_id', u.id).limit(1).single();
      if (data?.theme_id) setSelectedTheme(data.theme_id);

      setLoaded(true);
    }
    init();
  }, [router]);

  async function saveTheme() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    // Apply this theme to ALL of the user's existing articles
    const { error } = await supabase.from('blogs').update({ theme_id: selectedTheme }).eq('author_id', user.id);

    if (error) {
      alert('Error saving theme: ' + error.message);
    } else {
      alert('✅ Theme applied to all your articles!');
    }
    setSaving(false);
  }

  if (!loaded) return <p className="text-center p-10">Loading themes...</p>;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-800">🎨 Blog Themes</h1>
        <p className="text-xs text-gray-500">Choose how your blog looks to your readers.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(t => (
          <div 
            key={t.id} 
            onClick={() => setSelectedTheme(t.id)}
            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedTheme === t.id ? 'border-forest-600 shadow-md scale-[1.02]' : 'border-gray-200 bg-white'}`}
          >
            <div className={`w-full h-16 rounded-xl mb-2 ${t.color} flex items-center justify-center`}>
              {selectedTheme === t.id && <span className="text-white text-xl">✓</span>}
            </div>
            <p className="text-xs font-extrabold text-forest-900">{t.name}</p>
            <p className="text-[9px] text-gray-500 mt-1">{t.desc}</p>
          </div>
        ))}
      </div>

      <button onClick={saveTheme} disabled={saving} className="w-full bg-forest-600 text-white py-4 rounded-xl font-extrabold shadow-md mt-4">
        {saving ? 'Saving...' : '💾 APPLY THIS THEME'}
      </button>
    </div>
  );
}