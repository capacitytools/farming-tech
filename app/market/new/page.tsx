"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currency";

export default function NewListingPage() {
  const [tribes, setTribes] = useState<any[]>([]);
  const [tribeId, setTribeId] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      const { data } = await supabase.from("tribes").select("id, name, icon").order("name");
      setTribes(data || []);
    })();
  }, []);

  async function handleImage(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file);
    if (!error) {
      setImage(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
      setMessage("Photo added ✅");
    } else setMessage("Upload failed: " + error.message);
    setUploading(false);  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Please log in first.");
      setLoading(false);
      return;
    }
    if (tribeId === "Other" && !customCategory.trim()) {
      setMessage("Please type the category name.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("livestock_listings").insert({
      seller_id: user.id,
      tribe_id: tribeId === "Other" ? null : tribeId,
      custom_category: tribeId === "Other" ? customCategory.trim() : null,
      currency,
      title,
      description,
      price: Number(price),
      quantity: Number(quantity),
      breed,
      age,
      location,
      images: image ? [image] : [],
      status: "pending",
    });
    if (error) setMessage("Error: " + error.message);
    else {
      setMessage("Submitted! The admin will review it soon. ✅");
      setTimeout(() => router.push("/market"), 1500);
    }
    setLoading(false);
  }

  if (!loggedIn) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Log in to sell</h2>
        <p className="text-gray-500 mb-6">Create an account to list your livestock on the marketplace.</p>
        <a href="/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">Log in / Sign up</a>
      </div>
    );
  }
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🐄 Sell Livestock / Goods</h1>
      <p className="text-gray-600 text-sm mb-6">Your listing goes live after admin approval.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Title, e.g. 20 Healthy Broilers *" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" required value={tribeId} onChange={(e) => setTribeId(e.target.value)}>
          <option value="">Choose category *</option>
          {tribes.map((t: any) => (
            <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
          ))}
          <option value="Other">🧺 Other (type the name)</option>
        </select>
        {tribeId === "Other" && (
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Type category name, e.g. Snails, Turkey, Cassava *" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
        )}
        <textarea className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Description (health, vaccination, etc.) *" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-gray-600">Price *</label>
            <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Amount *" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Currency (pick one)</label>
            <select className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Quantity *" type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
          <input className="w-full p-3 rounded-xl border border-gray-200 bg-white/70" placeholder="Location, e.g. Akure" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">Photo</label>
          <input type="file" accept="image/*" onChange={handleImage} className="w-full text-sm mt-1" />
          {image && <img src={image} alt="listing" className="mt-2 h-32 w-full object-cover rounded-xl" />}
        </div>
        {uploading && <p className="text-sm text-center text-gray-500">Uploading photo…</p>}
        {message && <p className="text-sm text-center text-red-600">{message}</p>}
        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50" disabled={loading || uploading}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </button>      </form>
    </div>
  );
}
