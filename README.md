# WILKAXYZ

Vite + React + Firebase (Google login, Firestore realtime).

## Setup
1. Firebase Console: buat project, tambah Web app, salin config ke `.env` .
2. Authentication > Sign-in method > Google: aktifkan.
3. Authentication > Settings > Authorized domains: tambahkan domain Vercel.
4. Firestore Database: Create database, lalu tab Rules: tempel isi `firestore-rules.txt`, Publish.
5. `pnpm install && pnpm dev`

Tanpa env Firebase, aplikasi jalan mode lokal (localStorage) tanpa login.
