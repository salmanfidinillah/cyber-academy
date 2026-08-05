# Panduan Konfigurasi Firebase & Vertex AI - Cyber Academy AI

## Status aplikasi

Cyber Academy AI adalah MVP full-stack yang dapat digunakan dengan Firebase Authentication, Cloud Firestore, Firebase Storage, Express, dan Gemini. Data keamanan-kritis (progress, XP, kuis, simulasi, badge, sertifikat, role admin, audit log, dan riwayat AI Tutor) diproses melalui backend terautentikasi; browser tidak menentukan nilai atau hadiah XP.

Katalog belajar mencakup **4 kelas Beginner, 10 kelas Intermediate, dan 11 kelas Advanced (25 kelas total)**. Statistik lengkap yang berasal dari ekspor read-only Firestore produksi adalah **3 learning path, 25 course, 79 lesson, 25 quiz, dan 160 question**. Jumlah kelas serta estimasi durasi pada card dihitung dari course published yang benar-benar tersedia. Empat simulasi aktif—email phishing, WhatsApp scam, vishing, dan sandbox malware fiktif—memiliki tutorial, skenario interaktif, feedback server-side, skor terbaik, dan XP idempotent. Rincian sinkronisasi katalog dan prosedur aman tersedia di [`docs/catalog-sync.md`](docs/catalog-sync.md).

### Menjalankan secara lokal

```bash
cp .env.example .env
npm ci
npm run dev
```

Seed tidak diperlukan untuk sekadar menjalankan frontend/backend. Jika membutuhkan katalog lokal, gunakan Firestore Emulator; seed secara default menolak project produksi. Pada Cloud Run, gunakan service account runtime yang dipasang pada service. Jangan menyimpan JSON service account, token, atau private key di repository maupun environment Cloud Run.

### Pemeriksaan sebelum rilis

```bash
npm run lint
npm test
npm run build
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Checklist Firebase Console:

- Email/Password dan Google Sign-In aktif.
- Domain production/preview tercantum di Authentication → Authorized domains.
- Firestore dan Storage aktif pada project yang sama.
- Service account runtime mempunyai izin Firebase Authentication Admin dan Cloud Datastore User.
- AI production menggunakan Vertex AI melalui Application Default Credentials dan service account Cloud Run.
- `AI_PROVIDER=vertex`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, dan `GEMINI_MODEL` dikonfigurasi hanya di backend.
- Admin pertama ditetapkan dengan `npm run set-admin -- --email alamat@email.com`, lalu logout/login kembali.

### Endpoint inti

- Katalog: `/api/catalog/*`
- Progress dan XP: `/api/me/*`
- Kuis: `/api/quizzes/*`, `/api/me/quiz-*`
- Simulasi: `/api/simulations/*`, `/api/me/simulation-attempts`
- Health check Cloud Run: `/api/health`
- Badge dan sertifikat: `/api/me/badges*`, `/api/me/certificates*`
- AI Tutor/history: `/api/ai/tutor`, `/api/me/ai/*`
- Admin CRUD: `/api/admin/*`

Panduan migrasi, local ADC, least-privilege IAM, Cloud Run, troubleshooting,
pengujian manual, dan rollback tersedia di [`docs/vertex-ai.md`](docs/vertex-ai.md).

Sertifikat dapat diverifikasi publik lewat `/verify/certificate/:certificateCode`; data publik dibatasi pada nama penerima, judul learning path, tanggal terbit, kode, dan status.

Aplikasi **Cyber Academy AI** kini telah berhasil dimigrasikan dari simulator lokal/offline ke integrasi **Google Firebase asli** (Firebase Authentication, Firestore Database, dan Firebase Storage) dengan arsitektur yang aman dan berkinerja tinggi.

---

## 🛠️ Mengatasi Error `auth/unauthorized-domain` (PENTING)

Error `Firebase: Error (auth/unauthorized-domain)` terjadi karena Firebase Authentication membatasi domain mana saja yang diperbolehkan untuk memproses masuk (Sign-In) dan autentikasi demi keamanan aplikasi Anda. Domain dinamis dari Google AI Studio harus didaftarkan secara manual ke dalam Firebase Console.

### Langkah-langkah Menyelesaikan Error Ini:

1. Buka **[Firebase Console](https://console.firebase.google.com/)** dan pilih proyek Firebase yang Anda gunakan.
2. Di menu navigasi sebelah kiri, klik **Build** -> **Authentication**.
3. Di bagian atas halaman Authentication, klik tab **Settings** (Pengaturan).
4. Pilih menu **Authorized domains** (Domain resmi) di panel samping kiri tab tersebut.
5. Klik tombol **Add domain** (Tambahkan domain).
6. Masukkan hostname yang tampil pada URL preview/deployment aplikasi saat ini (tanpa `https://` dan tanpa path). Tambahkan `localhost` untuk development lokal.
7. Klik **Save** (Simpan) untuk setiap domain.
8. Kembali ke aplikasi Anda dan segarkan halaman (refresh). Proses masuk dengan Google atau verifikasi email sekarang akan berfungsi dengan lancar tanpa error domain!

---

## 🗒️ Laporan Migrasi & Perkembangan Kode (Step 2A)

Berikut adalah ringkasan teknis dari seluruh perubahan yang telah berhasil diterapkan pada kode sumber aplikasi Cyber Academy AI:

### 1. Library/Dependency Baru yang Ditambahkan
* **`firebase`** (v12.16.0): SDK Firebase resmi untuk mengelola koneksi autentikasi, database realtime (Firestore), dan media (Storage).
* **`@firebase/eslint-plugin-security-rules`**: Plugin Linter untuk memastikan aturan keamanan Firestore dan Storage divalidasi dengan aman sebelum proses rilis.

### 2. File Baru yang Dibuat
* 📁 `src/lib/firebaseClient.ts`: Menginisialisasi Firebase App, Auth, Firestore, dan Storage secara malas (lazy initialization) agar tidak merusak aplikasi jika kunci API belum terisi.
* 📁 `src/services/authService.ts`: Mengelola alur pendaftaran, login email, Google Sign-In (dengan mekanisme fallback otomatis), kirim ulang email verifikasi, atur ulang kata sandi (reset password), dan sinkronisasi status keamanan pengguna. Menyertakan pemetaan kode error Firebase ke bahasa Indonesia yang ramah pengguna.
* 📁 `src/services/userService.ts`: Mengelola sinkronisasi realtime profil pengguna dengan database Firestore, penanganan onboarding, pembaruan data aman (safe-fields whitelisting), serta pengunggahan foto avatar menggunakan Firebase Storage asli.
* 📁 `src/components/VerifyEmailPage.tsx`: Tampilan antarmuka yang sangat menarik dan dinamis untuk memandu pengguna memverifikasi alamat email mereka dengan kontrol tombol interaktif dan penanganan batas waktu (cooldown).
* 📁 `src/components/navigation/EmailVerificationRoute.tsx`: Pelindung rute (route guard) kustom untuk memastikan semua fitur utama hanya dapat diakses oleh pengguna yang emailnya telah terverifikasi atau menggunakan masuk Google (Google Auth bypass).
* 📁 `firebase-blueprint.json`: Blueprint skema data Firestore untuk memetakan objek profil pengguna secara aman.
* 📁 `firestore.rules`: Aturan keamanan Firestore tingkat produksi yang membatasi hak akses baca-tulis hanya kepada pemilik data resmi (`request.auth.uid == uid`).
* 📁 `storage.rules`: Aturan keamanan Storage tingkat produksi yang membatasi kapasitas pengunggahan foto profil (maksimal 2 MB) dan format file gambar tepercaya (JPEG, PNG, WEBP).

### 3. File yang Dimodifikasi & Dioptimalkan
* ✏️ `src/App.tsx`: Mengintegrasikan pelindung rute verifikasi email (`EmailVerificationRoute`) dan memetakan halaman verifikasi email baru.
* ✏️ `src/contexts/UserContext.tsx`: Menggunakan pendengar realtime (`onSnapshot`) dari Firestore asli, sehingga setiap XP kuis, badge, atau informasi profil terbaru yang didapat pengguna akan langsung ter-render di UI secara instan.
* ✏️ `src/components/Login.tsx` & `Register.tsx` & `ForgotPassword.tsx`: Diubah total untuk menggunakan fungsi Firebase asli dari `authService` dan mendeteksi login Google yang sukses untuk disimpan ke Firestore.
* ✏️ `src/components/Onboarding.tsx`: Mengirim data preferensi belajar langsung ke dokumen Firestore pengguna.
* ✏️ `src/components/SettingsProfile.tsx`: Ditambahkan fitur **Drag & Drop** file foto avatar baru, divalidasi langsung di sisi klien, dan diunggah ke Firebase Storage asli.
* ✏️ `src/components/SettingsAccount.tsx` & `SettingsSecurity.tsx`: Menyinkronkan perubahan alamat email atau kata sandi ke Firebase Auth asli, lengkap dengan proses re-autentikasi mandiri demi keamanan akun.
* ✏️ `src/lib/firebase.ts`: Menghapus semua logika simulator Auth lokal yang sudah usang, namun tetap mempertahankan data kuis statis dan simulasi eksternal lainnya agar kompatibilitas aplikasi tetap terjaga utuh.

---

## 🔒 Konfigurasi Environment Variables

Pastikan variabel-variabel berikut telah ditambahkan ke pengaturan lingkungan (Secrets/Environment Variables) aplikasi Anda di AI Studio agar aplikasi dapat terhubung ke server Firebase Anda:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="cyber-academy-ai.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="cyber-academy-ai"
VITE_FIREBASE_STORAGE_BUCKET="cyber-academy-ai.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```
---

## 🔐 Konfigurasi Server Firebase Admin & Otorisasi Admin (Step 2B-A.1)

Aplikasi **Cyber Academy AI** menerapkan skema otorisasi administrator berbasis **Firebase Auth Custom Claim (`admin === true`)** yang dievaluasi secara aman di backend.

### 1. Konfigurasi Lingkungan (Environment & Credentials)
- **Local Development**: Gunakan **Application Default Credentials** (`gcloud auth application-default login`).
- **Cloud Run Deployment**: Menggunakan service account runtime bawaan Cloud Run dengan role IAM yang sesuai (Firebase Admin / Firestore User).
- **CRITICAL SECURITY RULE**: **JANGAN SEPERTI APAPUN** memasukkan isi JSON service-account atau kunci privat ke dalam kode sumber, `.env`, Git, atau environment Cloud Run.

### 2. Menetapkan Status Administrator (`set-admin` Script)
Gunakan skrip `set-admin` untuk memberikan klaim admin kepada pengguna:

```bash
# Berdasarkan Alamat Email:
npm run set-admin -- --email user@example.com

# Berdasarkan Firebase UID:
npm run set-admin -- --uid FIREBASE_UID_HERE
```

> **Catatan Otorisasi Penting:**
> Setelah skrip `set-admin` berhasil dijalankan, pengguna yang bersangkutan **wajib melakukan Logout dan Login kembali**, atau aplikasi klien memicu pembaruan token paksa (`getIdToken(user, true)`) agar klaim admin baru terrefleksi pada ID Token browser.

---

## 🏛️ Arsitektur Admin & Catalog API (Step 2B-B1)

Aplikasi **Cyber Academy AI** menerapkan arsitektur backend tepercaya untuk manajemen konten pembelajaran (Learning Paths, Courses, Lessons) dengan prinsip pemisahan tugas (Separation of Concerns) dan pertahanan berlapis (Defense-in-Depth).

### 1. Struktur Arsitektur
- **Admin Content API (`/api/admin/*`)**:
  - Memerlukan otentikasi valid (`authenticateUser`) dan custom claim `admin === true` (`requireAdmin`).
  - Menyediakan endpoint CRUD penuh untuk `learning-paths`, `courses`, dan `lessons`.
  - Menerapkan batasan pagination (`limit`, `cursor`) dan pencarian (`search`).
  - Dilengkapi validasi skema ketat menggunakan Zod (`server/validation/contentSchemas.ts`).
- **Public Catalog API (`/api/catalog/*`)**:
  - Endpoint publik berkecepatan tinggi yang hanya menyajikan konten berstatus `published`.
  - Dilindungi oleh Rate Limiter (`express-rate-limit` max 300 request / 15 menit).
  - Menyembunyikan seluruh metadata sensitif internal admin (`createdBy`, `updatedBy`, audit logs).
  - Dipanggil langsung oleh antarmuka pengguna (`src/services/catalogService.ts`).

### 2. Strategi ID, Slug, Audit Log, dan Transaksi Atomic
- **Firestore Document ID & Slug**:
  - Document ID di Firestore secara default menggunakan `slug` yang telah dinormalisasi (lowercase, alphanumerical & hyphen).
  - Pengecekan slug duplikat dilakukan di dalam transaksi Firestore. Jika slug sudah digunakan, API mengembalikan response `409 Conflict`.
- **Integritas Relational & Cascading Check**:
  - Sebelum menghapus `learningPath`, sistem memverifikasi bahwa tidak ada `course` anak terkait.
  - Sebelum menghapus `course`, sistem memverifikasi bahwa tidak ada `lesson` anak terkait.
  - Percobaan menghapus parent yang memiliki children akan ditolak dengan response `409 Conflict`.
- **Atomic Mutation & Audit Log**:
  - Seluruh mutasi data (Create, Update, Delete) dijalankan di dalam **Firestore Transaction (`adminDb.runTransaction`)**.
  - Catatan audit log ditulis secara otomatis ke koleksi `adminAuditLogs` di dalam transaksi yang sama. Jika penulisan audit log atau mutasi gagal, seluruh transaksi dibatalkan (rollback).

### 3. Ekspor dan Seeding Katalog Aman

Ekspor katalog produksi hanya membaca lima koleksi katalog dan tidak membaca data pengguna:

```bash
npm run export:catalog -- --project=PROJECT_ID
```

Hasilnya disimpan sebagai `firestore-catalog-export.json`. Timestamp dikonversi ke ISO string dan setiap object memuat document ID.

Seed menggunakan `batch.set(..., { merge: true })` sehingga dokumen dengan ID yang sama diperbarui secara idempotent, sedangkan field lain yang tidak didefinisikan source tetap dipertahankan. Seed tidak pernah menghapus dokumen. Sebelum write, validator memeriksa duplicate ID/slug, seluruh relasi, jumlah child, dan urutan. Jika Firestore memiliki dokumen katalog yang tidak terdapat di source, proses berhenti untuk review manual.

Target default adalah emulator dan tanpa `--confirm` operasi menjadi dry-run:

```bash
# Emulator lokal
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:content -- \
  --target=emulator --project=demo-cyber-academy --confirm

# Dry-run produksi: hanya membaca katalog
npm run seed:content -- \
  --target=production --project=cyber-academy-6aeba --dry-run

# Write produksi: jalankan hanya setelah managed backup selesai
npm run seed:content -- \
  --target=production --project=cyber-academy-6aeba --confirm \
  --confirm-production=cyber-academy-6aeba
```

Jangan menjalankan seed produksi sebelum managed export seluruh database berstatus `Completed`. Jangan mengunggah backup penuh karena dapat memuat data pribadi. Lihat [`docs/catalog-sync.md`](docs/catalog-sync.md) untuk deployment dan rollback.

Sinkronisasi empat badge milestone dapat diperiksa melalui dry-run, lalu
dijalankan dengan konfirmasi:

```bash
npm run seed-badges
npm run seed-badges -- --confirm
```

Panduan eligibility, progress, migrasi legacy, dan rollback badge tersedia di
`docs/badges.md`.

### 4. Arsitektur Runtime Firestore Eksklusif & Verifikasi Katalog (Step 2B-B1.5)
- **Sumber Tunggal Data Katalog**: `server/services/contentService.ts` membaca dan menulis 100% dari Cloud Firestore. Seluruh fallback ke data statis `src/data.ts` untuk runtime catalog telah dihapus.
- **Dynamic Dashboard Active Path Selection**: Dashboard memilih `activePath` secara dinamis berdasarkan progres pengguna (mencari path berstatus `in_progress`, lalu `published` pertama).
- **Tata Cara Verifikasi Katalog Firestore**:
  1. Jalankan dry-run dan seed sesuai prosedur aman pada `docs/catalog-sync.md` untuk mengisi atau menyinkronkan katalog.
  2. Buka aplikasi, navigasi ke `/dashboard` atau `/learn/paths`. Katalog dipanggil secara publik dari Firestore via `/api/catalog/paths`.
  3. Mengarsipkan atau menghapus dokumen di koleksi Firestore `learningPaths`/`courses`/`lessons` secara otomatis mencerminkan status konten saat aplikasi melakukan fetch/reload katalog tanpa perlu restart server.
- **Toleransi Kegagalan & Empty State**: Jika koleksi Firestore kosong, Catalog API mengembalikan array kosong `[]` secara bersih sehingga UI menampilkan *empty state*. Jika Firestore mengalami kesalahan koneksi, server mengembalikan status *500 Internal Server Error* sehingga UI menampilkan state error dengan tombol coba lagi (*retry*).
- **Rules of Hooks Guaranteed**: Seluruh halaman (`Dashboard.tsx`, `ProgressPage.tsx`) mendeklarasikan React hooks di tingkat teratas sebelum sekat kondisional `if (!currentUser) return ...` untuk menjamin tidak ada crash tatanan hook. Rerender dari user null ke user valid diuji dengan DOM integration test.

### 5. Menjalankan Suite Integration Test (`npm test`)
Seluruh alur API, middleware auth, isolasi catalog, validasi seed, transaksi, dan aturan tatanan hook dibuktikan oleh test suite otomatis berbasis Vitest:

```bash
# Jalankan seluruh unit test & integration test:
npm test
```

Test suite menguji:
- Unauthorized request ke `/api/admin/*` menolak dengan 401.
- Non-admin request ke `/api/admin/*` menolak dengan 403.
- Admin request membuat, mengupdate, dan menghapus konten beserta log audit (201/200).
- Benturan slug atau penghapusan parent berketerikatan menolak dengan 409 Conflict.
- Catalog API publik menyaring item draft, menyembunyikan metadata internal, dan mengembalikan `[]` saat Firestore kosong.
