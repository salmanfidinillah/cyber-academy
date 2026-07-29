# Migrasi AI Tutor ke Gemini melalui Vertex AI

## Ringkasan

Production tidak lagi bergantung pada Gemini Developer API key. Backend memakai
`@google/genai`, Vertex AI, Application Default Credentials (ADC), dan service
account yang dipasang pada Cloud Run. Browser tetap hanya berbicara dengan
Express dan tidak pernah menerima credential Google.

Alasan migrasi:

- credential production mengikuti service identity Cloud Run;
- tidak ada API key atau private key di frontend maupun build;
- IAM dapat dibatasi ke `roles/aiplatform.user`;
- timeout, retry, validasi output, quota pengguna, dan error terstruktur
  dikendalikan oleh backend.

```text
React frontend
→ Express backend
→ Firebase token verification
→ AI provider service
→ Vertex AI Gemini
→ response validation
→ Firestore
```

AI Tutor (`/api/ai/tutor`) dan Learning Insight (`/api/ai/insight`) memakai
provider yang sama. Prompt dan schema output keduanya tetap terpisah.

## Environment

```env
AI_PROVIDER="vertex"
GOOGLE_CLOUD_PROJECT="PROJECT_ID"
GOOGLE_CLOUD_LOCATION="global"
GEMINI_MODEL="gemini-2.5-flash"
AI_REQUEST_TIMEOUT_MS="25000"
AI_MAX_INPUT_CHARS="4000"
AI_MAX_HISTORY_MESSAGES="12"
AI_MAX_OUTPUT_TOKENS="800"
AI_INSIGHT_MAX_OUTPUT_TOKENS="1400"
AI_MAX_RETRIES="2"
```

`AI_PROVIDER` hanya menerima `vertex` atau compatibility mode eksplisit
`gemini-api`. Production harus memakai `vertex`. Tidak ada fallback diam-diam
dari Vertex AI ke API key.

Compatibility mode lama hanya untuk rollback aplikasi:

```env
AI_PROVIDER="gemini-api"
GEMINI_API_KEY="..."
```

Jangan memberi prefix `VITE_` pada credential backend. Jangan set
`GOOGLE_APPLICATION_CREDENTIALS` di Cloud Run dan jangan menyimpan ADC,
service-account JSON, access token, atau private key di repository.

## Local development dengan ADC

Prasyarat: Node.js 20+, Google Cloud CLI, project dengan billing aktif, Vertex
AI API aktif, dan akun lokal yang memiliki izin memanggil Vertex AI.

```bash
gcloud auth login
gcloud config set project PROJECT_ID
gcloud auth application-default login
cp .env.example .env
npm ci
npm run dev
```

Isi `GOOGLE_CLOUD_PROJECT` di `.env`. ADC yang dibuat oleh `gcloud` berada di
profil lokal pengguna dan tidak boleh dipindahkan ke repository. Jika ADC atau
izin Vertex AI tidak tersedia, server tetap berjalan; endpoint AI mengembalikan
503 terstruktur sementara fitur non-AI tetap tersedia.

## Google Cloud API

Aktifkan API berikut pada project target:

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project PROJECT_ID
```

Perintah ini mengaktifkan layanan dan dapat memengaruhi billing. Jalankan hanya
pada project yang benar.

## Service account dan least privilege

Contoh membuat service account runtime khusus:

```bash
gcloud iam service-accounts create cyber-academy-runtime \
  --display-name="Cyber Academy Cloud Run runtime" \
  --project PROJECT_ID
```

Berikan role Vertex AI minimum:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:cyber-academy-runtime@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

Aplikasi juga memakai Firebase Authentication dan Firestore. Pertahankan role
runtime Firebase/Firestore yang memang sudah dibutuhkan aplikasi. Jangan
memberikan Owner, Editor, atau Vertex AI Admin. Pihak yang melakukan deployment
juga memerlukan izin untuk bertindak sebagai service account runtime
(`roles/iam.serviceAccountUser`) pada account tersebut; role ini untuk
deployer, bukan tambahan akses model bagi runtime.

## Cloud Run

Ganti nama service, region, dan project sesuai resource yang benar. Region
Cloud Run tidak harus sama dengan `GOOGLE_CLOUD_LOCATION`; contoh ini memakai
Cloud Run Jakarta dan endpoint model global.

```bash
gcloud run services update cyber-academy \
  --region asia-southeast2 \
  --project PROJECT_ID \
  --service-account cyber-academy-runtime@PROJECT_ID.iam.gserviceaccount.com
```

```bash
gcloud run services update cyber-academy \
  --region asia-southeast2 \
  --project PROJECT_ID \
  --update-env-vars AI_PROVIDER=vertex,GOOGLE_CLOUD_PROJECT=PROJECT_ID,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-2.5-flash,AI_REQUEST_TIMEOUT_MS=25000,AI_MAX_INPUT_CHARS=4000,AI_MAX_HISTORY_MESSAGES=12,AI_MAX_OUTPUT_TOKENS=800,AI_INSIGHT_MAX_OUTPUT_TOKENS=1400,AI_MAX_RETRIES=2
```

Cloud Run memperoleh credential dari service identity melalui metadata server
dan ADC. Tidak perlu API key Vertex, secret JSON, atau
`GOOGLE_APPLICATION_CREDENTIALS`.

Health check `/api/health` hanya membaca konfigurasi lokal:

```json
{
  "status": "ok",
  "ai": {
    "provider": "vertex",
    "configured": true
  }
}
```

Health check tidak memanggil model dan tidak menimbulkan biaya inferensi.

## Reliability dan cost control

- timeout default 25 detik per attempt;
- maksimal dua retry tambahan untuk 429, 500, 502, 503, 504, reset jaringan,
  timeout, dan capacity error sementara;
- exponential backoff dengan jitter;
- tidak retry untuk 400, 401, 403, 404, safety rejection, atau konfigurasi
  permanen yang salah;
- retry internal SDK dimatikan agar jumlah attempt dikendalikan aplikasi;
- output AI Tutor maksimal 800 token;
- structured output Learning Insight maksimal 1.400 token dan memakai batas
  terpisah agar perubahan Insight tidak memengaruhi AI Tutor;
- Learning Insight memeriksa `finishReason` sebelum parsing dan melakukan
  maksimal satu retry hanya untuk respons kosong atau terpotong;
- pertanyaan maksimal 4.000 karakter;
- history maksimal 12 message dan setiap message dipotong;
- konteks lesson, remedial, dan simulasi dipotong ke bagian yang relevan;
- quota Tutor per Firebase UID: 20 panggilan model per hari dengan cooldown;
- quota Insight per Firebase UID: 10 panggilan model per hari;
- request ID mencegah double-submit umum pada instance yang sama;
- penyimpanan exchange Firestore memakai document ID deterministik dari
  request ID sehingga retry persist tidak menggandakan user/assistant message.

Limiter harian berada di memory setiap instance Cloud Run. Untuk quota global
lintas instance yang benar-benar ketat, gunakan counter transaksional
Firestore/Redis pada iterasi terpisah setelah menilai biaya write dan
contention. Batas token, panjang input, dan IAM tetap berlaku pada semua
instance.

## Privacy dan safety

- Firebase ID Token wajib pada endpoint AI;
- UID diambil dari token server, bukan body;
- conversation history dengan ID hanya dibaca server setelah verifikasi owner;
- Firestore rules menolak akses langsung browser ke koleksi AI;
- password, token, API key, private key, dan recovery code ditolak;
- OTP dideteksi dan disanitasi sebelum dikirim ke model maupun disimpan;
- prompt injection dan permintaan siber operasional berbahaya ditolak lokal;
- system instruction, environment, access token, dan stack trace tidak
  dikembalikan ke browser;
- log error hanya memuat code/status, bukan prompt, token, credential, atau
  isi data sensitif;
- respons model diparse dengan try/catch, diperbaiki lokal satu kali untuk
  kasus aman, lalu divalidasi Zod sebelum dikirim atau disimpan.

## Automated test

Test tidak menggunakan internet, ADC, atau request Vertex AI asli. Provider
dimock.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Manual test

Gunakan OTP dan credential palsu, bukan data asli.

1. Login sebagai pengguna biasa.
2. Buka AI Tutor dan buat conversation.
3. Kirim pertanyaan aman, misalnya “Bagaimana mengenali email phishing?”.
4. Pastikan jawaban, suggested questions, dan safety status tampil.
5. Refresh halaman dan pastikan history tetap urut serta tidak duplikat.
6. Kirim pertanyaan dari panel AI pada lesson.
7. Buka Learning Insight dan minta refresh insight.
8. Uji input kosong; request harus ditolak tanpa memanggil model.
9. Uji input melebihi `AI_MAX_INPUT_CHARS`.
10. Uji “OTP: 123456”; angka harus disanitasi dan peringatan tampil.
11. Uji credential palsu seperti `password: contoh-rahasia`; request harus
    ditolak sebelum model.
12. Cabut sementara `GOOGLE_CLOUD_PROJECT` pada environment lokal lalu restart;
    endpoint AI harus 503, health menunjukkan `configured: false`.
13. Pastikan login, dashboard, lesson, progress, quiz, simulasi, badge,
    sertifikat, dan admin tetap dapat dibuka ketika AI unavailable.

### Pengujian manual Learning Insight

1. Login menggunakan akun pengujian.
2. Buka `/progress/insight`.
3. Pilih **Perbarui Analisis** dan pastikan Insight tampil dalam Bahasa
   Indonesia tanpa Markdown atau JSON mentah.
4. Refresh halaman dan pastikan Insight valid dibaca dari cache tanpa
   menggandakan data.
5. Pilih **Perbarui Analisis** kembali secara wajar dan pastikan hanya satu
   hasil terbaru yang tersimpan.
6. Uji akun dengan progress sedikit serta tanpa hasil kuis/simulasi.
7. Uji akun dengan progress, kuis, dan simulasi yang lebih banyak.
8. Pada environment pengujian, buat provider mock mengembalikan
   `finishReason=MAX_TOKENS`; pastikan UI menampilkan **Insight belum dapat
   diproses** dan tidak menampilkan JSON parsial.
9. Buat provider mock mengembalikan safety rejection; pastikan pesan safety
   berbeda dari pesan timeout atau format.
10. Cabut sementara konfigurasi Vertex pada environment pengujian lalu restart;
    pastikan pesan menyatakan AI Insight tidak tersedia dan fitur non-AI tetap
    dapat digunakan.
11. Pastikan AI Tutor utama tetap dapat menjawab dan riwayat chat tidak berubah.
12. Pastikan dashboard, lesson, progress, kuis, simulasi, badge, sertifikat,
    profil, dan admin tetap dapat dibuka.

## Troubleshooting

| Status/gejala | Pemeriksaan |
| --- | --- |
| 401 aplikasi | Pastikan Firebase ID Token valid dan belum revoked. |
| 401 Vertex | ADC/service identity tidak valid; cek akun aktif dan konfigurasi runtime. |
| 403 Vertex | Pastikan service account runtime memiliki `roles/aiplatform.user` pada project model. |
| 404 | Periksa `GEMINI_MODEL`, project, lokasi, serta ketersediaan model pada endpoint tersebut. |
| 429 | Periksa quota Vertex, quota aplikasi per UID, billing, dan lonjakan concurrency. |
| 500/502 | Periksa log Cloud Run berdasarkan error code, bukan data prompt. Coba revision sehat sebelumnya jika berulang. |
| 503 `AI_NOT_CONFIGURED` | Isi `AI_PROVIDER`, `GOOGLE_CLOUD_PROJECT`, lokasi, dan model lalu buat revision baru. |
| 503 provider | Periksa status Vertex AI, IAM, quota, dan error code terstruktur. Fitur non-AI tetap tersedia. |
| Timeout | Naikkan timeout secara hati-hati, kurangi context/history, dan periksa latency lokasi/model. |
| JSON invalid | Periksa log code `AI_INVALID_RESPONSE`; respons invalid tidak disimpan sebagai jawaban sukses. |

## Deployment verification

1. Jalankan seluruh test dan build.
2. Deploy revision baru tanpa memindahkan seluruh traffic bila workflow
   organisasi mendukung tag/canary.
3. Periksa `/api/health`.
4. Login akun pengujian dan jalankan checklist manual.
5. Periksa log 401/403/429/503 tanpa mencetak credential atau prompt sensitif.
6. Pindahkan traffic penuh hanya setelah history, Insight, dan fitur non-AI
   tervalidasi.

## Rollback

Source lama tetap tersedia pada ZIP baseline sebelum migrasi. Compatibility
provider `gemini-api` juga dipertahankan secara eksplisit, tetapi tidak menjadi
fallback otomatis.

Untuk rollback aplikasi Cloud Run, cari revision sehat:

```bash
gcloud run revisions list \
  --service cyber-academy \
  --region asia-southeast2 \
  --project PROJECT_ID
```

Kemudian arahkan traffic ke revision lama yang sudah diverifikasi:

```bash
gcloud run services update-traffic cyber-academy \
  --region asia-southeast2 \
  --project PROJECT_ID \
  --to-revisions REVISION_LAMA=100
```

Jangan menjalankan rollback, menghapus revision, mengubah IAM, atau menghapus
service tanpa persetujuan pemilik project.
