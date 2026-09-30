'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Bot } from 'lucide-react';

const TYPE_META: any = {
  feed: { e: '🌾', label: 'Feed' },
  mortality: { e: '⚠️', label: 'Mortality' },
  sale: { e: '💰', label: 'Sale' },
  income: { e: '💵', label: 'Income' },
  expense: { e: '💸', label: 'Expense' },
  purchase: { e: '🛒', label: 'Purchase' },
  health: { e: '💊', label: 'Health' },
  task: { e: '📅', label: 'Task' },
  production: { e: '📈', label: 'Production' },
  breeding: { e: '🐣', label: 'Breeding' },
};

function naira(x: number) {
  return '₦' + Number(x || 0).toLocaleString();
}

export default function FarmDetailPage({ params }: { params: { id: string } }) {
  const [farm, setFarm] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [log, setLog] = useState({ log_type: 'feed', quantity: '', amount: '', note: '', log_date: new Date().toISOString().slice(0, 10) });
  const [edit, setEdit] = useState({ current_count: '', stage: '' });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoaded(true); return; }
    const { data: f } = await supabase.from('farm_records').select('*').eq('id', params.id).eq('user_id', user.id).single();
    setFarm(f);
    if (f) {
      setEdit({ current_count: String(f.current_count || 0), stage: f.stage || '' });
      const { data: l } = await supabase.from('farm_logs').select('*').eq('farm_id', f.id).order('log_date', { ascending: false }).order('created_at', { ascending: false }).limit(200);
      setLogs(l || []);
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, [params.id]);

  async function addLog(e: any) {    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !farm) return;
    await supabase.from('farm_logs').insert({
      user_id: user.id,
      farm_id: farm.id,
      log_type: log.log_type,
      quantity: log.quantity ? Number(log.quantity) : null,
      amount: log.amount ? Number(log.amount) : null,
      note: log.note.trim() || null,
      log_date: log.log_date,
    });
    setLog({ log_type: 'feed', quantity: '', amount: '', note: '', log_date: new Date().toISOString().slice(0, 10) });
    setShowLog(false);
    load();
  }

  async function toggleTask(id: string, done: boolean) {
    const supabase = createClient();
    await supabase.from('farm_logs').update({ done: !done }).eq('id', id);
    load();
  }

  async function saveFarm(e: any) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from('farm_records').update({ current_count: Number(edit.current_count) || 0, stage: edit.stage.trim() || null }).eq('id', farm.id);
    setShowEdit(false);
    load();
  }

  async function deleteFarm() {
    if (!window.confirm('Delete this farm and ALL its records forever?')) return;
    const supabase = createClient();
    await supabase.from('farm_records').delete().eq('id', farm.id);
    window.location.href = '/ai-farm/my-farm';
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading farm...</p>;
  if (!farm) return <p className="text-center text-gray-500 py-10">Farm not found or not yours.</p>;

  const sum = (types: string[]) => logs.filter((l) => types.includes(l.log_type)).reduce((a, l) => a + Number(l.amount || 0), 0);
  const qty = (t: string) => logs.filter((l) => l.log_type === t).reduce((a, l) => a + Number(l.quantity || 0), 0);
  const expenses = sum(['expense', 'purchase', 'feed', 'health']);
  const revenue = sum(['sale', 'income']);
  const pendingTasks = logs.filter((l) => l.log_type === 'task' && !l.done);
  const days = Math.floor((Date.now() - new Date(farm.created_at).getTime()) / 86400000);

  return (    <div className="pb-24 max-w-2xl mx-auto min-h-screen bg-gray-50 dark:bg-forest-950">
      <div className="bg-gradient-to-br from-forest-700 to-forest-900 text-white p-5 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/ai-farm/my-farm" className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold">{farm.farm_name}</h1>
            <p className="text-[10px] text-forest-200">{farm.farm_type} · Day {days} · {farm.stage || 'Active'}</p>
          </div>
          <Link href="/ai-farm/agent" className="bg-gold-500 text-forest-900 p-2.5 rounded-xl"><Bot className="w-5 h-5" /></Link>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-white/10 rounded-xl p-2 text-center"><p className="text-sm font-extrabold">{Number(farm.current_count).toLocaleString()}</p><p className="text-[8px] text-forest-200">🐔 ANIMALS</p></div>
          <div className="bg-white/10 rounded-xl p-2 text-center"><p className="text-sm font-extrabold">{naira(expenses)}</p><p className="text-[8px] text-forest-200">💰 EXPENSES</p></div>
          <div className="bg-white/10 rounded-xl p-2 text-center"><p className="text-sm font-extrabold">{naira(revenue)}</p><p className="text-[8px] text-forest-200">📈 REVENUE</p></div>
          <div className="bg-white/10 rounded-xl p-2 text-center"><p className="text-sm font-extrabold">{pendingTasks.length}</p><p className="text-[8px] text-forest-200">⚠️ TASKS</p></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-forest-800 dark:text-white">{qty('feed')}</p><p className="text-[9px] text-gray-500 font-bold">🌾 FEED LOGS</p></div>
          <div className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-red-500">{qty('mortality')}</p><p className="text-[9px] text-gray-500 font-bold">⚠️ MORTALITY</p></div>
          <div className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl text-center"><p className="text-lg font-extrabold text-green-600">{naira(revenue - expenses)}</p><p className="text-[9px] text-gray-500 font-bold">💵 NET POSITION</p></div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowLog(!showLog)} className="flex-1 bg-forest-600 text-white py-3 rounded-xl text-sm font-extrabold">+ Record Activity</button>
          <button onClick={() => setShowEdit(!showEdit)} className="bg-gray-200 dark:bg-forest-800 text-forest-800 dark:text-white px-4 py-3 rounded-xl text-sm font-bold">✏️</button>
          <button onClick={deleteFarm} className="bg-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">🗑</button>
        </div>

        {showEdit && (
          <form onSubmit={saveFarm} className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="p-3 rounded-xl border border-gray-200 text-sm" type="number" placeholder="Current count" value={edit.current_count} onChange={(e) => setEdit({ ...edit, current_count: e.target.value })} />
              <input className="p-3 rounded-xl border border-gray-200 text-sm" placeholder="Stage (Day 30)" value={edit.stage} onChange={(e) => setEdit({ ...edit, stage: e.target.value })} />
            </div>
            <button className="w-full bg-forest-600 text-white py-2.5 rounded-xl text-sm font-extrabold">Save Changes</button>
          </form>
        )}

        {showLog && (
          <form onSubmit={addLog} className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl space-y-2 border-2 border-forest-300">
            <select className="w-full p-3 rounded-xl border border-gray-200 text-sm" value={log.log_type} onChange={(e) => setLog({ ...log, log_type: e.target.value })}>
              {Object.keys(TYPE_META).map((t) => <option key={t} value={t}>{TYPE_META[t].e} {TYPE_META[t].label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="p-3 rounded-xl border border-gray-200 text-sm" type="number" placeholder="Quantity (bags, birds...)" value={log.quantity} onChange={(e) => setLog({ ...log, quantity: e.target.value })} />
              <input className="p-3 rounded-xl border border-gray-200 text-sm" type="number" placeholder="Amount (₦)" value={log.amount} onChange={(e) => setLog({ ...log, amount: e.target.value })} />
            </div>            <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" type="date" value={log.log_date} onChange={(e) => setLog({ ...log, log_date: e.target.value })} />
            <input className="w-full p-3 rounded-xl border border-gray-200 text-sm" placeholder="Note (e.g. 3 bags starter feed, 2 birds lost)" value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })} />
            <button className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-extrabold">💾 Save Record</button>
          </form>
        )}

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Farm Records</p>
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl flex items-center gap-3">
                {l.log_type === 'task' ? (
                  <button onClick={() => toggleTask(l.id, l.done)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${l.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent'}`}>✓</button>
                ) : (
                  <span className="text-xl">{TYPE_META[l.log_type]?.e || '📝'}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold text-forest-900 dark:text-white ${l.done ? 'line-through opacity-50' : ''}`}>
                    {TYPE_META[l.log_type]?.label || l.log_type}{l.note ? ': ' + l.note : ''}
                  </p>
                  <p className="text-[9px] text-gray-500">
                    {l.log_date}
                    {l.quantity ? ' · qty ' + Number(l.quantity).toLocaleString() : ''}
                    {l.amount ? ' · ' + naira(l.amount) : ''}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No records yet. Tap "+ Record Activity" to log feed, mortality, sales or expenses.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}