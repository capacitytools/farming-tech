"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrainingRoom({ training, onDone }: { training: any; onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(Number(training.duration_min || 30) * 60);
  const [rec, setRec] = useState(false);
  const recorderRef = useRef<any>(null);
  const chunksRef = useRef<any[]>([]);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunksRef.current = [];
      r.ondataavailable = (e: any) => chunksRef.current.push(e.data);
      r.start();
      recorderRef.current = r;
      setRec(true);
    } catch {
      alert("Microphone permission is needed to record the training.");
    }
  }

  async function endTraining() {
    const supabase = createClient();
    let audioUrl = training.audio_url || null;
    if (recorderRef.current && rec) {
      await new Promise((res) => {
        recorderRef.current.onstop = res;
        recorderRef.current.stop();
      });
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const path = `training-${training.id}.webm`;
      const { error } = await supabase.storage.from("trainings").upload(path, blob);
      if (!error) audioUrl = supabase.storage.from("trainings").getPublicUrl(path).data.publicUrl;
    }
    await supabase.from("tribe_trainings").update({ status: "ended", audio_url: audioUrl }).eq("id", training.id);
    onDone();
  }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <div className="glass-card p-3 rounded-2xl border-2 border-red-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        <p className="text-sm font-extrabold text-red-600">LIVE TRAINING</p>
        <span className="ml-auto font-mono text-sm font-bold">⏳ {m}:{String(s).padStart(2, "0")}</span>
      </div>
      <iframe
        src={`https://meet.jit.si/${training.room}`}
        allow="camera; microphone; fullscreen; display-capture"
        className="w-full h-80 rounded-xl bg-black"
      />
      <div className="flex gap-2 mt-2">
        {!rec ? (
          <button onClick={startRec} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-bold">⏺ Record My Voice</button>
        ) : (
          <span className="flex-1 text-center text-xs font-bold text-red-600 animate-pulse py-2">● Recording...</span>
        )}
        <button onClick={endTraining} className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-xs font-bold">⏹ End & Save to Library</button>
      </div>
      <p className="text-[9px] text-gray-400 mt-2">Members join free via Jitsi · your voice recording is compressed & saved to the tribe Training Library forever.</p>
    </div>
  );
}