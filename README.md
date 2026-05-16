# ViperLink

ViperLink is a full-stack IoT-style vehicle security dashboard inspired by connected-car systems like Viper SmartStart.

## Features

- Login/register/logout
<img width="312" height="312" alt="{5E80C3F5-45C3-48B5-8125-4DD5730E3B12}" src="https://github.com/user-attachments/assets/f1d203fd-de9a-4506-a556-2ab906d5c851" />

  
- Supabase-backed user accounts
- Default admin account seeding
- Multi-vehicle support
  <img width="2557" height="312" alt="{B2F82507-D281-44F5-AED6-302FDE6AC22A}" src="https://github.com/user-attachments/assets/25a834ce-891f-4e6a-a409-3fd3ac7e2dd8" />

- Per-user vehicle separation
- Supabase/PostgreSQL vehicle storage
- Vehicle status cards
  <img width="2537" height="300" alt="{B9C2596E-FED3-4C07-BFFC-E44B77F46C6C}" src="https://github.com/user-attachments/assets/3b631220-596b-471a-97ac-9a670ea3fb1e" />

- Vehicle event history
  <img width="2537" height="657" alt="{DBE8941F-0447-4AD8-B4BC-E51F79168883}" src="https://github.com/user-attachments/assets/b1fa856e-d547-4245-a159-7c849daee2ca" />

- Command history using Supabase
- Server-Sent Events realtime refresh stream
- Role-based admin panel

## Default admin

The app creates this admin automatically after the Supabase `app_users` table exists:

```txt
Username: admin
Password: viper123
```

Change this later before treating the app like a real production system.

## Setup

1. Run the SQL in `SUPABASE_SETUP.sql` inside Supabase SQL Editor.
2. Copy `.env.example` to `.env.local`.
3. Fill in your Supabase keys and `AUTH_SECRET`.
4. Run:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000/login
```

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key
AUTH_SECRET=replace-with-a-long-random-secret
```

Do not commit `.env.local`.

## Vercel

Add the same environment variables in Vercel Project Settings, then redeploy.

## Notes

This is still a software dashboard/demo. Do not wire it to real vehicle/security hardware without proper authentication, authorization, logging, rate limiting, safety checks, and professional review.
