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