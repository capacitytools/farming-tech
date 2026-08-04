# 🌾 Farming Tech & Business

A production-ready PWA for African farmers — AI Agri-Doctor, livestock marketplace,
community Tribes, daily SEO blog engine, and an expert directory. Built to feel like
a native mobile app while running as a free-tier web platform.

## What's in this package

```
scripts/01-generate-project.sh   → Bash scaffold script (Step 1)
supabase/schema.sql              → Full Postgres schema + RLS + storage buckets (Step 2)
next.config.js                   → PWA config (next-pwa)
tailwind.config.ts               → Agri-SaaS Glassmorphism design tokens
app/globals.css                  → Glass card / button utility classes
app/layout.tsx                   → Root shell: PWA metadata, TopBar, BottomNav, Adsterra zones
app/page.tsx                     → Home dashboard (Step 3)
components/layout/                → TopBar (dropdown menu), BottomNav (sticky tabs), Footer, AdsterraInjector
components/home/                  → Daily Insight, Market Prices, Quick Scan, Tribes Rail widgets
app/admin/                        → Admin dashboard shell + overview + settings (Step 4)
components/admin/BlogEditor.tsx   → Rich text editor + Supabase image upload
app/scanner/                      → AI Agri-Doctor page (Step 5)
components/scanner/               → Camera capture UI + animated Health Report card
app/api/scan/route.ts             → API stub for wiring a real vision AI model
lib/                              → Supabase clients, utils, image upload/compression helper
.env.local.example                → All required environment variables
```

## Quick Start

1. **Generate the project shell** (creates a fresh Next.js app):
   ```bash
   bash scripts/01-generate-project.sh
   ```
2. **Copy in the provided files** — `app/`, `components/`, `lib/`, `supabase/`,
   `next.config.js`, `tailwind.config.ts`, `app/globals.css` — into the generated
   `farming-tech-business/` folder, overwriting the defaults.
3. **Set up Supabase:**
   - Create a free project at supabase.com
   - Go to SQL Editor → paste and run `supabase/schema.sql`
   - Go to Authentication → Providers → enable Email (and Google if desired)
   - Copy your Project URL and anon key into `.env.local` (see `.env.local.example`)
4. **Add PWA icons:** drop `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`,
   `icon-maskable-512.png` into `public/icons/` (use a tool like realfavicongenerator.net
   or maskable.app to generate these from your logo).
5. **Run locally:**
   ```bash
   npm run dev
   ```
6. **Make yourself admin** — after signing up once in the app, run in Supabase SQL Editor:
   ```sql
   update profiles set role = 'admin', is_approved = true where id = 'YOUR_USER_UUID';
   ```
   (Find your UUID in Authentication → Users.)
7. **Add Adsterra codes** — log in as admin, go to `/admin/settings`, paste your
   Native, Banner, and Push scripts. They go live instantly, no redeploy needed.

## Deployment

See the full deployment checklist provided separately (Step 6) for pushing to
GitHub, connecting Vercel, and going live at $0 cost.

## Notes on the AI Agri-Doctor

`components/scanner/ScannerCapture.tsx` currently simulates a diagnosis so the
full UI/UX flow (camera → scanning animation → health report) works end-to-end
out of the box. `app/api/scan/route.ts` is the wiring point — swap the TODO
section for a real call to a vision-capable model (e.g. the Anthropic API with
an image input) and it will persist results to the `ai_scans` table automatically.

## Contact

- WhatsApp: +234 915 988 4244
- Email: myrabbit101@gmail.com
