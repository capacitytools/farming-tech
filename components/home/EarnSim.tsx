"use client";

import { useState } from "react";

export default function EarnSim() {
  const [min, setMin] = useState(30);
  const [posts, setPosts] = useState(1);
  const [friends, setFriends] = useState(2);
  const [verified, setVerified] = useState(true);

  const timePts = Math.min(200, Math.floor((min * 30) / 5));
  const postPts = Math.min(200, posts * 100);
  const friendPts = friends * 25;
  const base = timePts + postPts + friendPts + 60;
  const total = verified ? Math.round(base * 1.1) : base;

  return (
    <div className="glass-card p-4 rounded-2xl border-2 border-purple-300">
      <p className="font-bold text-sm mb-1">💰 Earnings Simulator</p>
      <p className="text-[10px] text-gray-500 mb-3">Slide to see what YOUR month could look like:</p>

      <label className="text-xs font-bold text-gray-600">⏱️ Minutes on app daily: <span className="text-purple-700">{min}</span></label>
      <input type="range" min={5} max={240} step={5} value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full" />

      <label className="text-xs font-bold text-gray-600">📝 Posts per day: <span className="text-purple-700">{posts}</span></label>
      <input type="range" min={0} max={2} value={posts} onChange={(e) => setPosts(Number(e.target.value))} className="w-full" />

      <label className="text-xs font-bold text-gray-600">🎁 Friends invited: <span className="text-purple-700">{friends}</span></label>
      <input type="range" min={0} max={20} value={friends} onChange={(e) => setFriends(Number(e.target.value))} className="w-full" />

      <label className="flex items-center gap-2 text-xs font-bold mt-2">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> ✅ Verified member (+10%)
      </label>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 text-center mt-3">
        <p className="text-[10px] text-purple-200">≈ YOUR MONTH</p>
        <p className="text-3xl font-extrabold">{total} pts</p>
        <p className="text-[10px] text-purple-100 mt-1">= your share of the ad pool + rank climb + badges 🏅</p>
      </div>
    </div>
  );
}