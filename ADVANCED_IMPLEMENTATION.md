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

- 11 kelas utama.
- 38 lesson terstruktur.
- 10 quiz kelas, masing-masing lima soal.
- 1 Final Quiz Advanced pada kelas Secure Architecture dan Zero Trust, berisi 25 soal lintas materi.
- Total 11 quiz dan 75 question.
- Passing grade seluruh quiz Advanced: 80.
- Total reward satu kali:
  - Lesson: 660 XP berdasarkan 38 lesson sebenarnya.
  - Quiz: 470 XP berdasarkan 11 quiz sebenarnya.
  - Total: 1.130 XP.

### Daftar Kelas

1. Metodologi Penetration Testing yang Legal
2. Advanced Web Security
3. Digital Forensics Dasar
4. Analisis Malware Dasar yang Aman
5. Threat Intelligence
6. Security Monitoring dan SIEM
7. Incident Response Lanjutan
8. Secure Architecture dan Zero Trust
9. OWASP Risk Awareness
10. Kriptografi Praktis
11. Incident Response & Etika Siber

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
5. Path selesai setelah seluruh sebelas course selesai.
6. XP lesson memakai dokumen transaksi deterministik per user dan lesson.
7. XP quiz hanya diberikan pada kelulusan pertama; attempt berikutnya tetap menyimpan hasil terbaru dan skor terbaik.
8. Badge `badge-advanced-specialist` dengan nama publik **Advanced Master** diberikan satu kali setelah seluruh syarat `advanced-path` terverifikasi server.
9. Sertifikat Advanced memakai sistem sertifikat generik dengan `learningPathId=advanced-path`; eligibility membutuhkan semua lesson, course, dan quiz selesai/lulus.

## Firestore

Konten menggunakan collection yang sudah ada:

- `learningPaths`
- `courses`
- `lessons`
- `quizzes`
- `questions`

Katalog Advanced yang telah disinkronkan berisi 135 dokumen:

- 11 course
- 38 lesson
- 11 quiz
- 75 question

Badge default dibuat secara idempotent oleh backend ketika endpoint badge digunakan.

Tiga course tambahan yang dipulihkan dari ekspor read-only produksi adalah `owasp-risk-awareness`, `kriptografi-praktis`, dan `incident-response-etika`. Seluruh ID dan relasi turunannya dipertahankan, sedangkan field order dinormalisasi menjadi 9, 10, dan 11.

Seed memakai merge-upsert sehingga source dapat membangun ulang katalog pada Firestore kosong maupun memperbarui dokumen dengan ID sama. Seed tidak menghapus dokumen dan memerlukan managed backup serta konfirmasi produksi berlapis. Prosedur lengkap tersedia di [`docs/catalog-sync.md`](docs/catalog-sync.md).

## Verifikasi

Hasil final Batch 2:

- `npm run lint`: lulus.
- `npm test`: lihat hasil verifikasi terbaru pada `FINAL_REVIEW.md`.
- `npm run build`: lulus.
- Validasi seed: lulus.
- Total katalog: 3 path, 25 course, 79 lesson, 25 quiz, 160 question.
- Total dokumen seed: 292.

Build memberikan peringatan ukuran main chunk sekitar 570 kB setelah minifikasi. Ini bukan build failure, tetapi code splitting dapat dijadikan optimasi performa pada revisi terpisah.

## Batas Verifikasi

- Managed export seluruh Firestore produksi telah selesai sebelum sinkronisasi source. Operasi write produksi tetap harus dilakukan pemilik project memakai guard seed yang terdokumentasi.
- Pemeriksaan responsif dilakukan pada struktur class dan komponen untuk breakpoint mobile, tablet, dan desktop; browser visual lintas enam viewport tetap perlu smoke test setelah data di-seed dan revisi dideploy.
- Arsitektur saat ini memakai satu quiz bernilai per course. Setiap lesson memiliki mini latihan, tetapi belum ada entity quiz terpisah untuk setiap modul karena itu membutuhkan perubahan schema, route, dan progress engine yang lebih luas.
