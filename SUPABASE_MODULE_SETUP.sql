-- ViperLink physical module readiness fields.
-- Run in Supabase SQL Editor. Safe to run multiple times.

alter table public.vehicles
add column if not exists module_id text unique;

alter table public.vehicles
add column if not exists module_secret text;

alter table public.vehicles
add column if not exists module_status text default 'not_connected';

alter table public.vehicles
add column if not exists last_seen timestamp with time zone;

alter table public.vehicles
add column if not exists firmware_version text;

alter table public.vehicles
add column if not exists gps_enabled boolean default false;

alter table public.vehicles
add column if not exists last_lat double precision;

alter table public.vehicles
add column if not exists last_lng double precision;
