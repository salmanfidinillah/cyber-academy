# Intermediate Learning Path — Batch 1

## Scope

Batch ini melengkapi jalur **Intermediate: Deteksi & Pertahanan Aktif** menggunakan arsitektur katalog, progress, quiz, badge, dan sertifikat yang sudah dipakai oleh Beginner.

Advanced awalnya sengaja belum diisi pada batch ini agar perubahan besar dapat diverifikasi dalam dua tahap. Implementasi lanjutannya kini dicatat di `ADVANCED_IMPLEMENTATION.md`. Tidak ada ZIP final yang dibuat.

## Konten

- 10 kelas utama.
- 32 lesson/modul terstruktur.
- 9 quiz evaluasi kelas, masing-masing 5 soal.
- 1 Final Quiz Intermediate pada kelas Incident Response, berisi 20 soal lintas materi.
- Total 10 quiz dan 65 question.
- Passing grade Intermediate: 75.
- Total XP satu kali dari lesson dan quiz: 770 XP.
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

Tiga course tambahan yang dipulihkan dari ekspor read-only produksi adalah `keamanan-jaringan-wifi`, `malware-ransomware-defense`, dan `keamanan-web-api`. Seluruh ID lesson, quiz, question, jawaban, dan relasinya dipertahankan. Field order dinormalisasi menjadi 8, 9, dan 10.

Lakukan managed backup seluruh Firestore terlebih dahulu, lalu jalankan dry-run dan seed produksi sesuai [`docs/catalog-sync.md`](docs/catalog-sync.md). Seed memakai merge-upsert, tidak menghapus dokumen, dan berhenti jika menemukan dokumen katalog tak dikenal.

API katalog sekarang menghitung `courseCount` dan estimasi durasi dari course published yang benar-benar ada. Karena itu card tidak bergantung pada metadata jumlah kelas yang mungkin lama di dokumen learning path.

## Batch 2

Batch 2 dan sinkronisasi produksi mengisi 11 kelas Advanced, 38 lesson, quiz per kelas, Final Quiz Advanced 25 soal, Badge Advanced, dan dukungan sertifikat Advanced. Lihat `ADVANCED_IMPLEMENTATION.md`.
