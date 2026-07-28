# Cyber Academy AI — Final Engineering Handoff

Tanggal audit: 27 Juli 2026

## Status rilis

Kode sumber sudah melalui audit final frontend, backend, autentikasi, admin, kurikulum, simulasi, progress, quiz, badge, sertifikat, Firebase rules, seed, build produksi, dan pemeriksaan secret. Aplikasi layak dideploy setelah environment runtime dan layanan Firebase milik pemilik project dikonfigurasi.

## Cakupan aktif

- Firebase Authentication: email/password, Google, verifikasi email, reset password.
- Profil pengguna dan avatar Firebase Storage.
- Katalog Firestore: 3 learning path, 19 course, 67 lesson, 19 quiz, dan 130 soal.
- Jalur Beginner 4 kelas, Intermediate 7 kelas, dan Advanced 8 kelas.
- Progress lesson/course/path, XP, level, streak, reset, pagination transaksi, dan unlock prerequisite.
- Quiz server-authoritative, feedback, remedial, skor terbaik, dan XP idempotent.
- Empat simulasi interaktif: email phishing, WhatsApp scam, vishing, dan sandbox malware fiktif.
- Simulasi memiliki intro, tutorial, lima skenario, feedback edukatif server-side, hasil, skor terbaik, retry, dan XP satu kali.
- Empat badge utama: Beginner, Intermediate, Advanced, dan seluruh simulasi.
- Sertifikat ketiga jalur, verifikasi publik, PDF/QR, idempotensi, dan revoke admin.
- AI Tutor Gemini dengan model configurable, safety guard, rate limit, error state, dan history Firestore.
- Admin CRUD content, quiz, users/custom claims, simulations, badges, certificates, dashboard, serta audit log.

## Perbaikan final penting

- Mengganti satu halaman phishing lama menjadi player data-driven untuk empat simulasi.
- Menambahkan endpoint pemeriksaan jawaban simulasi dan penilaian final server-authoritative.
- Menyimpan attempt, skor terbaru, skor terbaik, jumlah percobaan, status, dan XP simulasi di Firestore.
- Mencegah XP simulasi ganda dengan ID transaksi deterministik.
- Mengubah sistem badge dari badge per materi menjadi empat milestone utama.
- Menghitung kelulusan simulasi berdasarkan empat `simulationId` unik, bukan jumlah pengulangan.
- Menyamakan nama penerima dan bahasa visual sertifikat web dengan PDF.
- Mengubah fallback AI Tutor agar error tampil jujur dan tidak menyerupai jawaban yang berhasil tetapi hilang.
- Menambahkan `GEMINI_MODEL` dengan default `gemini-2.5-flash`.
- Menambahkan `/api/health`, batas payload JSON, serta error/retry pada dashboard admin.
- Memperbaiki navigasi katalog lama `/catalog` menjadi `/learn/paths` agar tombol tidak jatuh ke halaman 404.
- Menambahkan fallback JSON HTTP 404 untuk endpoint `/api/*` yang tidak dikenal agar tidak salah menerima HTML SPA berstatus 200.

## Hasil verifikasi

- `npm run lint`: lulus.
- `npm test`: 13 file, 138 test lulus.
- `npm run build`: lulus; frontend dan `dist/server.cjs` terbentuk.
- Validasi seed in-memory: lulus, total 238 dokumen stabil.
- Smoke test produksi:
  - `/api/health`: HTTP 200.
  - `/`: HTTP 200 dan SPA title benar.
  - deep link `/simulations/phishing-email`: dilayani oleh SPA.
  - `/api/me/progress` tanpa token: HTTP 401.
  - endpoint `/api/*` yang tidak dikenal: HTTP 404 JSON.
- Secret scan: tidak ditemukan private key, service-account JSON, atau `.env` lokal.
- Symlink scan: tidak ditemukan symlink project yang dapat menyisipkan file di luar paket.

## Catatan dependency yang belum memiliki fix upstream

`npm audit --omit=dev` masih melaporkan advisory pada dependency upstream terbaru:

- `react-router-dom@7.18.1`: advisory hanya menyasar React Router **RSC Mode action execution**. Aplikasi ini menggunakan SPA BrowserRouter dan tidak memakai RSC mode/server action tersebut.
- `firebase-admin@14.2.0`: advisory berasal dari dependency transitif Google Cloud. Versi `14.2.0` adalah versi terbaru dan npm menyatakan `fixAvailable: false`.

Tidak ada advisory critical. Jangan menjalankan `npm audit fix --force`, karena npm menawarkan downgrade/breaking change yang dapat merusak autentikasi dan routing. Evaluasi ulang ketika upstream merilis versi perbaikan.

## Konfigurasi pemilik project

1. Siapkan `.env` dari `.env.example`.
2. Isi `AI_PROVIDER=vertex`, `GOOGLE_CLOUD_PROJECT`, lokasi, dan `GEMINI_MODEL`.
3. Gunakan Application Default Credentials lokal atau service account runtime Cloud Run; jangan gunakan API key production.
4. Deploy rules dan indexes:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

5. Seed katalog sekali atau setelah menambah project Firestore:

   ```bash
   npm run seed-content -- --confirm
   ```

   Seed hanya membuat dokumen yang belum ada dan aman dijalankan ulang.

6. Tetapkan admin pertama:

   ```bash
   npm run set-admin -- --email alamat-admin@email.com
   ```

   Setelah berhasil, logout lalu login kembali agar custom claim masuk ke token.

7. Tambahkan domain produksi di Firebase Authentication → Settings → Authorized domains.

## Cloud Run

Runtime Cloud Run harus memakai service account yang memiliki minimal akses Firebase Authentication Admin, Cloud Datastore User, serta Secret Manager Secret Accessor untuk secret Gemini. Gunakan `--min-instances=0` untuk menghindari biaya idle dan batasi `--max-instances` sesuai anggaran.
