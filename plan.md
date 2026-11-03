# Rencana Implementasi WILKAXYZ

## Scope
WILKAXYZ adalah personal digital collection platform dengan homepage bergaya Pinterest yang ringan, clean, dan premium; navigasi koleksi; pencarian/filter; upload center; serta Admin Dashboard di `/admin` untuk ringkasan, monitoring, aktivitas, dan pengelolaan konten.

## Arah desain

### Opsi style
- **Neo-lime editorial** (0.06): white space luas, hitam grafit, dan aksen lime elektrik dalam komposisi seperti aplikasi mobile premium.
- **Orbit monochrome** (0.05): panel putih bersih, garis tipis, dan aksen metalik kebiruan untuk kesan ruang angkasa yang tenang.
- **Soft glass archive** (0.04): kartu kaca lembut dengan blur, abu-abu hangat, dan warna aksen yang lebih kalem.

### Style terpilih: Neo-lime editorial
- **Design Movement:** editorial product design bertemu futuristic aerospace UI; kuat di tipografi, ruang kosong, dan aksen warna yang terukur.
- **Core Principles:** hierarchy-first, tactile cards, one bold accent, dan low-friction browsing.
- **Color Philosophy:** putih memberi ruang dan rasa arsip pribadi; charcoal menjaga fokus; lime elektrik menjadi signature signal untuk aksi, status aktif, dan navigasi utama.
- **Layout Paradigm:** rail navigasi kiri di desktop dan dock bawah di mobile; konten utama memakai masonry stream dengan panel spotlight, bukan dashboard grid generik.
- **Signature Elements:** wordmark metallic dengan orbit mark; chip lime berbentuk pill; kartu media rounded dengan metadata kecil dan garis aksen halus.
- **Interaction Philosophy:** setiap aksi memberi respons singkat dan jelas—favorite berubah menjadi lime, search menyaring langsung, upload muncul sebagai drawer/modal yang ringan.
- **Animation:** hover lift 180ms, fade-up untuk kartu saat masuk, progress bar storage bergerak lembut, tanpa parallax berat.
- **Typography System:** Inter untuk body dan metadata; Space Grotesk untuk wordmark/headline; headline rapat, label kecil uppercase dengan tracking lebar.
- **Brand Essence:** ruang digital pribadi untuk menyimpan dan menghidupkan kembali karya; terkurasi, cepat, personal.
- **Personality:** precise, optimistic, collected.
- **Brand Voice:** headline singkat dan percaya diri. Contoh: “Your archive, in orbit.” dan “Keep the good stuff close.”
- **Wordmark & Logo:** WILKAXYZ uppercase dengan gradien metalik gelap, ditemani orbit ring kecil yang mengitari titik lime.
- **Signature Brand Color:** electric lime `#D7FF00`.

## Implementasi
- React + Wouter untuk route `/`, koleksi, upload, settings, dan `/admin`.
- Data demo lokal di frontend untuk membuat preview langsung hidup: search, filter category, favorite, upload dialog, dan aksi admin.
- Starter Manus OAuth tetap dipertahankan; `/admin` memakai `useAuth` dan menampilkan login gate saat belum terautentikasi.
- Database starter tetap aktif untuk perluasan persistence berikutnya; model domain dan upload API dapat ditambahkan setelah struktur UI disetujui.
- CSS custom di `client/src/index.css` untuk layout rail/dock, masonry stream, responsive breakpoints, dan visual neo-lime editorial.
- `public/manus-routes.json` mendeklarasikan seluruh halaman utama dan admin.

## Struktur proyek
- `client/src/pages/Home.tsx`: homepage, koleksi, pencarian, upload center, settings, dan navigasi.
- `client/src/pages/Admin.tsx`: dashboard admin dengan metrik, monitoring, tabel konten, dan activity log.
- `client/src/App.tsx`: route map dan provider.
- `client/src/index.css`: design system dan responsive layout.
- `public/manus-routes.json`: manifest route untuk crawler/platform.
- `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`: fondasi persistence dan API yang siap dikembangkan.
