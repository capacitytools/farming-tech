'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Tractor } from 'lucide-react';

const FARM_EMOJI: any = {
  Poultry: '🐔', Goats: '🐐', Rabbits: '🐇', Cattle: '🐄', Sheep: '🐑', Pigs: '🐖',
  Maize: '🌽', Rice: '🍚', Tomato: '🍅', Vegetables: '🥬', Cassava: '🌱', Other: '🌾',
};

export default function MyFarmPage() {
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ farm_name: '', farm_type: 'Poultry', current_count: '', stage: '', notes: '' });

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data } = await supabase.from('farm_records').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
      setFarms(data || []);
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function createFarm(e: any) {
    e.preventDefault();
    if (!user) return alert('Log in to create a farm.');
    if (!form.farm_name.trim()) return alert('Give your farm a name.');
    setBusy(true);
    const supabase = createClient();
    await supabase.from('farm_records').insert({
      user_id: user.id,
      farm_name: form.farm_name.trim(),
      farm_type: form.farm_type,
      current_count: Number(form.current_count) || 0,
      stage: form.stage.trim() || null,
      notes: form.notes.trim() || null,
    });
    setForm({ farm_name: '', farm_type: 'Poultry', current_count: '', stage: '', notes: '' });
    setShowForm(false);
    setBusy(false);    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading My Farm...</p>;

  return (
    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-forest-950">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-5 rounded-b-3xl flex items-center gap-3">
        <Link href="/ai-farm" className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">👨‍🌾 My Farm</h1>
          <p className="text-[10px] text-forest-200">Your farms, records and production at a glance</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-gold-500 text-forest-900 p-2.5 rounded-xl font-bold"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="p-4 space-y-4">
        {!user && (
          <div className="glass-card bg-white dark:bg-forest-900 p-6 rounded-2xl text-center">
            <p className="text-3xl mb-2">🔐</p>
            <p className="text-sm font-bold text-forest-900 dark:text-white mb-3">Log in to start managing your farm records.</p>
            <Link href="/login" className="inline-block bg-forest-600 text-white px-6 py-2.5 rounded-xl text-sm font-extrabold">Log In / Register</Link>
          </div>
        )}

        {user && showForm && (
          <form onSubmit={createFarm} className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl space-y-2 border-2 border-forest-300">
            <p className="text-sm font-extrabold text-forest-700">Create a new farm</p>
            <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Farm name (e.g. Olubunmi Poultry Farm)" value={form.farm_name} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} />
            <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" value={form.farm_type} onChange={(e) => setForm({ ...form, farm_type: e.target.value })}>
              {Object.keys(FARM_EMOJI).map((t) => <option key={t} value={t}>{FARM_EMOJI[t]} {t}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" type="number" placeholder="Current birds/plants" value={form.current_count} onChange={(e) => setForm({ ...form, current_count: e.target.value })} />
              <input className="p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" placeholder="Stage (e.g. Day 21)" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} />
            </div>
            <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70 text-sm" rows={2} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="w-full bg-forest-600 text-white py-3 rounded-xl font-extrabold disabled:opacity-50" disabled={busy}>{busy ? 'Saving...' : '🌾 Create Farm'}</button>
          </form>
        )}

        {user && farms.length === 0 && !showForm && (
          <div className="glass-card bg-white dark:bg-forest-900 p-8 rounded-2xl text-center">
            <Tractor className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-forest-900 dark:text-white mb-1">No farms yet</p>
            <p className="text-xs text-gray-500 mb-4">Create your first farm to start recording feed, mortality, sales and expenses.</p>
            <button onClick={() => setShowForm(true)} className="bg-forest-600 text-white px-6 py-2.5 rounded-xl text-sm font-extrabold">+ Create My First Farm</button>
          </div>
        )}
        {farms.map((f) => (
          <Link key={f.id} href={'/ai-farm/my-farm/' + f.id} className="block glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-forest-800 flex items-center justify-center text-2xl">{FARM_EMOJI[f.farm_type] || '🌾'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-forest-900 dark:text-white truncate">{f.farm_name}</p>
                <p className="text-[10px] text-gray-500">{f.farm_type} · {Number(f.current_count).toLocaleString()} units · {f.stage || 'Active'}</p>
              </div>
              <span className="text-forest-400 font-bold text-xs">Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}