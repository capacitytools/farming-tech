"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InboxPage() {
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatWith, setChatWith] = useState("");
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setChatWith(params.get("user") || "");
    (async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      setLoaded(true);
    })();
  }, []);

  async function load() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("direct_messages")
      .select("*, sender:profiles!direct_messages_sender_id_fkey(id, full_name, avatar_url), receiver:profiles!direct_messages_receiver_id_fkey(id, full_name, avatar_url)")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    if (chatWith) {
      const { data: op } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", chatWith).single();
      setOtherProfile(op);
      await supabase.from("direct_messages").update({ read: true }).eq("receiver_id", user.id).eq("sender_id", chatWith).eq("read", false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    }
  }

  useEffect(() => {
    if (user) {
      load();
      const t = setInterval(load, 8000);
      return () => clearInterval(t);
    }
  }, [user, chatWith]);
  async function send(e: any) {
    e.preventDefault();
    if (!text.trim() || !chatWith) return;
    const supabase = createClient();
    await supabase.from("direct_messages").insert({ sender_id: user.id, receiver_id: chatWith, content: text.trim() });
    setText("");
    load();
  }

  if (!loaded) return <p className="text-center text-gray-500 py-10">Loading…</p>;
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">💬 Inbox</h1>
        <p className="text-gray-500 mb-6">Log in to message other farmers.</p>
        <a href="/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">Log in</a>
      </div>
    );
  }

  const thread = messages.filter((m) => (m.sender_id === user.id && m.receiver_id === chatWith) || (m.sender_id === chatWith && m.receiver_id === user.id));

  const convos: any = {};
  messages.forEach((m) => {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
    const other = m.sender_id === user.id ? m.receiver : m.sender;
    if (!convos[otherId]) convos[otherId] = { other, last: m, unread: 0 };
    else convos[otherId].last = m;
    if (m.receiver_id === user.id && !m.read) convos[otherId].unread++;
  });
  const convoList = Object.entries(convos).sort((a: any, b: any) => new Date(b[1].last.created_at).getTime() - new Date(a[1].last.created_at).getTime());

  if (chatWith) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto flex flex-col" style={{ minHeight: "80vh" }}>
        <div className="flex items-center gap-3 mb-4">
          <a href="/inbox" className="text-2xl">←</a>
          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
            {otherProfile?.full_name?.[0] || "?"}
          </div>
          <p className="font-bold">{otherProfile?.full_name || "Farmer"}</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {thread.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.sender_id === user.id ? "bg-green-600 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow"}`}>
                {m.content}
              </div>
            </div>
          ))}          {thread.length === 0 && <p className="text-center text-gray-500 text-sm py-6">Say hello 👋 Start the conversation!</p>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 mt-4">
          <input className="flex-1 p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
          <button className="bg-green-600 text-white px-4 rounded-xl font-semibold">Send</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">💬 Inbox</h1>
      <div className="space-y-2">
        {convoList.length ? (
          convoList.map(([id, c]: [string, any]) => (
            <a key={id} href={`/inbox?user=${id}`} className="glass-card p-3 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-800">
                {c.other?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.other?.full_name || "Farmer"}</p>
                <p className="text-xs text-gray-500 truncate">{c.last.sender_id === user.id ? "You: " : ""}{c.last.content}</p>
              </div>
              {c.unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">{c.unread}</span>}
            </a>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10">No conversations yet.<br />Start one from any listing with 💬 Message Seller!</p>
        )}
      </div>
    </div>
  );
}