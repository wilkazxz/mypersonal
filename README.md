# WILKAXYZ Flat

Versi sederhana WILKAXYZ. Semua source utama ada langsung di root tanpa folder `client`, `server`, atau `src`. CSS juga sudah disatukan sebagai string style di `styles.ts` dan dimuat dari `App.tsx`.

## Jalankan

```bash
pnpm install
pnpm dev
```

## Deploy Vercel

Import repository GitHub ini ke Vercel. Konfigurasi `vercel.json` sudah tersedia. Jika ingin realtime lintas perangkat, isi variabel `VITE_FIREBASE_*` di Vercel. Tanpa Firebase, aplikasi memakai localStorage dan BroadcastChannel.

Catatan: versi flat memakai login admin lokal sederhana agar tetap bisa dijalankan sebagai Vite static app tanpa backend folder lama.
