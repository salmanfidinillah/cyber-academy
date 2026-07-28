# Advanced Learning Path — Batch 2

## Scope

Batch ini melengkapi jalur **Advanced: Pengamanan Sistem Mendalam** dengan sistem katalog, progress, quiz, XP, badge, sertifikat, dan seed yang sama dengan Beginner serta Intermediate.

Tidak ada ZIP final yang dibuat pada batch ini.

## Audit Awal

- Dokumen `advanced-path` sudah ada, tetapi metadata UI masih berupa placeholder.
- Card menampilkan `courseCount: 5`, sedangkan isi visual hanya memuat tiga judul statis.
- Tidak ada course, lesson, quiz, atau question Advanced yang dapat di-seed.
- Sistem backend yang sudah tersedia sebenarnya sudah mendukung progress akun, urutan course, prerequisite path, quiz, skor terbaik, XP idempotent, badge path, dan sertifikat generik.
- Solusi dipusatkan pada pengisian katalog Advanced memakai arsitektur yang sudah ada, bukan membuat progress engine kedua.

## Konten Advanced

- 8 kelas utama.
- 32 lesson terstruktur, masing-masing empat lesson per kelas.
- 7 quiz kelas, masing-masing lima soal.
- 1 Final Quiz Advanced pada kelas Secure Architecture dan Zero Trust, berisi 25 soal lintas materi.
- Passing grade seluruh quiz Advanced: 80.
- Total reward satu kali:
  - Lesson: 32 × 15 XP = 480 XP.
  - Quiz kelas: 7 × 35 XP = 245 XP.
  - Final Quiz Advanced: 75 XP.
  - Total: 800 XP.

### Daftar Kelas

1. Metodologi Penetration Testing yang Legal
2. Advanced Web Security
3. Digital Forensics Dasar
4. Analisis Malware Dasar yang Aman
5. Threat Intelligence
6. Security Monitoring dan SIEM
7. Incident Response Lanjutan
8. Secure Architecture dan Zero Trust

## Struktur Lesson

Setiap lesson memuat:

- estimasi waktu;
- tujuan pembelajaran;
- pendahuluan;
- konsep utama;
- contoh sederhana;
- studi kasus defensif;
- kesalahan umum;
- batas aman/etika jika relevan;
- tips keamanan;
- ringkasan;
- mini latihan.

Materi penetration testing dan malware dibatasi pada etika, izin, metodologi, laporan fiktif, serta analisis defensif. Project tidak menyertakan malware nyata, source code malware, atau instruksi eksploitasi target nyata.

## Progress, Unlock, dan Reward

1. Advanced terkunci sampai `intermediate-path` berstatus `completed`.
2. Course berikutnya terkunci sampai course sebelumnya `completed`.
3. Quiz terkunci sampai seluruh lesson course selesai.
4. Course dinyatakan selesai setelah quiz course lulus.
5. Path selesai setelah seluruh delapan course selesai.
6. XP lesson memakai dokumen transaksi deterministik per user dan lesson.
7. XP quiz hanya diberikan pada kelulusan pertama; attempt berikutnya tetap menyimpan hasil terbaru dan skor terbaik.
8. Badge `badge-advanced-specialist` diberikan satu kali setelah `advanced-path` selesai.
9. Sertifikat Advanced memakai sistem sertifikat generik dengan `learningPathId=advanced-path`; eligibility membutuhkan semua lesson, course, dan quiz selesai/lulus.

## Firestore

Konten menggunakan collection yang sudah ada:

- `learningPaths`
- `courses`
- `lessons`
- `quizzes`
- `questions`

Batch 2 menambah 100 dokumen konten Advanced baru:

- 8 course
- 32 lesson
- 8 quiz
- 60 question

Badge default dibuat secara idempotent oleh backend ketika endpoint badge digunakan.

Untuk memasukkan dokumen yang belum ada, jalankan dari root project pada lingkungan yang memiliki Application Default Credentials:

```bash
npm run seed-content -- --confirm
```

Seed tidak memperbarui atau menghapus dokumen lama. API katalog menghitung jumlah course dan durasi dari course published yang benar-benar ada, sehingga metadata lama `courseCount` tidak menyebabkan card kembali menampilkan angka placeholder.

## Verifikasi

Hasil final Batch 2:

- `npm run lint`: lulus.
- `npm test`: 13 file, 133 test lulus.
- `npm run build`: lulus.
- Validasi seed: lulus.
- Total katalog: 3 path, 19 course, 67 lesson, 19 quiz, 130 question.
- Total dokumen seed: 238.

Build memberikan peringatan ukuran main chunk sekitar 570 kB setelah minifikasi. Ini bukan build failure, tetapi code splitting dapat dijadikan optimasi performa pada revisi terpisah.

## Batas Verifikasi

- Firestore production tidak diubah dari workspace ini karena tidak ada kredensial Cloud milik pengguna.
- Pemeriksaan responsif dilakukan pada struktur class dan komponen untuk breakpoint mobile, tablet, dan desktop; browser visual lintas enam viewport tetap perlu smoke test setelah data di-seed dan revisi dideploy.
- Arsitektur saat ini memakai satu quiz bernilai per course. Setiap lesson memiliki mini latihan, tetapi belum ada entity quiz terpisah untuk setiap modul karena itu membutuhkan perubahan schema, route, dan progress engine yang lebih luas.
