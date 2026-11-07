import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { ownerId, subject, message, replyTo, emails } = await req.json();

    if (!ownerId || !subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 🚨 1. VERIFY USER IS ADMIN OR VERIFIED 🚨
    const { data: profile } = await supabase.from('profiles').select('role, verified').eq('id', ownerId).single();
    
    if (profile?.role !== 'admin' && profile?.verified !== true) {
      return NextResponse.json({ error: 'Only verified users can send newsletters.' }, { status: 403 });
    }

    // 2. CHECK WEEKLY LIMIT (100 emails)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('newsletter_send_logs')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .gte('sent_at', oneWeekAgo);

    const totalRecipients = (emails || []).length;
    if ((count || 0) + totalRecipients > 100) {
      return NextResponse.json({ 
        error: `Weekly limit reached. You have sent ${count} emails this week. You can only send ${100 - (count || 0)} more.` 
      }, { status: 429 });
    }

    // 3. Build HTML
    const adCode = `
      <div style="text-align:center; margin: 20px 0; padding: 15px; border: 1px dashed #ccc; background: #f9f9f9;">
        <p style="font-size:10px; color:#888; margin:0 0 5px 0;">Advertisement</p>
        <a href="https://www.farmingtechbusiness.com/ebooks" target="_blank">
          <img src="https://resend.com/static/placeholder.png" alt="Farming Tech Ad" style="max-width:100%; border-radius:8px;" />
        </a>
        <p style="font-size:11px; margin-top:5px;">
          <a href="https://www.farmingtechbusiness.com/ebooks" style="color:#166534; font-weight:bold; text-decoration:none;">📚 Get the Best Farming E-books Here</a>
        </p>
      </div>`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333;">
        <div style="background: #166534; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 20px;">Farming Tech Newsletter</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #166534; font-size: 18px;">${subject}</h2>
          <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          ${adCode}
          <p style="font-size: 12px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            Sent via <a href="https://www.farmingtechbusiness.com" style="color: #166534; font-weight: bold; text-decoration:none;">Farming Tech & Business</a>.
          </p>
        </div>
      </div>`;

    // 4. Send
    const sendPromises = (emails || []).map((email: string) => 
      resend.emails.send({
        from: 'Farming Tech & Business <hello@newsletter.farmingtechbusiness.com>', 
        to: email,
        reply_to: replyTo || undefined, // 🚨 FIXED: replyTo changed to reply_to
        subject: subject,
        html: htmlBody,
      })
    );

    await Promise.all(sendPromises);

    // 5. Log
    if (emails && emails.length > 0) {
      await supabase.from('newsletter_send_logs').insert({
        owner_id: ownerId,
        recipients_count: emails.length,
      });
    }

    return NextResponse.json({ success: true, count: emails.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}