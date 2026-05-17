-- Run this in Supabase SQL Editor.
-- Safe to run multiple times. It upgrades ViperLink for Supabase-backed users,
-- Supabase Auth password reset, vehicles, status, and events.

create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid,
  username text unique not null,
  email text unique,
  name text not null,
  password text,
  password_hash text,
  salt text,
  role text not null default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.app_users add column if not exists auth_user_id uuid;
alter table public.app_users add column if not exists name text;
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists password text;
alter table public.app_users add column if not exists password_hash text;
alter table public.app_users add column if not exists salt text;
alter table public.app_users add column if not exists role text default 'user';
alter table public.app_users add column if not exists created_at timestamp with time zone default now();
alter table public.app_users add column if not exists updated_at timestamp with time zone default now();
alter table public.app_users alter column password drop not null;
alter table public.app_users alter column password_hash drop not null;
alter table public.app_users alter column salt drop not null;
alter table public.app_users add column if not exists phone text;
alter table public.app_users add column if not exists totp_secret text;
alter table public.app_users add column if not exists totp_enabled boolean default false;
alter table public.app_users add column if not exists totp_updated_at timestamptz;

-- ============================================================
-- OTP / VERIFICATION SETUP NOTES
-- ============================================================
-- Email OTP: Works out of the box via Supabase Auth.
--   Make sure "Email OTP" is enabled in:
--   Supabase Dashboard → Authentication → Providers → Email
--   Set OTP expiry to 600 seconds (10 minutes) recommended.
--
-- Phone (SMS) OTP: Requires Twilio.
--   Supabase Dashboard → Authentication → Providers → Phone
--   Enable Phone provider and enter your Twilio credentials:
--     Account SID, Auth Token, Message Service SID
--
-- Redirect URLs: Add these in
--   Supabase Dashboard → Authentication → URL Configuration:
--     http://localhost:3000
--     http://localhost:3000/**
--     https://your-vercel-app.vercel.app/**
-- ============================================================

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  result text not null,
  user_agent text,
  ip text,
  created_at timestamptz default now()
);

create index if not exists login_events_user_id_idx on public.login_events(user_id);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  user_agent text,
  ip text,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

create index if not exists app_sessions_user_id_idx on public.app_sessions(user_id);

create table if not exists vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  vehicle_name text not null,
  make text,
  model text,
  year text,
  created_at timestamp with time zone default now()
);

create table if not exists vehicle_status (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  armed boolean default false,
  door_open boolean default false,
  ignition_on boolean default false,
  alarm_triggered boolean default false,
  last_event text default 'System Ready',
  updated_at timestamp with time zone default now()
);

create table if not exists vehicle_events (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade,
  event_type text not null,
  message text not null,
  created_at timestamp with time zone default now()
);
