# WILKAXYZ

Vite + React + Firebase. SEMUA file ada di satu level (tanpa folder) supaya mudah di-upload ke GitHub lewat web.

## Upload ke GitHub
Buka repo > Add file > Upload files > pilih SEMUA file di sini (kecuali README ini kalau mau) > Commit.

## Deploy ke Vercel
Add New > Project > pilih repo. Framework Vite terdeteksi otomatis, Root Directory kosongkan. Deploy.

## Firebase
1. Authentication > Google: aktifkan.
2. Authorized domains: tambahkan domain xxx.vercel.app.
3. Firestore > Rules: tempel isi `firestore-rules.txt`, Publish.
