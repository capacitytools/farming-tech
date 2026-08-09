import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, tribe } = body;
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY in Vercel." }, { status: 500 });

    const base64 = image.includes(",") ? image.split(",")[1] : image;
    const mime = image.startsWith("data:") ? image.split(";")[0].split(":")[1] : "image/jpeg";

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert agricultural veterinarian and crop doctor for African farmers. Analyze this farm image (category: ${tribe || "general"}). Return ONLY valid JSON with exactly this structure:
{"diagnosis": "string", "confidence": 0-100, "severity": "low|moderate|high|critical", "symptoms": ["string"], "treatment_plan": ["string"], "advice": "string"}
If the image is not a plant or animal, set diagnosis to "Not a farm subject" and severity to "low".`;

    const aiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mime, data: base64 } }, { text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.4 },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      let reason = "";
      try {
        const ej = JSON.parse(errText);
        reason = ej?.error?.message || "";
      } catch {}
      return NextResponse.json({ error: "AI error: " + (reason || "could not reach model " + model) }, { status: 502 });
    }

    const aiJson = await aiRes.json();
    const text = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let result: any = {};
    try {
      result = JSON.parse(text);
    } catch {
      result = { diagnosis: text, severity: "moderate", confidence: 50, symptoms: [], treatment_plan: [], advice: "" };
    }

    const sev = ["low", "moderate", "high", "critical"].includes(result.severity) ? result.severity : "moderate";

    const supabase = createClient();
    let imageUrl = "";
    try {
      const buf = Buffer.from(base64, "base64");
      const path = `scan-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("scan-images").upload(path, buf, { contentType: mime, upsert: false });
      if (!upErr) imageUrl = supabase.storage.from("scan-images").getPublicUrl(path).data.publicUrl;
    } catch {}

    const { data: { user } } = await supabase.auth.getUser();
    if (user && imageUrl) {
      await supabase.from("ai_scans").insert({
        user_id: user.id,
        image_url: imageUrl,
        diagnosis: result.diagnosis || null,
        confidence: Number(result.confidence) || null,
        severity: sev,
        symptoms: result.symptoms || [],
        treatment_plan: result.treatment_plan || [],
        raw_ai_response: result,
      });
    }

    return NextResponse.json({ ok: true, loggedIn: !!user, imageUrl, ...result, severity: sev });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Scan failed" }, { status: 500 });
  }
}