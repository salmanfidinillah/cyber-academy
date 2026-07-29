# Intermediate Learning Path — Batch 1

## Scope

Batch ini melengkapi jalur **Intermediate: Deteksi & Pertahanan Aktif** menggunakan arsitektur katalog, progress, quiz, badge, dan sertifikat yang sudah dipakai oleh Beginner.

Advanced awalnya sengaja belum diisi pada batch ini agar perubahan besar dapat diverifikasi dalam dua tahap. Implementasi lanjutannya kini dicatat di `ADVANCED_IMPLEMENTATION.md`. Tidak ada ZIP final yang dibuat.

## Konten

- 7 kelas utama.
- 26 lesson/modul terstruktur.
- 6 quiz evaluasi kelas, masing-masing 5 soal.
- 1 Final Quiz Intermediate pada kelas Incident Response, berisi 20 soal lintas materi.
- Passing grade Intermediate: 75.
- Total XP satu kali dari lesson dan quiz: 500 XP.
- Badge: `badge-intermediate-defender` dengan nama publik **Intermediate Master**.
- Sertifikat: memakai sistem sertifikat generik dengan `learningPathId=intermediate-path`.

## Aturan Unlock

1. Intermediate terkunci sampai progress `beginner-path` berstatus `completed`.
2. Course berikutnya terkunci sampai course sebelumnya berstatus `completed`.
3. Quiz course terkunci sampai seluruh lesson course selesai.
4. Sertifikat terkunci sampai seluruh lesson, course, dan quiz pada path selesai/lulus.
5. XP quiz dan lesson tetap idempotent melalui ID transaksi deterministik di backend.

## Memasukkan Konten ke Firestore

Jalankan dari root project pada lingkungan yang memiliki Application Default Credentials:

```bash
npm run seed-content -- --confirm
```

Seed hanya membuat dokumen yang belum ada. ID dokumen stabil, validasi berjalan sebelum Firebase Admin diinisialisasi, dan batch dibatalkan bila melebihi batas aman 450 operasi.

API katalog sekarang menghitung `courseCount` dan estimasi durasi dari course published yang benar-benar ada. Karena itu card tidak bergantung pada metadata jumlah kelas yang mungkin lama di dokumen learning path.

## Batch 2

Batch 2 sudah mengisi 8 kelas Advanced, 32 lesson, quiz per kelas, Final Quiz Advanced 25 soal, Badge Advanced, dan dukungan sertifikat Advanced. Lihat `ADVANCED_IMPLEMENTATION.md`.
