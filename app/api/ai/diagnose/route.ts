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

    const prompt = `You are an expert agricultural doctor for a Nigerian farming platform.
The farmer uploaded a photo. Subject type: ${subject || "unknown"}.
Analyze the photo carefully and reply in this EXACT format:

DIAGNOSIS: (what the problem is, in simple language)
SEVERITY: (Low, Medium, or High)
TREATMENT: (step-by-step treatment with locally available products/dosages)
PREVENTION: (how to stop it coming back)

Be practical, use Nigerian farm context, keep it under 300 words.`;

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
        const json = await res.json();
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