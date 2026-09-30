'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, AlertTriangle, Sprout } from 'lucide-react';

type Message = { role: 'user' | 'ai'; text: string; warning?: boolean };

export default function AdviserChat({ 
  title, 
  icon, 
  systemPrompt, 
  onBack 
}: { 
  title: string; 
  icon: string; 
  systemPrompt: string; 
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Hello! I am your FTB ${title}. What are you working on today? Please describe your situation, and I will ask any clarifying questions before giving advice.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const key = localStorage.getItem('ftb_gemini_key') || '';
    if (!key) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Please set your Gemini API key in the Article Engine first, or add it to your profile settings.', warning: true }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [            ...messages.map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMsg }] }
          ],
        }),
      });
      const data = await res.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';
      
      // Check for safety/uncertainty markers
      const hasWarning = /consult a vet|uncertain|cannot diagnose|visual observation/i.test(aiText);
      setMessages((prev) => [...prev, { role: 'ai', text: aiText, warning: hasWarning }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Network error. Please check your connection.', warning: true }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto bg-white dark:bg-forest-900">
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-forest-900/90 backdrop-blur border-b border-gray-100 dark:border-forest-800 p-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-forest-800">
          <ArrowLeft className="w-5 h-5 text-forest-700 dark:text-forest-200" />
        </button>
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-extrabold text-forest-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-forest-600 text-white rounded-br-none' 
                : m.warning 
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-none' 
                  : 'bg-gray-100 dark:bg-forest-800 text-forest-900 dark:text-forest-100 rounded-bl-none'
            }`}>
              {m.warning && m.role === 'ai' && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mb-1 uppercase">
                  <AlertTriangle className="w-3 h-3" /> Agricultural Advisory
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-forest-800 p-3 rounded-2xl rounded-bl-none flex gap-1">
              <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>              <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="sticky bottom-0 p-4 bg-white dark:bg-forest-900 border-t border-gray-100 dark:border-forest-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Describe your farm situation..."
            className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-forest-700 bg-gray-50 dark:bg-forest-800 text-sm focus:ring-2 focus:ring-forest-500 outline-none"
          />
          <button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="bg-forest-600 text-white p-3 rounded-xl disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}