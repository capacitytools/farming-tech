"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { compressAndUploadImage } from "@/lib/media";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Message = {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  media_url: string | null;
  created_at: string;
  status: "sending" | "sent" | "delivered" | "read";
};

export function ChatWindow({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, chat_id, user_id, text, media_url, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const formatted = data.map((msg) => ({ ...msg, status: "delivered" as const }));
        setMessages(formatted);
      }
    };
    fetchMessages();
  }, [chatId, supabase]);

  // 2. Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },        (payload) => {
          const newMsg = { ...(payload.new as any), status: "delivered" as const };
          setMessages((prev) => {
            // Prevent duplicates from optimistic UI
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Handler
  const handleSend = async (file?: File) => {
    if (!text.trim() && !file) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      user_id: currentUserId,
      text: text.trim(),
      media_url: null,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setIsUploading(!!file);

    try {
      let mediaUrl = null;
      if (file) {
        mediaUrl = await compressAndUploadImage(file, currentUserId);
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,          user_id: currentUserId,
          text: optimisticMsg.text,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Update optimistic message with real ID and "sent" status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, id: data.id, status: "sent" } : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, status: "sending" } : msg))
      );
      alert("Failed to send. Tap to retry.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSend(file);
  };

  return (
    <div className="flex flex-col h-full bg-gbackground dark:bg-gdark-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.user_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-gbubble px-4 py-3 shadow-sm ${
                  isOwn
                    ? "bg-ggreen-primary text-white"
                    : "bg-glight-bubble text-gtext dark:bg-gdark-bubble dark:text-gdark-text"
                }`}
              >
                {msg.media_url && (
                  <img
                    src={msg.media_url}                    alt="Attachment"
                    className="rounded-lg mb-2 max-w-full h-auto"
                  />
                )}
                {msg.text && <p className="whitespace-pre-wrap break-words text-[15px]">{msg.text}</p>}
                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isOwn ? "text-white/80" : "text-gmuted dark:text-gdark-muted"}`}>
                  <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                  {isOwn && (
                    <span>
                      {msg.status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "read" && <span className="text-gblue-primary">✓✓</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-gborder bg-white dark:border-gdark-border dark:bg-gdark-surface p-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-12 w-12 items-center justify-center rounded-full text-gmuted hover:bg-gborder/50 dark:hover:bg-gdark-border/50 disabled:opacity-50"
          >
            <ImageIcon className="h-6 w-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full max-h-32 min-h-[48px] resize-none rounded-gbutton border border-gborder bg-gbackground px-4 py-3 text-[15px] outline-none focus:border-ggreen-primary dark:border-gdark-border dark:bg-gdark-background"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!text.trim() || isUploading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ggreen-primary text-white shadow-lg shadow-ggreen-primary/30 active:bg-ggreen-deep disabled:opacity-50 disabled:shadow-none"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}