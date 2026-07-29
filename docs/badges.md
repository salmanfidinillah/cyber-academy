# Sistem Badge Milestone Cyber Academy

## Badge aktif

Sistem hanya memiliki empat badge aktif:

| ID stabil | Slug publik | Nama | Syarat |
| --- | --- | --- | --- |
| `badge-cyber-defender` | `beginner-master` | Beginner Master | Seluruh course dan lesson published pada `beginner-path` selesai, serta seluruh quiz published lulus. |
| `badge-intermediate-defender` | `intermediate-master` | Intermediate Master | Seluruh course dan lesson published pada `intermediate-path` selesai, serta seluruh quiz published lulus. |
| `badge-advanced-specialist` | `advanced-master` | Advanced Master | Seluruh course dan lesson published pada `advanced-path` selesai, serta seluruh quiz published lulus. |
| `badge-simulation-analyst` | `simulation-defender` | Simulation Defender | Seluruh simulasi configured yang berstatus published memiliki attempt lulus. |

ID lama dipertahankan agar award pengguna yang sudah ada tetap dapat dikenali.
Nama dan slug publik dinormalisasi ke empat milestone final.

## Server authority

- Browser hanya meminta evaluasi dan menampilkan hasil API.
- UID selalu berasal dari Firebase ID token.
- Body progress dari browser ditolak.
- Eligibility dihitung dari katalog dan progress Firestore server-side.
- Course, lesson, quiz, dan simulasi draft/inactive tidak dihitung.
- Award menggunakan ID deterministik `uid__badge__badgeId`.
- Transaksi Firestore mencegah award dan audit log duplikat.
- Badge tidak memberikan XP sehingga sistem XP tidak berubah.

## Endpoint

- `GET /api/badges`: empat definisi aktif.
- `GET /api/me/badges`: award milestone milik pengguna terautentikasi.
- `GET /api/me/badges/progress`: progress empat milestone dari server.
- `POST /api/me/badges/evaluate`: mengevaluasi dan memberi award yang memenuhi syarat.
- `GET /api/admin/badges`: empat badge aktif dan definisi legacy inactive.
- `PATCH /api/admin/badges/:badgeId`: endpoint lama dipertahankan, tetapi badge utama tidak dapat dinonaktifkan dan badge legacy tidak dapat diaktifkan.

## Seed badge

Dry-run:

```bash
npm run seed-badges
```

Tulis perubahan:

```bash
npm run seed-badges -- --confirm
```

Seed bersifat idempotent, tidak mengubah `userBadges`, tidak menghapus dokumen,
dan menonaktifkan definisi non-milestone yang masih aktif.

## Migrasi data lama

Dry-run wajib dilakukan terlebih dahulu:

```bash
npm run migrate:badges
```

Jika hasil dry-run sudah diperiksa dan pemilik project memberi izin:

```bash
npm run migrate:badges -- --confirm
```

Migrasi:

- membuat atau menormalisasi empat definisi aktif;
- menandai definisi lain sebagai inactive/deprecated;
- menormalisasi slug award milestone lama;
- mempertahankan `awardedAt`;
- tidak mengubah award granular menjadi Master;
- tidak menghapus histori;
- tidak dijalankan otomatis saat build atau deploy.

## Pengujian manual

1. Login menggunakan akun baru.
2. Buka `/badges` dan pastikan tepat empat badge tampil.
3. Pastikan seluruh badge terkunci dan progress berasal dari respons API.
4. Selesaikan sebagian jalur Beginner dan pastikan Beginner Master belum terbuka.
5. Selesaikan seluruh lesson dan course Beginner, tetapi sisakan satu quiz belum lulus.
6. Pastikan Beginner Master masih terkunci.
7. Luluskan seluruh quiz wajib Beginner.
8. Buka ulang `/badges` dan pastikan Beginner Master diberikan satu kali.
9. Refresh dan ulangi request evaluasi; pastikan dokumen `userBadges` tidak bertambah.
10. Ulangi untuk Intermediate dan Advanced.
11. Luluskan satu simulasi dan pastikan Simulation Defender belum terbuka.
12. Buat attempt gagal pada satu simulasi wajib dan pastikan belum dihitung.
13. Luluskan semua simulasi published dan pastikan Simulation Defender terbuka.
14. Login sebagai admin dan buka `/admin/badges`.
15. Pastikan empat badge berstatus aktif dan badge lama berstatus Legacy — Inactive.
16. Periksa tampilan mobile, tablet, dan desktop.
17. Periksa Firestore tanpa menghapus dokumen legacy.

## Deploy ulang

Perubahan badge ikut terdeploy bersama aplikasi Cloud Run yang sama. Tidak ada
perubahan domain, Firebase Hosting, route URL, atau environment Vertex AI.

1. Jalankan lint, type-check, test, dan build.
2. Deploy source menggunakan prosedur Cloud Run project yang sudah berlaku.
3. Jalankan `npm run seed-badges -- --confirm` pada environment yang memiliki
   akses Firestore.
4. Jalankan migrasi hanya setelah dry-run diperiksa dan disetujui.

## Rollback

1. Redeploy revisi Cloud Run sebelumnya.
2. Jangan hapus `userBadges`.
3. Karena migrasi tidak menghapus histori, definisi lama tetap tersedia sebagai
   inactive.
4. Jika perlu, pulihkan metadata badge dari backup/export Firestore sebelum
   migrasi. Jangan mengaktifkan badge granular melalui endpoint admin.
