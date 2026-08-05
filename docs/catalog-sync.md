# Sinkronisasi Katalog Firestore

## Ringkasan untuk Pemula

Website produksi membaca katalog langsung dari Firestore. Source lama hanya memuat 19 course, tetapi Firestore memiliki enam course lama tambahan. Seed lama memakai `batch.create()` dan melewati ID yang sudah ada, sehingga deployment source baru tidak pernah memperbarui atau mendeteksi data lama. Akibatnya source menampilkan angka 19 saat diaudit, sedangkan website menampilkan 25.

Perbaikan dilakukan tanpa menghapus database:

1. managed export seluruh database produksi diselesaikan terlebih dahulu;
2. script read-only mengekspor hanya lima koleksi katalog;
3. enam course dan seluruh turunannya dipulihkan ke source;
4. order yang bertabrakan dinormalisasi;
5. seed diubah menjadi merge-upsert idempotent dengan guard produksi.

## Statistik Final

| Jalur | Course | Lesson | Quiz | Question |
| --- | ---: | ---: | ---: | ---: |
| Beginner | 4 | 9 | 4 | 20 |
| Intermediate | 10 | 32 | 10 | 65 |
| Advanced | 11 | 38 | 11 | 75 |
| **Total** | **25** | **79** | **25** | **160** |

Ditambah 3 dokumen `learningPaths`, total dokumen seed adalah 292.

## Course yang Dipulihkan dari Produksi

| Jalur | Order final | Document ID | Lesson | Quiz | Question |
| --- | ---: | --- | ---: | ---: | ---: |
| Intermediate | 8 | `keamanan-jaringan-wifi` | 2 | 1 | 5 |
| Intermediate | 9 | `malware-ransomware-defense` | 2 | 1 | 5 |
| Intermediate | 10 | `keamanan-web-api` | 2 | 1 | 5 |
| Advanced | 9 | `owasp-risk-awareness` | 2 | 1 | 5 |
| Advanced | 10 | `kriptografi-praktis` | 2 | 1 | 5 |
| Advanced | 11 | `incident-response-etika` | 2 | 1 | 5 |

Judul, slug, isi materi, objective, contoh kasus, tips, key takeaways, quiz, opsi jawaban, jawaban benar, penjelasan, XP, document ID, dan relasi berasal dari ekspor Firestore produksi. Hanya field `order` course yang dinormalisasi karena data lama memakai order 1–3 dan bertabrakan dengan course source.

## Arsitektur Relasi Data

| Koleksi | Parent | Field relasi |
| --- | --- | --- |
| `learningPaths` | — | `id` |
| `courses` | `learningPaths` | `learningPathId` |
| `lessons` | `courses` | `courseId` |
| `quizzes` | `courses` | `courseId` |
| `questions` | `quizzes` dan `courses` | `quizId`, `courseId` |

`recommendedLessonId` pada question bersifat opsional dan dapat menunjuk lesson lain dalam jalur yang sama, misalnya final quiz lintas materi.

Source katalog berada pada:

- `src/data.ts` untuk agregasi path, course, dan lesson;
- `src/quiz_data.ts` untuk agregasi quiz dan question;
- `src/live_catalog_additions.ts` untuk enam course hasil pemulihan;
- `src/intermediate_data.ts` dan `src/advanced_data.ts` untuk kurikulum sebelumnya.

Runtime tetap memakai Firestore melalui `/api/catalog/*`. Source TypeScript berfungsi sebagai katalog yang dapat di-seed ulang pada Firestore kosong.

## Backup Produksi

Sebelum write produksi:

1. Google Cloud Console → Firestore → database `(default)`;
2. Import/Export → Export;
3. pilih **Export entire database** dan **Export current state**;
4. pilih bucket privat di lokasi `asia-southeast1` atau multi-region `asia`;
5. tunggu status `Completed`.

Backup penuh dapat memuat data pengguna. Simpan di bucket privat dan jangan mengunggahnya ke repository atau chat.

## Ekspor Katalog Read-only

```bash
npm run export:catalog -- --project=cyber-academy-6aeba
```

Script `scripts/export-live-catalog.ts`:

- memakai Application Default Credentials;
- hanya memanggil read pada `learningPaths`, `courses`, `lessons`, `quizzes`, dan `questions`;
- tidak membaca koleksi pengguna;
- tidak memiliki operasi create, set, update, atau delete;
- mengubah Timestamp menjadi ISO string;
- menyertakan document ID;
- menghasilkan `firestore-catalog-export.json`.

File JSON hasil ekspor sengaja tidak dimasukkan ke ZIP final agar snapshot produksi tidak ikut tersebar. Data katalog yang diperlukan sudah dipindahkan ke TypeScript.

## Seed yang Aman

Seed memvalidasi sebelum write:

- duplicate ID dalam setiap koleksi;
- duplicate slug;
- course → learning path;
- lesson → course;
- quiz → course;
- question → quiz dan course;
- `recommendedLessonId` jika tersedia;
- `courseCount`, `lessonCount`, dan `questionCount` berdasarkan child sebenarnya;
- order harus unik dan berurutan mulai dari 1;
- tepat satu quiz untuk setiap course;
- dokumen Firestore yang tidak terdapat di source.

Seed tidak pernah menghapus dokumen. Dokumen dengan ID sama ditulis memakai `set(..., { merge: true })`, sehingga aman dijalankan ulang.

### Emulator — target default

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:content -- \
  --target=emulator --project=demo-cyber-academy --confirm
```

### Project pengujian

```bash
npm run seed:content -- \
  --target=test --project=PROJECT_TEST --confirm
```

Script menolak memakai project produksi sebagai target test.

### Dry-run produksi

```bash
npm run seed:content -- \
  --target=production --project=cyber-academy-6aeba --dry-run
```

Dry-run hanya membaca lima koleksi katalog dan tidak menulis data.

### Write produksi

Jalankan hanya setelah backup berstatus `Completed` dan hasil dry-run tidak memiliki `Unexpected Docs`:

```bash
npm run seed:content -- \
  --target=production --project=cyber-academy-6aeba --confirm \
  --confirm-production=cyber-academy-6aeba
```

Konfirmasi nama project sengaja harus ditulis lengkap untuk mencegah salah target.

## Deployment Aman

1. Simpan URL/revision Cloud Run yang sedang aktif.
2. Jalankan `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, dan `npm run build`.
3. Pastikan managed backup Firestore selesai.
4. Jalankan dry-run seed produksi.
5. Jika `Unexpected Docs: 0`, jalankan seed produksi dengan konfirmasi berlapis.
6. Deploy source baru ke Cloud Run memakai environment dan service account yang sama dengan revision stabil.
7. Periksa `/api/health`, landing page, login, setiap jalur belajar, satu lesson dari enam course hasil pemulihan, dan quiz terkait.
8. Verifikasi endpoint katalog menampilkan 4/10/11 course dan urutan 1–10 serta 1–11.
9. Jangan menghapus revision Cloud Run lama sampai smoke test selesai.

## Rollback

### Jika hanya aplikasi yang bermasalah

Alihkan traffic Cloud Run kembali ke revision sebelumnya. Ini tidak menyentuh Firestore.

### Jika katalog Firestore bermasalah

1. hentikan seed/deployment lanjutan;
2. catat waktu dan gejala;
3. buka Firestore → Import/Export;
4. pilih Import dan file `.overall_export_metadata` dari managed export terakhir;
5. pahami bahwa import dapat menimpa dokumen dengan ID sama;
6. setelah import selesai, jalankan kembali pemeriksaan endpoint katalog.

Jangan melakukan rollback database jika masalah hanya berada pada UI atau revision Cloud Run.

## Catatan Presentasi Lomba

Penjelasan singkat yang dapat disampaikan:

> Website menggunakan Firestore sebagai sumber data runtime. Kami menemukan source hanya mendefinisikan 19 kelas, sedangkan Firestore masih memiliki enam kelas dari seed lama. Kami tidak menghapus kelas tersebut karena materinya valid. Setelah membuat backup penuh, kami mengekspor hanya koleksi katalog secara read-only, memulihkan enam kelas beserta seluruh lesson dan quiz ke source, menambahkan validasi relasi otomatis, lalu mengubah seed menjadi idempotent dan aman untuk produksi. Hasil akhirnya konsisten: 4 Beginner, 10 Intermediate, 11 Advanced, total 25 kelas.
