'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Bot, Send } from 'lucide-react';

type Message = { role: 'user' | 'ai'; text: string };

function naira(x: number) {
  return '₦' + Number(x || 0).toLocaleString();
}

export default function FarmAgentPage() {
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data: f } = await supabase.from('farm_records').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
      setFarms(f || []);
      const { data: l } = await supabase.from('farm_logs').select('*').eq('user_id', u.id).order('log_date', { ascending: false }).limit(300);
      setLogs(l || []);
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  function buildContext() {
    const lines: string[] = [];
    farms.forEach((f) => {
      const fl = logs.filter((l) => l.farm_id === f.id);
      const days = Math.floor((Date.now() - new Date(f.created_at).getTime()) / 86400000);
      const exp = fl.filter((l) => ['expense', 'purchase', 'feed', 'health'].includes(l.log_type)).reduce((a, l) => a + Number(l.amount || 0), 0);
      const rev = fl.filter((l) => ['sale', 'income'].includes(l.log_type)).reduce((a, l) => a + Number(l.amount || 0), 0);
      const mort = fl.filter((l) => l.log_type === 'mortality').reduce((a, l) => a + Number(l.quantity || 0), 0);      const today = new Date().toISOString().slice(0, 10);
      const loggedToday = fl.some((l) => l.log_date === today);
      const tasks = fl.filter((l) => l.log_type === 'task' && !l.done).map((l) => l.note || 'unnamed task');
      lines.push(
        'FARM: ' + f.farm_name + ' (' + f.farm_type + ') | age: day ' + days + ' | stage: ' + (f.stage || 'n/a') + ' | current count: ' + f.current_count +
        ' | total expenses: ' + naira(exp) + ' | total revenue: ' + naira(rev) + ' | total mortality: ' + mort +
        ' | record logged today: ' + (loggedToday ? 'yes' : 'NO') +
        ' | pending tasks: ' + (tasks.length ? tasks.join(', ') : 'none') +
        ' | recent records: ' + fl.slice(0, 6).map((l) => l.log_date + ' ' + l.log_type + (l.quantity ? ' qty' + l.quantity : '') + (l.amount ? ' ' + naira(l.amount) : '')).join('; ')
      );
    });
    return lines.join('\n') || 'The farmer has no saved farms yet.';
  }

  function reminders() {
    const out: string[] = [];
    const today = new Date().toISOString().slice(0, 10);
    farms.forEach((f) => {
      const fl = logs.filter((l) => l.farm_id === f.id);
      const days = Math.floor((Date.now() - new Date(f.created_at).getTime()) / 86400000);
      out.push(f.farm_name + ' is on day ' + days + (f.stage ? ' (' + f.stage + ')' : ''));
      if (!fl.some((l) => l.log_date === today)) out.push('No record logged today for ' + f.farm_name);
      const pend = fl.filter((l) => l.log_type === 'task' && !l.done).length;
      if (pend) out.push(pend + ' pending task(s) on ' + f.farm_name);
    });
    return out.slice(0, 5);
  }

  async function quickLog(type: string) {
    if (!user || !farms.length) return alert('Create a farm first.');
    const q = window.prompt(type === 'mortality' ? 'How many birds died today?' : type === 'feed' ? 'How many bags/units of feed?' : 'Amount in Naira?');
    if (!q) return;
    const supabase = createClient();
    await supabase.from('farm_logs').insert({
      user_id: user.id,
      farm_id: farms[0].id,
      log_type: type,
      quantity: type === 'expense' ? null : Number(q),
      amount: type === 'expense' ? Number(q) : null,
      note: 'Quick log via Farm Agent',
      log_date: new Date().toISOString().slice(0, 10),
    });
    load();
    setMessages((m) => [...m, { role: 'ai', text: 'Recorded: ' + type + ' ' + q + ' on ' + farms[0].farm_name + '. Your dashboard is updated.' }]);
  }

  async function send(textOverride?: string) {
    const text = (textOverride || input).trim();
    if (!text || busy) return;
    setInput('');    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    const key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      setMessages((m) => [...m, { role: 'ai', text: 'Add your Gemini API key in the Article Engine first, then I can think with you.' }]);
      setBusy(false);
      return;
    }
    const system = 'You are the FTB Farm Agent, a personal assistant for ONE logged-in farmer. You may use ONLY the private farm data below. Never mention other users. Reference their real numbers (day count, expenses, mortality, tasks) in answers. Be practical, concise, farmer-friendly. When a record is missing (e.g. no mortality log today), gently offer to help update it. Never give veterinary dosages without advising a vet check.\nFARMER DATA:\n' + buildContext();
    const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let reply = '';
    for (let i = 0; i < models.length && !reply; i++) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [...messages.map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text }] }],
          }),
        });
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e) { reply = ''; }
    }
    setMessages((m) => [...m, { role: 'ai', text: reply || 'I could not reach the AI just now. Try again in a moment.' }]);
    setBusy(false);
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading Farm Agent...</p>;

  const rems = reminders();

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto bg-gray-50 dark:bg-forest-950">
      <div className="bg-gradient-to-br from-cyan-700 to-forest-900 text-white p-4 flex items-center gap-3">
        <Link href="/ai-farm" className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></Link>
        <Bot className="w-6 h-6 text-gold-400" />
        <div>
          <h1 className="text-lg font-extrabold">My Farm Agent</h1>
          <p className="text-[10px] text-cyan-100">Knows your farms, records and numbers — privately</p>
        </div>
      </div>

      {rems.length > 0 && (
        <div className="mx-4 mt-3 glass-card bg-white dark:bg-forest-900 p-3 rounded-2xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Smart reminders</p>
          {rems.map((r, i) => <p key={i} className="text-[11px] text-forest-800 dark:text-forest-100">• {r}</p>)}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="glass-card bg-white dark:bg-forest-900 p-4 rounded-2xl text-center">
            <p className="text-2xl mb-1">🤖</p>
            <p className="text-sm font-bold text-forest-900 dark:text-white">Good day, Chief of your farm 👋</p>
            <p className="text-[11px] text-gray-500 mt-1">Ask me anything about your own farm data, or use the quick buttons below.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ' + (m.role === 'user' ? 'bg-forest-600 text-white rounded-br-none' : 'bg-white dark:bg-forest-900 text-forest-900 dark:text-forest-100 rounded-bl-none shadow-sm')}>{m.text}</div>
          </div>
        ))}
        {busy && <p className="text-center text-[10px] text-gray-400 animate-pulse">Farm Agent is reading your records...</p>}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-white dark:bg-forest-900 border-t border-gray-100 dark:border-forest-800 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => send('Summarize my farm status in short bullets.')} className="whitespace-nowrap bg-forest-50 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-3 py-1.5 rounded-full text-[10px] font-bold">📊 Summarize my farm</button>
          <button onClick={() => send('What should I focus on this week based on my records?')} className="whitespace-nowrap bg-forest-50 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-3 py-1.5 rounded-full text-[10px] font-bold">📅 This week's plan</button>
          <button onClick={() => quickLog('mortality')} className="whitespace-nowrap bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-bold">⚠️ Log mortality</button>
          <button onClick={() => quickLog('feed')} className="whitespace-nowrap bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-bold">🌾 Log feed</button>
          <button onClick={() => quickLog('expense')} className="whitespace-nowrap bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-[10px] font-bold">💸 Log expense</button>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-forest-700 bg-gray-50 dark:bg-forest-800 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            placeholder="Ask your Farm Agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={() => send()} disabled={busy || !input.trim()} className="bg-forest-600 text-white p-3 rounded-xl disabled:opacity-50"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}