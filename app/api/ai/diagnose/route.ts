import { NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
];

export async function POST(req: Request) {
  try {
    const { image, subject } = await req.json();
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Gemini API key missing in Vercel" }, { status: 500 });
    if (!image?.base64) return NextResponse.json({ error: "No image sent" }, { status: 400 });

    const prompt = `You are a professional agricultural doctor AI for a Nigerian farming platform.
Analyze the photo carefully. Subject type: ${subject || "unknown"}.

Reply with PLAIN TEXT ONLY. Do NOT use asterisks, hashtags, bold markers or any markdown characters. Use this exact structure:

DIAGNOSIS: direct, specific name of the disease or problem
CONFIDENCE: your confidence level as a percentage (e.g. 88%)
SEVERITY: Low, Medium or High
CAUSE: one short sentence explaining why it happened
TREATMENT:
- step with exact product name and dosage available in Nigeria
- step
- step
PREVENTION:
- step
- step

Be concise, direct, specific and professional. Under 250 words.`;

    let lastError = "";
    for (const model of MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: image.mime || "image/jpeg", data: image.base64 } },
                  ],
                },
              ],
            }),
          }
        );
        const raw = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(raw);
        } catch {
          lastError = raw.slice(0, 100) || `HTTP ${res.status}`;
          continue;
        }
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return NextResponse.json({ ok: true, result: text, model });
        lastError = json?.error?.message || "No text returned";
      } catch (e: any) {
        lastError = e?.message || "model failed";
      }
    }
    return NextResponse.json({ error: lastError || "All AI models failed" }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}