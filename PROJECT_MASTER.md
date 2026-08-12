# FARMING TECH & BUSINESS — MASTER PROJECT FILE
Last updated: today. Paste this at the start of ANY AI chat to restore full context.

## LINKS & ACCOUNTS
- Live site: https://farming-tech.vercel.app (future domain: farmtechbusiness.com — NOT bought yet)
- Code: github.com/capacitytools/farming-tech (branch: main) → auto-deploys on Vercel
- Hosting: Vercel project "farming-tech" | DB/Auth/Storage: Supabase | AI: Google Gemini | Ads: Adsterra | Payments: Paystack (TEST MODE — not live yet)
- Env keys live in Vercel: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY (or NEXT_PUBLIC_GEMINI_API_KEY), PAYSTACK test keys

## STACK
Next.js 14.2.5 App Router + TypeScript + Tailwind (forest theme) + Supabase + PWA (installable) + framer-motion + Tiptap + mammoth + react-quill + browser-image-compression + next-pwa

## MY ROLE: admin (profiles.role = 'admin'). Admin hub: /admin

## FEATURES BUILT (all working)
- AUTH: login/signup, profiles, avatar upload
- BLOG CMS: Tiptap rich editor (bold/colors/links/images), categories dropdown, SEO fields, auto-save drafts (localStorage), .docx Google-Docs import (mammoth), AI PROFESSIONAL WRITER (/admin/blogs/ai-writer, saves to ai_drafts, Google Docs rich-copy, branded Pinterest pin generator), related posts, comments, view counts, category filter chips, ShareBar (WhatsApp/FB/Pinterest/Telegram/X/copy)
- AI AGRI-DOCTOR (/scanner + /api/ai/diagnose): model fallback chain (gemini-2.5-flash-lite → 2.0-flash → 3-flash-preview → 2.5-flash), image auto-compression, farmer note box, color-coded report cards (Diagnosis/Confidence/Severity/Cause/Treatment/Prevention), scan history
- MARKETPLACE: listings w/ approval, multi-currency, custom categories, reviews+ratings, inbox messaging (direct_messages), Mark-as-Sold, WhatsApp + Message Seller
- TRIBES: join/leave, posts + replies + photo uploads, Tribe Masters (👑 ban/kick/delete), admin posts anywhere, tribe images, welcome posts seeded
- E-BOOKS: admin PDF/cover upload, edit/delete/copy link, Paystack test checkout, purchases in profile
- GAMIFICATION: points (join 10/post 15/reply 5/listing 20/ebook 30/scan 10/review 5) → ranks Beginner⭐ Master🌟 Premium💫 Professional🏅 Golden👑; public /leaderboard + admin analytics (rank distribution + top-10 + revenue by currency)
- NOTIFICATIONS: admin broadcasts (/admin/notifications) + bell badge; TopBar has bell/mail(badge)/search/menu
- ADMIN: dashboard cards, analytics, notepad, ads manager, comments moderation (/admin/comments), settings
- SEO: sitemap.ts, robots.ts, JSON-LD Article schema, meta/OG per blog, reading time, author box
- HOME: hero + stats + quick actions + QuickScanWidget + latest blogs + trending tribes + market + top farmers + ebooks + install CTA
- PWA installable; Adsterra popunder/social bar + in-blog ad slots (AdBanner)

## KEY FILES
components/: RichTextEditor, DocxImporter, AdBanner, ShareBar, RelatedPosts, BlogComments, ListingReviews, SoldButton, AdsterraInjector, TopBar, BottomNav
app/: admin/* (dashboard, analytics, blogs+new+edit+ai-writer, comments, ebooks, tribes, ads, notes, notifications, settings, listings), api/ai/diagnose+write-blog, scanner, inbox, leaderboard, search, notifications, blog/[slug], market/[id], sitemap.ts, robots.ts, not-found.tsx

## DB ADDITIONS
tables: listing_reviews, notifications, direct_messages, ai_drafts, blog_comments
columns: tribes.image_url | tribe_posts.image_url, parent_id | tribe_members.role, is_banned
functions: user_points, user_rank, admin_leaderboard, rank_distribution, public_leaderboard, join_tribe, leave_tribe

## ADSTERRA CODES (keys)
320x50 f6b4eadf…44dd | 300x250 3b3b5739…0678 | 468x60 b416467a…105e | 728x90 a74fb60b…79ff | native cbcab21814…

## PENDING / NEXT STEPS
1. Buy farmtechbusiness.com → connect in Vercel → update hardcoded vercel.app URLs
2. Paystack: complete compliance → live keys → redeploy → first real test
3. OneSignal push notifications (needs free account + App ID)
4. Referral system (needs app/login/page.tsx edit)
5. Submit sitemap to Google Search Console after domain is live

Here's your **fully updated PROJECT MASTER document** — replace your old one with this. It captures EVERYTHING built so far:

---

# 📘 PROJECT MASTER — FARMING TECH & BUSINESS
**Last updated: after Video/Ads/Training/Time-Points build**

## 1. STACK & LINKS
- **Frontend:** Next.js 14.2.5 (App Router) + Tailwind + Framer Motion · deployed on **Vercel** (GitHub: capacitytools/farming-tech, branch main)
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **AI:** Gemini API (doctor + blog writer) · **Payments:** Paystack (TEST mode) · **Push:** OneSignal · **Ads:** Adsterra · **Calls:** Jitsi (free)
- **Current URL:** farming-tech.vercel.app · **Planned domain:** farmtechbusiness.com
- **Admin WhatsApp:** +2349159884244

## 2. ENV VARS (Vercel)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` · *(future: SITE_URL, YouTube OAuth trio)*

## 3. DATABASE — TABLES
- **profiles**: full_name, avatar_url, location, whatsapp, role(admin), referral_code, referred_by, verified, verified_until, verification_requested, monetized, wallet_balance, can_host_training, trainer_requested, time_minutes
- **tribes**(+verified_only), **tribe_members**(role master/member, is_banned), **tribe_posts**(parent_id, image_url), **tribe_trainings**(room, duration_min, record, status, audio_url, started_by)
- **livestock_listings**(status active/pending/sold, is_featured, featured_requested, featured_until), **listing_reviews**
- **feed_posts**(image_url, views_count, ad_id), **feed_likes**, **feed_comments**(post_id OR video_id), **videos**(youtube_id, start_sec, end_sec, title, description, tags, category, context feed/tribe, tribe_id, ad_id, author_id)
- **ad_campaigns**(code AD-XXXXXX, business_name, ad_text, image_url, ad_video, link, status pending/approved/rejected)
- **ebooks**(author_id, status approved/pending, is_active), **ebook_purchases**(affiliate_code), **experts**(consultation_fee), **consultations**, **payout_requests**, **blogs**, **blog_comments**, **ai_scans**, **notifications**, **direct_messages**, **admin_notes**

## 4. SQL FUNCTIONS
`user_points` · `user_rank` · `public_leaderboard` · `top_recruiters` · `hot_posts` (For-You algorithm) · `bump_feed_views` · `admin_wallet_view` · `credit_wallet` · `add_minute`

## 5. POINTS ECONOMY (final)
Join tribe 10 · tribe post 15 · tribe reply 5 · listing 20 · e-book buy 30 · AI scan 10 · review 5 · referral 25 (both sides) · feed post 10 · comment given 3 · like given 1 · like received 2 · comment received 3 (posts & videos) · post view 1 (cap 1000) · affiliate sale 20 · **time: +1 per 5 active min (cap 200)** · **Verified = ×1.1 on everything**
**Ranks:** Beginner⭐ → Master🌟 → Premium💫 → Professional(300) → Golden👑(600)

## 6. MONETIZATION (7 revenue streams)
1. **Verification** ₦1,000/mo (WhatsApp receipt → /admin/wallet approve; unlocks ✅ badge, monetization, +10%)
2. **Creator Pool** — monthly 50% of Adsterra distributed pro-rata by points (/admin/wallet → Distribute)
3. **Payouts** — users request (min ₦1,000) → you mark paid
4. **Featured listings** ₦300/7days (/admin/featured)
5. **Expert bookings** — you take 10% (/admin/consultations)
6. **E-books** — member uploads get 70% royalty; **affiliates 10% + 20pts**; platform keeps rest
7. **Ad codes** — businesses submit ads (/ads/submit) → approve & slot into videos/posts (/admin/ads-manager) + Adsterra everywhere

## 7. PAGE MAP
**User:** / /feed /post/[id] /leaderboard /recruiters /achievements /wallet /inbox /profile /farmer/[id] /communities /communities/[slug] /blog /blog/[slug] /blog/tag/[tag] /scanner /market /market/[id] /market/new /experts /ebooks /ebooks/submit /ads/submit /search /notifications /about /contact /privacy /terms /login
**Admin:** /admin · wallet · ads-manager · videos · trainers · consultations · featured · ebook-requests · feed · analytics · blogs(+new/edit/ai-writer) · comments · listings · notifications · ebooks · tribes · ads(Adsterra) · notes · settings · experts

## 8. KEY COMPONENTS
TopBar(dark mode+TimeTracker) · BottomNav · VideoCard(branded player+clip+AdBar+comments+6-share) · VideoComposer · AdBar(marquee) · AdBanner · TrainingRoom(Jitsi+MP3) · TimeTracker(toasts) · ProfileShare · BookExpert · FeatureButton · SoldButton · ShareBar · BlogComments · RelatedPosts · ReadingProgress · QuickScanWidget · ListingReviews

## 9. SOCIAL SYSTEM
- **For You** = hot_posts (likes×2+comments×3+views×0.5+verified5 ÷ age^1.5), top 10, re-ranks ~10min
- **Sharing** = WA / WA-Status / FB / X / Pinterest / Copy — all via /post/[id] with OG preview (post text + image/video thumb + "Join, Learn, Grow, Connect & Earn") + ref code
- **Names clickable** → personal timelines (Facebook-style)

## 10. TRIBES & TRAINING
- Leaders/admin/approved trainers host **live calls** (5–30min, record toggle) → auto **MP3 compressed** → tribe **Training Library** (play+download)
- Approval: /admin/trainers · Verified-only tribe exists (🔒)

## 11. ADS PLACEMENTS (Adsterra)
Feed every 3rd post · under post comments · under video comments · blog top+bottom · scanner top+bottom · **Internal ad bars**: under video player + under posts (white scrolling / black "advertise here")

## 12. STORAGE BUCKETS
blog-images · scan-images · ebooks · trainings (all public read)

## 13. DAILY ADMIN ROUTINE
Verify payments (/admin/wallet) → approve ads & slot codes (/admin/ads-manager) → approve trainers/ebooks/featured/consultations → moderate feed/comments → publish blog via AI Writer + Share Kit → monthly: Distribute pool + pay payouts

## 14. LAUNCH CHECKLIST (business phase)
☐ Buy domain → Vercel → set SITE_URL · ☐ Paystack live verification · ☐ Google Search Console (HTML tag in layout + submit sitemap) · ☐ Seed content (10 blogs, 5 experts, listings, friends posting)

## 15. ROADMAP (future)
YouTube auto-upload to your channel (STEP 2) · LiveKit full-mix call recording · verified tribe perks expansion · dark-mode deep polish · push deep-links

---

Save this as your single source of truth. Say **"next"** anytime to keep building, or **"launch"** when ready for the domain/Paystack/GSC walkthrough! 🚀