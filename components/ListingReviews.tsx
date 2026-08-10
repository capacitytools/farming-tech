"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ListingReviews({ listingId }: { listingId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("listing_reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
  }

  useEffect(() => {
    load();
  }, [listingId]);

  async function submit(e: any) {
    e.preventDefault();
    if (!user) {
      setMessage("Log in to leave a review.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("listing_reviews").insert({ listing_id: listingId, user_id: user.id, rating, comment });
    if (!error) {
      setComment("");
      setMessage("Review added ✅");
      load();
    } else setMessage(error.message);
  }

  const avg = reviews.length ? (reviews.reduce((a, r) => a + Number(r.rating), 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="glass-card p-5 rounded-2xl shadow-lg mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">⭐ Reviews</h2>
        {avg && <span className="text-sm font-bold text-amber-500">⭐ {avg} ({reviews.length})</span>}
      </div>

      <form onSubmit={submit} className="mb-4">
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "" : "grayscale opacity-40"}`}>
              ⭐
            </button>
          ))}
        </div>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" rows={2} placeholder="Write your review..." value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Post review</button>
        {message && <p className="text-xs text-green-700 mt-2">{message}</p>}
      </form>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white/60 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">
                {r.profiles?.full_name?.[0] || "?"}
              </div>
              <span className="text-sm font-semibold">{r.profiles?.full_name || "User"}</span>
              <span className="text-xs text-amber-500 ml-auto">{"⭐".repeat(Number(r.rating))}</span>
            </div>
            {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>}
      </div>
    </div>
  );
}