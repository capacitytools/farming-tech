import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/scan
 * Body: { imageUrl: string, tribeSlug: string }
 *
 * Production wiring:
 * 1. Receive the already-uploaded Supabase Storage image URL from the client
 *    (upload happens client-side via lib/uploadImage.ts into the `scan-images` bucket).
 * 2. Call a vision-capable model (e.g. Claude via the Anthropic API with an image
 *    input, or a specialized agri-vision model) with a structured prompt asking
 *    for diagnosis, confidence, severity, symptoms, and treatment steps as JSON.
 * 3. Persist the structured result to `ai_scans` and return it to the client.
 *
 * This stub validates the request and returns a deterministic placeholder so the
 * frontend flow can be wired and tested end-to-end before the AI model is connected.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const { imageUrl, tribeSlug } = body;

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
  }

  // TODO: replace with real vision-model call
  const diagnosis = {
    diagnosis: 'Sample Diagnosis — connect AI model to replace this',
    confidence: 80,
    severity: 'moderate' as const,
    symptoms: ['Sample symptom A', 'Sample symptom B'],
    treatment_plan: ['Sample treatment step 1', 'Sample treatment step 2'],
  };

  const { data: tribe } = await supabase
    .from('tribes')
    .select('id')
    .eq('slug', tribeSlug)
    .single();

  const { data: scan, error } = await supabase
    .from('ai_scans')
    .insert({
      user_id: user.id,
      tribe_id: tribe?.id ?? null,
      image_url: imageUrl,
      diagnosis: diagnosis.diagnosis,
      confidence: diagnosis.confidence,
      severity: diagnosis.severity,
      symptoms: diagnosis.symptoms,
      treatment_plan: diagnosis.treatment_plan,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scan });
}
