#!/bin/bash
# ============================================================
# Farming Tech & Business — Project Generator
# Run this once in an empty folder: bash 01-generate-project.sh
# ============================================================
set -e

echo "🌾 Creating Farming Tech & Business..."

npx create-next-app@latest farming-tech-business \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*" \
  --use-npm

cd farming-tech-business

echo "📦 Installing core dependencies..."
npm install \
  @supabase/supabase-js \
  @supabase/auth-helpers-nextjs \
  framer-motion \
  lucide-react \
  next-pwa \
  clsx \
  tailwind-merge \
  class-variance-authority \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-avatar \
  @radix-ui/react-label \
  @radix-ui/react-select \
  @radix-ui/react-slot \
  @radix-ui/react-toast \
  react-quill \
  browser-image-compression \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers

echo "🎨 Installing dev dependencies..."
npm install -D @types/node

echo "📁 Creating folder structure..."
mkdir -p app/{admin/{blogs,media,users,settings},api/{scan,blogs,upload},scanner,market,communities/{[slug]},profile,blog/{[slug]},auth}
mkdir -p components/{ui,layout,admin,scanner,home,communities,market}
mkdir -p lib supabase public/icons

echo "🖼  Creating placeholder PWA icons folder (add real icons: 192x192, 512x512)..."
touch public/icons/.gitkeep

echo "✅ Base project generated."
echo "👉 Next: copy in next.config.js, tailwind.config.ts, globals.css, and .env.local (see STEP 2-6)"
echo "👉 Then run: npm run dev"
