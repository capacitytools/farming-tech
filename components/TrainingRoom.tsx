"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function loadLame(): Promise<any> {
  return new Promise((res, rej) => {
    if ((window as any).lamejs) return res((window as any).lamejs);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js";
    s.onload = () => res((window as any).lamejs);
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function webmToMp3(blob: Blob): Promise<Blob> {
  const lame = await loadLame();
  const ab = await blob.arrayBuffer();
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  const audio = await ctx.decodeAudioData(ab);
  const targetRate = 16000;
  const ch = audio.getChannelData(0);
  const ratio = audio.sampleRate / targetRate;
  const len = Math.floor(ch.length / ratio);
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) mono[i] = ch[Math.floor(i * ratio)];
  const int16 = new Int16Array(len);
  for (let i = 0; i < len; i++) int16[i] = Math.max(-32768, Math.min(32767, mono[i] * 32767));
  const encoder = new lame.Mp3Encoder(1, targetRate, 32);
  const block = 1152;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < int16.length; i += block) {
    const enc = encoder.encodeBuffer(int16.subarray(i, i + block));
    if (enc.length) parts.push(new Uint8Array(enc));
  }
  const end = encoder.flush();
  if (end.length) parts.push(new Uint8Array(end));
  return new Blob(parts as any, { type: "audio/mpeg" });
}

export default function TrainingRoom({ room, isHost, record, durationMin, tribeId, trainingId, onEnd }: {
  room: string; isHost: boolean; record: boolean; durationMin: number; tribeId: string; trainingId: string; onEnd: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("Connecting to live room...");
  const recRef = useRef<any>(null);
  const chunksRef = useRef<any[]>([]);
  useEffect(() => {
    (async () => {
      if (isHost && record) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const rec = new MediaRecorder(stream);
          recRef.current = rec;
          chunksRef.current = [];
          rec.ondataavailable = (e: any) => chunksRef.current.push(e.data);
          rec.start();
          setStatus("🔴 LIVE — recording your voice...");
        } catch {
          setStatus("🔴 LIVE (mic permission denied — call works but won't record)");
        }
      } else {
        setStatus("🔴 LIVE — you're in the training room!");
      }
    })();

    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function finish() {
    setProcessing(true);
    setStatus("⏹️ Ending training...");
    const supabase = createClient();
    let audioUrl: string | null = null;

    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
      await new Promise((r) => setTimeout(r, 800));
    }
    if (isHost && record && chunksRef.current.length) {
      try {
        setStatus("🎧 Compressing to MP3 & uploading...");
        const webm = new Blob(chunksRef.current, { type: "audio/webm" });
        const mp3 = await webmToMp3(webm);
        const path = `${tribeId}/${Date.now()}.mp3`;
        const { error } = await supabase.storage.from("trainings").upload(path, mp3, { contentType: "audio/mpeg" });        if (!error) audioUrl = supabase.storage.from("trainings").getPublicUrl(path).data.publicUrl;
      } catch (e) {
        console.error(e);
      }
    }

    await supabase.from("tribe_trainings").update({ status: "ended", audio_url: audioUrl }).eq("id", trainingId);
    setProcessing(false);
    onEnd();
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-forest-900/95 p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold">{status}</p>
          <span className={`text-white font-mono text-lg font-bold ${secondsLeft < 60 ? "text-red-400" : ""}`}>{mm}:{ss}</span>
        </div>
        <iframe
          src={`https://meet.jit.si/${room}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full rounded-2xl bg-white"
          style={{ height: "70vh" }}
        />
        {isHost && (
          <button onClick={finish} disabled={processing} className="mt-3 w-full bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {processing ? "Saving MP3 to tribe library..." : "⏹️ End Training & Save MP3"}
          </button>
        )}
        {!isHost && <p className="text-center text-forest-200 text-xs mt-3">The host's teaching is being recorded & will appear in the tribe Training Library. 🎧</p>}
      </div>
    </div>
  );
}