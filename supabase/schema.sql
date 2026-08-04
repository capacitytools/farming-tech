-- ============================================================
-- Farming Tech & Business — Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  phone text,
  whatsapp text,
  location text,
  bio text,
  role text not null default 'farmer' check (role in ('farmer', 'seller', 'teacher', 'admin')),
  is_verified boolean default false,
  is_approved boolean default false, -- sellers/teachers need admin approval
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. TRIBES (Communities: Rabbits, Goats, Dogs, Pigs, Fish, Poultry, Crops)
-- ============================================================
create table if not exists tribes (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text, -- lucide icon name or emoji
  description text,
  cover_image_url text,
  member_count int default 0,
  created_at timestamptz default now()
);

alter table tribes enable row level security;
create policy "Tribes are viewable by everyone" on tribes for select using (true);
create policy "Only admin can manage tribes" on tribes for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Tribe posts (community feed content)
create table if not exists tribe_posts (
  id uuid primary key default uuid_generate_v4(),
  tribe_id uuid references tribes(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  image_url text,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

alter table tribe_posts enable row level security;
create policy "Tribe posts viewable by everyone" on tribe_posts for select using (true);
create policy "Authenticated users can post" on tribe_posts for insert
  with check (auth.uid() = author_id);
create policy "Authors can update own posts" on tribe_posts for update
  using (auth.uid() = author_id);
create policy "Authors can delete own posts" on tribe_posts for delete
  using (auth.uid() = author_id);

-- Seed the 7 core tribes
insert into tribes (name, slug, icon, description) values
  ('Rabbits', 'rabbits', '🐰', 'Rabbit breeding, health & business tips'),
  ('Goats', 'goats', '🐐', 'Goat rearing, breeds & herbal care'),
  ('Dogs', 'dogs', '🐕', 'Dog breeding, training & veterinary advice'),
  ('Pigs', 'pigs', '🐖', 'Pig farming, feed formulation & disease control'),
  ('Fish', 'fish', '🐟', 'Fish farming, pond management & feeding'),
  ('Poultry', 'poultry', '🐔', 'Chicken, turkey & poultry business'),
  ('Crops', 'crops', '🌾', 'Crop farming, soil health & yield tips')
on conflict (slug) do nothing;

-- ============================================================
-- 3. BLOGS (Daily Insight Engine / SEO CMS)
-- ============================================================
create table if not exists blogs (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null, -- rich HTML from editor
  cover_image_url text,
  category text,
  tags text[],
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  scheduled_for timestamptz,
  published_at timestamptz,
  views_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blogs enable row level security;
create policy "Published blogs viewable by everyone" on blogs
  for select using (status = 'published' or auth.uid() = author_id);
create policy "Admins can manage all blogs" on blogs for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create index if not exists idx_blogs_status_published on blogs (status, published_at desc);
create index if not exists idx_blogs_slug on blogs (slug);

-- Called from the post page to silently increment view count on each read
create or replace function increment_blog_views(post_id uuid)
returns void as $$
  update blogs set views_count = views_count + 1 where id = post_id;
$$ language sql security definer;

-- ============================================================
-- 4. LIVESTOCK LISTINGS (Marketplace)
-- ============================================================
create table if not exists livestock_listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references profiles(id) on delete cascade,
  tribe_id uuid references tribes(id),
  title text not null,
  description text,
  price numeric(12,2) not null,
  currency text default 'NGN',
  quantity int default 1,
  breed text,
  age text,
  location text,
  images text[],
  status text not null default 'pending' check (status in ('pending', 'active', 'sold', 'rejected')),
  is_featured boolean default false,
  commission_rate numeric(5,2) default 10.00, -- platform % cut
  views_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table livestock_listings enable row level security;
create policy "Active listings viewable by everyone" on livestock_listings
  for select using (status = 'active' or auth.uid() = seller_id);
create policy "Approved sellers can create listings" on livestock_listings
  for insert with check (
    auth.uid() = seller_id and
    exists (select 1 from profiles where id = auth.uid() and role = 'seller' and is_approved = true)
  );
create policy "Sellers can update own listings" on livestock_listings
  for update using (auth.uid() = seller_id);
create policy "Admins manage all listings" on livestock_listings for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- 5. TEACHERS (Expert Directory)
-- ============================================================
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade unique,
  specialty text not null, -- e.g. "Poultry Veterinary", "Fish Farming Business"
  headline text,
  years_experience int,
  hourly_rate numeric(10,2),
  currency text default 'NGN',
  courses jsonb default '[]', -- array of {title, price, description, link}
  rating numeric(3,2) default 0,
  reviews_count int default 0,
  commission_rate numeric(5,2) default 15.00,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table teachers enable row level security;
create policy "Active teachers viewable by everyone" on teachers
  for select using (is_active = true);
create policy "Teachers manage own profile" on teachers for all
  using (auth.uid() = profile_id);
create policy "Admins manage all teachers" on teachers for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- 6. AI SCANS (Snap & Diagnose history)
-- ============================================================
create table if not exists ai_scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  tribe_id uuid references tribes(id),
  image_url text not null,
  diagnosis text,
  confidence numeric(5,2),
  severity text check (severity in ('low', 'moderate', 'high', 'critical')),
  symptoms jsonb default '[]',
  treatment_plan jsonb default '[]',
  raw_ai_response jsonb,
  created_at timestamptz default now()
);

alter table ai_scans enable row level security;
create policy "Users view own scans" on ai_scans for select using (auth.uid() = user_id);
create policy "Users create own scans" on ai_scans for insert with check (auth.uid() = user_id);
create policy "Admins view all scans" on ai_scans for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- 7. ADMIN SETTINGS (Adsterra codes, site config — single row table)
-- ============================================================
create table if not exists admin_settings (
  id int primary key default 1,
  adsterra_native_script text,
  adsterra_push_script text,
  adsterra_banner_script text,
  site_announcement text,
  maintenance_mode boolean default false,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

alter table admin_settings enable row level security;
create policy "Settings viewable by everyone" on admin_settings for select using (true);
create policy "Only admins can update settings" on admin_settings for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

insert into admin_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard > Storage, or via SQL)
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('blog-images', 'blog-images', true),
  ('listing-images', 'listing-images', true),
  ('scan-images', 'scan-images', true)
on conflict (id) do nothing;

create policy "Public read access to media buckets"
  on storage.objects for select
  using (bucket_id in ('avatars', 'blog-images', 'listing-images', 'scan-images'));

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'blog-images', 'listing-images', 'scan-images')
    and auth.role() = 'authenticated'
  );

-- ============================================================
-- DONE. Next: create your first admin user, then run:
-- update profiles set role = 'admin', is_approved = true where id = 'YOUR_USER_UUID';
-- ============================================================
