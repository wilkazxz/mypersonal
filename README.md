# WILKAXYZ

Vite + React + Supabase (Google login, Postgres realtime, Storage).

## Setup
1. Supabase: jalankan `schema.sql` di SQL Editor (ganti email admin dulu).
2. Auth > Providers > Google: aktifkan dengan Client ID & Secret dari Google Cloud.
3. Auth > URL Configuration: Site URL = domain Vercel; Redirect URLs tambahkan
   `https://DOMAIN-ANDA/**` dan `http://localhost:5173/**`.
4. Salin `.env.example` ke `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
   (juga di Vercel > Environment Variables, lalu Redeploy).
5. `pnpm install && pnpm dev`

Tanpa env Supabase, aplikasi jalan mode lokal (localStorage) tanpa login.
