# Cyber Academy AI — API Documentation


## 1. Overview

Backend Cyber Academy AI menyediakan katalog pembelajaran publik, state belajar server-authoritative, XP/level/streak, kuis, simulasi, badge, sertifikat, AI Tutor, AI Learning Insight, histori percakapan AI, serta operasi administrasi. Server juga menyajikan aplikasi Vite/React pada runtime yang sama.

| Item | Nilai terverifikasi |
| --- | --- |
| Production base URL | `https://siberaga.web.id` |
| Development base URL | `http://localhost:3000` secara default; dapat berubah melalui environment variable `PORT` yang valid |
| Prefix API | `/api` |
| Format utama | JSON (`application/json`) |
| Pengecualian format | Unduhan sertifikat menghasilkan `application/pdf`; beberapa error unduhan sertifikat berupa plain text |
| Batas JSON body | `64kb` untuk seluruh aplikasi Express |
| Jumlah endpoint aktif | 75 endpoint: 73 route modular, 1 health check, dan 1 unduhan PDF sertifikat |
| Versi API | Tidak ada version prefix seperti `/v1` |
| Pola autentikasi | Firebase ID token pada header `Authorization: Bearer ...` |
| Sumber waktu umum | Firestore server timestamp atau `Timestamp.now()`, diserialisasi sebagai ISO 8601 pada banyak read response |
| Timezone streak | `Asia/Jakarta` |

Endpoint API yang tidak cocok dengan route terdaftar tidak diteruskan ke SPA. Server mengembalikan:

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Endpoint API tidak ditemukan."
}
```

## 2. Technology and Architecture

Teknologi backend yang benar-benar ditemukan:

- Node.js runtime dengan TypeScript dan ESM source.
- Express 4 sebagai HTTP server dan router.
- Firebase Admin SDK untuk verifikasi Firebase Authentication ID token dan akses trusted ke Cloud Firestore.
- Firebase Client SDK pada frontend untuk login/register, pengelolaan akun, akses profil milik sendiri, dan upload avatar.
- Cloud Firestore sebagai database utama.
- Firebase Storage untuk avatar melalui Client SDK; tidak ada REST upload endpoint Express.
- Zod untuk validasi request body, path parameter tertentu, dan structured AI output.
- `express-rate-limit` untuk pembatasan katalog, mutation tertentu, dan endpoint sertifikat publik.
- `@google/genai` untuk AI. Implementasi mendukung provider `vertex` dan `gemini-api`; default konfigurasi adalah Vertex AI. Konfigurasi produksi dalam project menjelaskan Vertex AI dengan Application Default Credentials/service account Cloud Run.
- jsPDF dan QRCode untuk pembuatan PDF sertifikat.
- Vite dan esbuild untuk build frontend/server. Production menjalankan `node dist/server.cjs`.
- Cloud Run disebut dan dikonfigurasi sebagai target runtime pada project; server mendengarkan `0.0.0.0` dan environment variable `PORT`.

Arsitektur request utama:

1. Express menerima request dan menerapkan parser JSON maksimal 64 KB.
2. Route public langsung membaca data published dari Firestore.
3. Route protected memverifikasi Firebase ID token, termasuk pemeriksaan revoked token.
4. Route admin menambahkan pemeriksaan custom claim `admin === true`.
5. Service menjalankan validasi business rule, transaction/batch Firestore, dan audit logging bila relevan.
6. AI routes memanggil Google Gen AI SDK dengan JSON response schema, timeout, retry terbatas, safety filtering, quota in-memory, dan validasi output.

Tidak ada Firebase Admin Storage client pada backend dan tidak ada controller upload Express.

## 3. Authentication

### 3.1 Memperoleh Firebase ID token

Authentication pengguna berlangsung di frontend melalui Firebase Authentication, bukan melalui endpoint Express. Project menggunakan Email/Password dan Google Sign-In. Setelah berhasil login, frontend memperoleh token dengan:

```ts
getIdToken(auth.currentUser)
```

Token dikirim pada setiap protected request:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Client helper melakukan satu retry ketika server mengembalikan `401`: token dipaksa refresh dengan `getIdToken(user, true)`, lalu request dikirim ulang. Jika masih `401`, client melakukan sign-out dan meminta pengguna login kembali.

### 3.2 Verifikasi token backend

Middleware `authenticateUser`:

- mewajibkan tepat dua bagian header: literal `Bearer` dan token non-kosong;
- memanggil Firebase Admin `verifyIdToken(token, true)` sehingga revoked token diperiksa;
- mengambil `uid` dan email hanya dari decoded token;
- tidak menerima UID dari body atau query sebagai identitas pengguna;
- menetapkan status admin hanya jika custom claim `admin` bernilai boolean `true`.

Token hilang, malformed, invalid, expired, atau revoked menghasilkan:

```http
HTTP/1.1 401 Unauthorized

{
  "error": "Sesi tidak valid atau telah berakhir."
}
```

### 3.3 Authorization admin

Route admin memakai `requireAdmin`. Custom claim lain seperti `role: "admin"` tidak cukup; yang diterima hanya `admin: true`.

```http
HTTP/1.1 403 Forbidden

{
  "error": "Anda tidak memiliki akses."
}
```

Perubahan role admin melalui Admin API mengubah Firebase custom claims. Token pengguna yang sudah terbit mungkin perlu di-refresh sebelum claim baru terlihat pada request berikutnya.

### 3.4 Endpoint public

Endpoint berikut tidak memerlukan Firebase ID token:

- `GET /api/health`
- seluruh `GET /api/catalog/*`
- `GET /api/quizzes/course/:courseId`
- `GET /api/quizzes/:quizId/questions`
- `GET /api/simulations`
- `GET /api/badges`
- `GET /api/certificates/verify/:certificateCode`
- `GET /api/certificates/download/:certificateCode`

Semua endpoint lain memerlukan token pengguna; route `/api/admin/*` juga memerlukan custom claim admin.

### 3.5 Tidak ada REST authentication endpoint

Tidak ada endpoint Express `/login`, `/register`, `/logout`, `/password-reset`, atau `/token`. Operasi tersebut memakai Firebase Client SDK langsung. Karena itu, endpoint authentication yang tidak ada tidak didokumentasikan sebagai API backend.

## 4. General Conventions

### 4.1 Headers

| Header | Kapan diperlukan | Catatan |
| --- | --- | --- |
| `Authorization: Bearer <token>` | Semua protected/user/admin endpoint | Firebase ID token |
| `Content-Type: application/json` | Request dengan JSON body | Client helper menambahkannya otomatis untuk string body |
| `Accept: application/pdf` | Opsional pada download sertifikat | Response tetap PDF bila berhasil |

### 4.2 Status code

| Status | Penggunaan implementasi |
| --- | --- |
| `200 OK` | Mayoritas read, update, action, dan submission kuis |
| `201 Created` | Create admin content/quiz/question, submission simulasi, create conversation/exchange, generate certificate |
| `204 No Content` | Delete AI conversation |
| `400 Bad Request` | Zod/format validation, cursor tidak aman, jawaban tidak lengkap, business input invalid |
| `401 Unauthorized` | Token hilang/invalid/expired/revoked |
| `403 Forbidden` | Non-admin, profil tidak aktif, atau fitur belajar terkunci |
| `404 Not Found` | Resource tidak ada/tidak published, ownership disamarkan, atau route API tidak terdaftar |
| `409 Conflict` | Duplicate slug/order, resource punya child/history, eligibility belum terpenuhi, self-demotion, atau invariant sistem |
| `410 Gone` | Endpoint lesson slug global deprecated atau sertifikat revoked pada verifikasi publik |
| `413 Payload Too Large` | Input Tutor melebihi batas config; parser Express juga membatasi JSON 64 KB |
| `422 Unprocessable Entity` | AI Insight ditolak oleh safety provider |
| `429 Too Many Requests` | Rate limit/quota |
| `500 Internal Server Error` | Error server umum |
| `502 Bad Gateway` | Structured output AI tidak valid/terpotong/kosong |
| `503 Service Unavailable` | AI tidak terkonfigurasi, timeout, auth/permission/model/provider error |

### 4.3 Error body

Format umum:

```json
{ "error": "Pesan error" }
```

Validasi Zod pada beberapa route menambahkan `details`. AI Tutor menambahkan `code` dan `retryable`. AI Insight memakai envelope khusus:

```json
{
  "success": false,
  "error": {
    "code": "AI_INVALID_REQUEST",
    "message": "Data untuk membuat Insight tidak valid.",
    "retryable": false
  }
}
```

Error endpoint download sertifikat menggunakan plain text, bukan JSON.

### 4.4 Timestamp dan timezone

- Banyak response read mengubah Firestore `Timestamp` ke string ISO 8601 UTC.
- Streak menggunakan tanggal kalender `Asia/Jakarta` (`YYYY-MM-DD`).
- AI quota harian in-memory mengganti bucket berdasarkan tanggal UTC dari `new Date().toISOString().slice(0, 10)`.
- Immediate response dari beberapa create/update admin dibuat sebelum re-read Firestore. Nilai `createdAt`/`updatedAt` berasal dari server timestamp sentinel; lakukan GET ulang bila membutuhkan timestamp ISO final yang telah committed.

### 4.5 Pagination

Hanya endpoint berikut yang memiliki cursor pagination:

- `GET /api/me/xp-transactions`
- `GET /api/admin/learning-paths`
- `GET /api/admin/courses`
- `GET /api/admin/lessons`

List lain mengembalikan seluruh hasil query, kecuali Admin users dan audit logs yang memakai limit tanpa cursor.

### 4.6 Rate limiting

Rate limit berbasis IP dari `express-rate-limit`, kecuali quota AI yang berbasis UID dan disimpan in-memory.

| Cakupan | Batas |
| --- | --- |
| Semua `/api/catalog/*` | 300 request / 15 menit / IP |
| Complete lesson | 30 request / menit / IP |
| Reset learning state | 5 request / 15 menit / IP |
| Submit quiz | 10 request / 15 menit / IP |
| Check + submit simulation | limiter 20 request / menit / IP diterapkan pada kedua route mutation |
| Verify certificate | 100 request / 15 menit / IP |
| Download certificate PDF | 20 request / 15 menit / IP |
| AI Tutor | 20 request / UID / hari UTC, minimum interval 1,5 detik |
| AI Insight | 10 request / UID / hari UTC, minimum interval 2 detik |

Rate-limit response Express menyertakan standard rate-limit headers dan menonaktifkan legacy headers. Limiter simulation tidak menetapkan custom message, sehingga memakai default library response. Route lain yang tidak tercantum tidak memiliki limiter eksplisit di source.

## 5. Endpoint Inventory

| Domain | Public | User | Admin | Total |
| --- | ---: | ---: | ---: | ---: |
| Health | 1 | 0 | 0 | 1 |
| Catalog | 9 | 0 | 0 | 9 |
| Learning state, XP, level, streak | 0 | 4 | 0 | 4 |
| Quiz dan question | 2 | 4 | 10 | 16 |
| Simulation | 1 | 3 | 2 | 6 |
| Badge dan certificate | 3 | 6 | 4 | 13 |
| AI Tutor dan Learning Insight | 0 | 2 | 0 | 2 |
| AI conversation history | 0 | 5 | 0 | 5 |
| Admin content | 0 | 0 | 15 | 15 |
| Admin users, audit logs, stats | 0 | 0 | 4 | 4 |
| **Total** | **16** | **24** | **35** | **75** |

Catatan: badge/certificate public berjumlah tiga karena mencakup catalog badge, verifikasi sertifikat, dan download PDF.

## 6. Health Check

### `GET /api/health`

- Access: public.
- Parameter/body: tidak ada.
- Firestore: tidak diakses.
- AI provider: tidak melakukan generation; hanya melaporkan state konfigurasi saat startup.
- Rate limit: tidak ada limiter eksplisit.

Response `200`:

```json
{
  "status": "ok",
  "service": "cyber-academy-ai",
  "timestamp": "2026-08-01T12:00:00.000Z",
  "ai": {
    "provider": "vertex",
    "configured": true
  }
}
```

Jika konfigurasi AI invalid, health check tetap `200`; `ai.configured` menjadi `false` dan provider dapat bernilai `unavailable` atau nama provider yang berhasil diparse.

## 7. Public Catalog API

Semua endpoint pada bagian ini public, read-only terhadap katalog, dan terkena limit 300 request/15 menit/IP. Hanya item `published` yang dipublikasikan. Field internal `createdBy`, `updatedBy`, dan `searchTitle` dihapus dari catalog response.

| Method dan path | Input | Success | Error/behavior penting |
| --- | --- | --- | --- |
| `GET /api/catalog/learning-paths` | Tidak ada | `200`, array learning path; `courseCount` dan total `estimatedDuration` dihitung dari published courses; urut `order` | `500` bila query gagal. Koleksi: `learningPaths`, `courses`. Tidak dipaginasi. |
| `GET /api/catalog/learning-paths/:id` | Path `id` | `200`, satu published learning path dengan statistik course/durasi | `404` bila tidak ada atau tidak published; `500` query error. |
| `GET /api/catalog/learning-paths/:id/courses` | Path `id` learning path | `200`, array published course, urut `order` | Mengembalikan `[]` jika parent tidak ada/tidak published atau tidak punya course; `500` query error. |
| `GET /api/catalog/course-by-slug/:slug` | Path `slug` | `200`, satu published course | `404` bila course atau parent path tidak published/tidak ada; `500` query error. Slug course dicari global. |
| `GET /api/catalog/courses/:id` | Path `id` | `200`, satu published course | `404` bila course atau parent path tidak published/tidak ada; `500` query error. |
| `GET /api/catalog/courses/:courseId/lessons` | Path `courseId` | `200`, array published lesson, urut `order` | `[]` jika parent course/path tidak published atau tidak punya lesson; `500` query error. |
| `GET /api/catalog/courses/by-slug/:courseSlug/lessons/:lessonSlug` | Path `courseSlug`, `lessonSlug` | `200`, lesson published yang scoped ke course | `404` jika tidak ditemukan/tidak published; `500` query error. Ini endpoint slug lesson yang aktif. |
| `GET /api/catalog/lesson-by-slug/:slug` | Path diterima tetapi tidak dipakai | Tidak ada success resource | Selalu `410` dengan arahan memakai scoped course+lesson slug endpoint. |
| `GET /api/catalog/lessons/:id` | Path `id` | `200`, satu published lesson | `404` bila lesson/course/path tidak published/tidak ada; `500` query error. |

Response object mengikuti field Firestore yang tersimpan, ditambah `id`. Tanggal Firestore pada top-level object diserialisasi ISO. Catalog tidak menerapkan feature lock berbasis progress; lock ditegakkan pada mutation penyelesaian lesson dan submission kuis.

Response endpoint deprecated:

```json
{
  "error": "Endpoint global /lesson-by-slug/:slug telah didepresiasi. Gunakan /courses/by-slug/:courseSlug/lessons/:lessonSlug."
}
```

## 8. Learning State, XP, Level, and Streak

Seluruh endpoint memerlukan user token. UID selalu berasal dari decoded token.

### 8.1 `GET /api/me/progress`

- Query/body: tidak ada.
- Success `200`: `{ "progress": UserProgress[] }`.
- Koleksi: `userProgress`, filter `userId == uid`.
- Pagination: tidak ada.
- Side effect: tidak ada.
- Error: `401`; `500` dengan `{error}`.

`UserProgress` berisi field yang tersedia untuk tipe content terkait: `progressId`, `userId`, `contentType`, `contentId`, optional `learningPathId`/`courseId`, `status`, `progressPercent`, optional hitungan lesson, `startedAt`, optional `completedAt`, dan `updatedAt`.

### 8.2 `GET /api/me/xp-transactions`

| Input | Validasi |
| --- | --- |
| Query `limit` | Opsional, default 20; integer 1–50 |
| Query `cursor` | Opsional, ID dokumen maksimal 256 karakter; tidak boleh kosong, `/`, `\`, atau `..` |

Success `200`:

```json
{
  "transactions": [
    {
      "transactionId": "uid__lesson__lesson-id",
      "userId": "firebase-uid",
      "sourceType": "lesson_completion",
      "sourceId": "lesson-id",
      "amount": 15,
      "reason": "Menyelesaikan materi: Judul Lesson",
      "idempotencyKey": "uid__lesson__lesson-id",
      "createdAt": "2026-08-01T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

- Koleksi: `xpTransactions`, order `createdAt desc`.
- Cursor harus ada dan dimiliki UID yang sama. Cursor tidak ada menghasilkan `404`; cursor milik pengguna lain menghasilkan `400`.
- Invalid limit/cursor menghasilkan `400`.
- Tidak ada side effect.

### 8.3 `POST /api/me/lessons/:lessonId/complete`

- Path `lessonId`: 1–128 karakter, hanya `[A-Za-z0-9_-]`.
- Body: hanya plain empty object `{}`; body tidak dikirim juga diterima sebagai `{}`. Array, null, string, atau key tambahan ditolak `400`.
- Rate limit: 30/menit/IP.
- Success: `200`.

```json
{
  "lessonProgress": { "contentType": "lesson", "status": "completed", "progressPercent": 100 },
  "courseProgress": {
    "contentType": "course",
    "status": "in_progress",
    "progressPercent": 100,
    "lessonsCompleted": true
  },
  "pathProgress": { "contentType": "path", "status": "in_progress", "progressPercent": 0 },
  "xpEarned": 15,
  "alreadyCompleted": false,
  "totalXp": 115,
  "currentLevel": 2,
  "levelUp": true,
  "learningStreak": 3
}
```

Business rules dan side effect:

- Lesson, parent course, dan parent learning path harus ada dan `published`; selain itu `404`.
- Learning path sebelum current path harus berstatus progress `completed`; jika belum, `403`.
- Course sebelumnya dalam path yang sama harus berstatus progress `completed`; jika belum, `403`.
- Dokumen profil `users/{uid}` wajib ada; jika tidak, `404`.
- Menulis/merge tiga dokumen `userProgress`: lesson, course, path.
- Menulis satu `xpTransactions` untuk first completion dan memperbarui `users` (`totalXp`, `currentLevel`, streak, tanggal belajar, activity timestamps).
- Completion lesson idempoten melalui deterministic progress/XP document IDs. Request duplikat menghasilkan `xpEarned: 0`, `alreadyCompleted: true`, dan tidak menaikkan streak.
- Menyelesaikan semua lesson membuat `lessonsCompleted: true` dan course percent 100, tetapi status course tetap `in_progress` sampai kuis course lulus.
- Tidak ada bonus XP course/path pada endpoint ini.

Level threshold yang benar-benar diterapkan:

| XP | Level |
| ---: | ---: |
| 0–99 | 1 |
| 100–249 | 2 |
| 250–449 | 3 |
| 450–699 | 4 |
| ≥700 | 5 |

### 8.4 `POST /api/me/learning-state/reset`

Request:

```json
{ "confirmation": "RESET_MY_PROGRESS" }
```

- Schema strict; confirmation lain atau key tambahan menghasilkan `400`.
- Rate limit: 5/15 menit/IP.
- Memerlukan dokumen `users/{uid}`; jika tidak ada `404`.
- Menghapus seluruh `userProgress` dan `xpTransactions` milik UID.
- Mereset `totalXp`, `currentLevel`, `learningStreak`, tanggal belajar, dan `longestStreak` jika field tersebut ada.
- Transaction ditolak `409` bila jumlah progress + XP transaction + update profile melebihi 450 writes.
- Tidak menghapus quiz attempts/summaries, simulation attempts, badges, certificates, atau AI history.

Success `200`:

```json
{
  "success": true,
  "message": "Seluruh progres belajar telah berhasil direset."
}
```

## 9. Quiz and Question API

### 9.1 Public quiz read

| Method dan path | Input | Success | Error/Firestore |
| --- | --- | --- | --- |
| `GET /api/quizzes/course/:courseId` | Path `courseId` | `200`, published quiz tanpa answer key | `404` bila course/quiz tidak published/tidak ada; `500`. Koleksi `courses`, `quizzes`. |
| `GET /api/quizzes/:quizId/questions` | Path `quizId` | `200`, array `{id, quizId, courseId, questionText, options:[{id,text}], order}` | `404` bila quiz tidak published atau tidak ada published question; `500`. `correctOptionId`, explanation, dan recommended lesson tidak diekspos. |

Public read tidak memiliki pagination atau explicit rate limiter.

### 9.2 `POST /api/quizzes/:quizId/attempts`

- Access: user token.
- Rate limit: 10/15 menit/IP.
- Body strict:

```json
{
  "answers": {
    "question-id-1": "option-id-a",
    "question-id-2": "option-id-c"
  }
}
```

`answers` harus berisi 1–100 entries; question key maksimal 128 karakter dan option value maksimal 24 karakter.

Prerequisite dan validation:

- Profil `users/{uid}` harus ada dan `accountStatus === "active"`, jika tidak `403`.
- Quiz, course, dan learning path harus `published`, jika tidak `404`.
- Course progress harus memiliki `lessonsCompleted: true`, jika tidak `403`.
- Path sebelumnya dan course sebelumnya harus selesai, jika tidak `403`.
- Jumlah jawaban harus tepat sama dengan jumlah published questions.
- Setiap question ID dan option ID divalidasi terhadap data server.
- Score, pass/fail, explanation, dan XP dihitung server-side.

Success `200` memuat:

```json
{
  "attemptId": "attempt_xxxxxxxxx",
  "quizId": "quiz-id",
  "courseId": "course-id",
  "score": 80,
  "passed": true,
  "correctCount": 4,
  "totalQuestions": 5,
  "xpEarned": 30,
  "resultStatus": "passed",
  "incorrectQuestionIds": ["question-id-3"],
  "recommendedLessonIds": ["lesson-id"],
  "submittedAt": "2026-08-01T12:00:00.000Z",
  "review": [
    {
      "questionId": "question-id-1",
      "selectedOptionId": "option-id-a",
      "correctOptionId": "option-id-a",
      "explanation": "Penjelasan jawaban",
      "isCorrect": true
    }
  ]
}
```

`resultStatus`: score `<50` → `remedial_required`; score `<passingScore` → `almost_passed`; selain itu `passed`.

Side effect dan idempotency:

- Setiap submission membuat dokumen baru `quizAttempts`; submission bukan idempoten sebagai attempt.
- `quizSummaries/{uid}__quiz__{quizId}` di-merge untuk attempt count, best score, dan pass state.
- First pass saja memberi XP melalui deterministic `xpTransactions/{uid}__quiz__{quizId}`; repeated pass tidak memberi XP lagi.
- Pass menandai course progress `completed`, menghitung ulang path progress, dan dapat membuka course/path berikutnya.
- First pass memperbarui `users` XP, level, streak, dan activity timestamps.

### 9.3 User quiz history

| Method dan path | Input | Success | Catatan/error |
| --- | --- | --- | --- |
| `GET /api/me/quiz-attempts` | Optional query `quizId` | `200`, seluruh attempt milik UID, newest first | Tidak dipaginasi; filter string tidak divalidasi khusus. Koleksi `quizAttempts`. |
| `GET /api/me/quiz-attempts/:attemptId` | Path `attemptId` | `200`, attempt detail + review terkini | `404` bila tidak ada atau bukan milik UID. Review dibangun dari published questions saat request. |
| `GET /api/me/quiz-summaries/:quizId` | Path `quizId` | `200`, summary | Jika belum ada, tetap `200` dengan `attemptCount:0`, `bestScore:0`, `passed:false`, timestamps null. |

### 9.4 Admin quiz CRUD

Semua endpoint membutuhkan admin claim.

| Method dan path | Input | Success | Business rule/side effect |
| --- | --- | --- | --- |
| `GET /api/admin/quizzes` | Query optional `courseId`, `status` | `200 {items:[...]}` | Tidak dipaginasi. `status=all` diabaikan; nilai lain diteruskan sebagai equality filter. |
| `GET /api/admin/quizzes/:id` | Path `id` | `200` object | `404` jika tidak ada. |
| `POST /api/admin/quizzes` | Quiz create schema | `201` object | Parent course wajib ada (`400`); hanya satu quiz draft/published per course (`409`); tulis `quizzes`, `adminAuditLogs`. |
| `PATCH /api/admin/quizzes/:id` | Partial quiz schema | `200` object | `404`; parent course harus ada; perpindahan ditolak `409` jika target sudah punya quiz aktif; audit log. Empty `{}` diterima oleh partial Zod dan hanya mengubah metadata timestamp/audit. |
| `DELETE /api/admin/quizzes/:id` | Path `id` | `200` | Jika ada attempt, quiz diarsipkan (`{success:true, archived:true, message}`); jika tidak, questions dan quiz dihapus. Audit log. |

Quiz create schema:

| Field | Tipe/validasi |
| --- | --- |
| `courseId` | string trim, 1–128, required |
| `title` | string trim, 3–160, required |
| `description` | string trim, 5–2000, required |
| `passingScore` | integer 1–100, required |
| `xpReward` | integer 0–1000, required |
| `status` | `draft`/`published`/`archived`, default `draft` |

Schema strict; key tambahan menghasilkan `400 {error:"Validasi gagal", details:[...]}`. PATCH menerima subset field yang sama.

### 9.5 Admin question CRUD

| Method dan path | Input | Success | Business rule/side effect |
| --- | --- | --- | --- |
| `GET /api/admin/questions` | Optional query `quizId` | `200 {items:[...]}` | Tidak dipaginasi. |
| `GET /api/admin/questions/:id` | Path `id` | `200` object | `404` jika tidak ada. |
| `POST /api/admin/questions` | Question create schema | `201` object | Parent quiz wajib ada; course ID harus sama; option IDs unik; correct option harus ada; order unik per quiz; menaikkan `questionCount`; audit log. |
| `PATCH /api/admin/questions/:id` | Partial question schema | `200` object | Validasi option/correct option dan collision order; `404`. Implementasi menerima partial kosong. Jika client mengubah `quizId`/`courseId`, service tidak memindahkan counter antar quiz dan pengecekan order tetap berbasis quiz lama. |
| `DELETE /api/admin/questions/:id` | Path `id` | `200 {success:true, deletedId}` | Menurunkan `questionCount` parent quiz jika ada; audit log. |

Question create schema:

| Field | Tipe/validasi |
| --- | --- |
| `quizId`, `courseId` | string trim 1–128, required |
| `questionText` | string trim 5–2000 |
| `options` | array 2–6 item `{id:string 1–24, text:string 1–500}` |
| `correctOptionId` | string 1–24; harus cocok dengan option |
| `explanation` | string trim 5–3000 |
| `recommendedLessonId` | optional nullable string maksimal 128 |
| `order` | positive integer |
| `status` | `draft`/`published`/`archived`, default `draft` |

## 10. Simulation API

### 10.1 `GET /api/simulations`

- Public, tanpa pagination dan tanpa explicit rate limiter.
- Success `200`: array simulation published dari `simulations`, berisi metadata seperti `id`, `simulationId`, `title`, `slug`, `type`, `description`, `xpReward`, `passingScore`, `status`, `scenarioCount`, dan timestamps.
- Side effect penting: sebelum membaca, service memastikan empat default simulation document ada. Dokumen yang belum ada dibuat otomatis. Private answer key tidak ditulis ke Firestore oleh initializer.
- Error `500` bila operasi gagal.

### 10.2 `GET /api/me/simulation-attempts`

- User token.
- Optional query `simulationId`: harus cocok regex `[A-Za-z0-9_-]{1,100}`.
- Success `200`: array attempt milik UID, newest first.
- Koleksi: `simulationAttempts`.
- Tidak dipaginasi; tidak ada side effect.
- Invalid query `400` dengan Zod details.

### 10.3 `POST /api/simulations/:simulationId/check`

- User token; limiter 20/menit/IP.
- Path `simulationId`: `[A-Za-z0-9_-]{1,100}`.
- Body strict:

```json
{ "scenarioId": "phish-bank", "actionId": "report" }
```

- Success `200`: `{scenarioId, selectedActionId, correctActionId, isCorrect, explanation, risk, tip}`.
- Tidak menulis Firestore dan tidak memberi XP.
- `404` bila simulation/scenario tidak ada; `400` untuk invalid input.

### 10.4 `POST /api/simulations/:simulationId/attempts`

- User token; limiter 20/menit/IP.
- Success `201`.
- Dua body contract diterima.

Modern:

```json
{
  "answers": {
    "scenario-id": "action-id"
  },
  "elapsedSeconds": 120
}
```

`answers` memiliki 1–30 entries; key/value mengikuti ID regex. `elapsedSeconds` optional integer 0–86400. Answer map tidak harus memuat seluruh scenario; missing answer dinilai salah.

Legacy phishing:

```json
{
  "classification": "Phishing",
  "selectedIndicators": ["domain pengirim tidak resmi", "bahasa mendesak"]
}
```

`classification`: `Aman`/`Mencurigakan`/`Phishing`; indicators 1–10 string, masing-masing 2–100 karakter.

Prerequisite/side effect:

- Simulation harus ada dan `published`; profil harus ada dan active.
- Score dihitung dari server answer definition, bukan nilai dari client.
- Setiap request membuat `simulationAttempts` baru dan merge `userProgress/{uid}__simulation__{simulationId}`.
- First successful pass saja memberi XP melalui deterministic transaction ID; repeated pass tetap membuat attempt tetapi `xpEarned:0` dan `alreadyRewarded:true`.
- First reward memperbarui `users` total XP, level, streak, dan tanggal belajar.

Response berisi `attempt`, `review`, `passed`, `xpEarned`, `levelUp`, `currentLevel`, `totalXp`, `learningStreak`, `alreadyRewarded`, `bestScore`, dan `attemptsCount`. Legacy response juga menambahkan `correctClassification` dan `correctIndicators`.

### 10.5 Admin simulation

| Method dan path | Input | Success | Side effect/error |
| --- | --- | --- | --- |
| `GET /api/admin/simulations` | Tidak ada | `200`, semua active/inactive simulation | Memanggil default initializer; tidak dipaginasi. |
| `PATCH /api/admin/simulations/:simulationId` | Partial strict object | `200`, updated simulation | Minimal satu field; `404`; menulis `simulations` + `adminAuditLogs`. |

Allowed patch fields: `title` string 2–120, `description` 2–500, `status` draft/published/archived, `xpReward` integer 0–500, `passingScore` integer 0–100.

## 11. Badge and Certificate API

### 11.1 Badge endpoints

| Method dan path | Access | Input | Success dan side effect |
| --- | --- | --- | --- |
| `GET /api/badges` | Public | Tidak ada | `200`, empat active canonical badge. Memastikan definisi badge canonical ada/benar dan menandai badge lain inactive+deprecated; jadi GET ini dapat menulis `badges`. |
| `GET /api/me/badges` | User | Tidak ada | `200`, active canonical awards milik UID dari `userBadges`; legacy award disaring. |
| `GET /api/me/badges/progress` | User | Tidak ada | `200`, progress empat badge dari server-side catalog/progress/quiz/simulation data. Dapat menulis canonical `badges` saat memastikan definisi. |
| `POST /api/me/badges/evaluate` | User | Empty object saja | `200 {success:true, userBadges, progress}`; client-supplied progress ditolak `400`; membuat eligible awards secara idempoten dan audit logs. |
| `GET /api/admin/badges` | Admin | Tidak ada | `200`, active dan legacy badge, setelah canonicalization. |
| `PATCH /api/admin/badges/:badgeId` | Admin | Partial title/description/status/order; minimal satu | `200` object; `404`/`409`; audit log. |

Badge evaluation menggunakan koleksi `learningPaths`, `courses`, `lessons`, `quizzes`, `simulations`, `userProgress`, `quizSummaries`, `simulationAttempts`, `badges`, `userBadges`, dan `adminAuditLogs`.

Award idempoten memakai document ID `${uid}__badge__${badgeId}` dan idempotency key `badge_award:${uid}:${badgeSlug}`. Badge tidak memberi XP.

Empat badge canonical:

| Badge | Requirement |
| --- | --- |
| Beginner Master | Seluruh published course/lesson pada `beginner-path` selesai dan semua published quiz lulus |
| Intermediate Master | Persyaratan yang sama pada `intermediate-path` |
| Advanced Master | Persyaratan yang sama pada `advanced-path` |
| Simulation Defender | Semua simulation configured yang published memiliki setidaknya satu passed attempt |

Admin tidak dapat menonaktifkan atau mengubah metadata canonical empat badge utama (`409`) dan tidak dapat mengaktifkan kembali legacy badge (`409`).

### 11.2 Certificate user endpoints

| Method dan path | Input | Success | Prerequisite/side effect |
| --- | --- | --- | --- |
| `GET /api/me/certificates` | Tidak ada | `200`, semua certificate milik UID, newest first | Koleksi `certificates`; tidak dipaginasi. |
| `GET /api/me/certificates/eligibility/:learningPathId` | ID regex `[A-Za-z0-9_-]{1,120}` | `200`, eligibility object | Path harus published (`404`). Membandingkan path progress, completed courses, passed quizzes, dan lesson counts. |
| `POST /api/me/certificates` | `{learningPathId, recipientName?}` strict | `201 {success:true, certificate}` | Wajib eligible; profil active; membuat atau memperbarui deterministic certificate per UID+path. |

Eligibility response:

```json
{
  "learningPathId": "beginner-path",
  "learningPathTitle": "Beginner",
  "lessonsCompleted": 12,
  "totalLessons": 12,
  "coursesCompleted": 4,
  "totalCourses": 4,
  "quizzesPassed": 4,
  "totalQuizzes": 4,
  "isEligible": true
}
```

Certificate generation:

- `learningPathId` ID regex; `recipientName` optional 2–100 chars.
- Jika nama tidak diberikan, service mencoba Firebase Auth display name, lalu Firestore display name, lalu fallback.
- HTML tags dihapus dan nama dipotong 100 karakter.
- Belum eligible → `409`; profil inactive/tidak ada → `403`.
- Document ID `${uid}__path__${learningPathId}` membuat operasi idempoten per path. Repeated create pada active certificate memperbarui `recipientName`, mengembalikan certificate yang sama dengan `alreadyGenerated:true`, dan tetap berstatus HTTP `201`.
- Certificate revoked tidak dapat dibuat ulang (`409`).
- Certificate menyimpan verification hash dan `pdfPath`, tetapi data sensitif tersebut tidak diekspos oleh public verify response.

### 11.3 Public certificate verification and download

#### `GET /api/certificates/verify/:certificateCode`

- Public; 100 request/15 menit/IP.
- Format code: `CYBER-YYYY-XXXXXX`, enam karakter alfanumerik, case-insensitive dan dinormalisasi uppercase.
- `400` invalid format; `404` tidak ditemukan; `410` jika tidak active.
- Koleksi: `certificates`, query `certificateCode`.

Success `200` hanya memuat safe fields:

```json
{
  "success": true,
  "status": "Sertifikat Valid",
  "recipientName": "Nama Peserta",
  "learningPathTitle": "Beginner",
  "issuedAt": "2026-08-01T12:00:00.000Z",
  "certificateCode": "CYBER-2026-A1B2C3",
  "issuer": "Cyber Academy AI",
  "certStatus": "active"
}
```

#### `GET /api/certificates/download/:certificateCode`

- Public; 20 request/15 menit/IP.
- Format code sama.
- `200 application/pdf` dengan `Content-Disposition: attachment; filename="Sertifikat_CyberAcademy_<code>.pdf"`.
- PDF dibuat saat request, berisi recipient, learning path, issued date, code, dan QR ke `/verify/certificate/:code` pada host request.
- `400` invalid format atau revoked; `404` tidak ditemukan; `500` gagal membuat PDF. Error body plain text.

### 11.4 Admin certificate

| Method dan path | Input | Success | Side effect |
| --- | --- | --- | --- |
| `GET /api/admin/certificates` | Tidak ada | `200`, seluruh certificates, newest first | Tidak dipaginasi; object admin mencakup stored fields. |
| `PATCH /api/admin/certificates/:certificateId/status` | `{status:"active"|"revoked"}` strict | `200`, updated certificate | `404`; mengatur `revokedAt`/`revokedBy`; audit log. |

## 12. AI Tutor and AI Learning Insight

Kedua endpoint membutuhkan user token. Provider default `vertex`; implementation juga mendukung `gemini-api`. Provider menggunakan JSON response schema, timeout default 25 detik, output validation, dan retry provider maksimum dua kali untuk error retryable. AI tidak mengubah XP, progress, badge, atau certificate.

### 12.1 `POST /api/ai/tutor`

Request body strict:

| Field | Tipe/validasi |
| --- | --- |
| `message` | required string trim 1–20000; juga dibatasi config `AI_MAX_INPUT_CHARS`, default 4000 |
| `contextType` | optional `general`/`lesson`/`remedial`/`simulation` |
| `learningPathTitle`, `courseTitle`, `lessonTitle` | optional string max 500 |
| `lessonSummary` | optional string max 20000; prompt dipotong 2500 |
| `quizIncorrectTopics` | optional array max 20, item max 1000; prompt memakai maksimal 8×300 |
| `simulationDetails` | optional unknown; JSON prompt dipotong 1200 |
| `history` | optional max 50 item `{role:user|assistant, content:max 4000}` |
| `conversationId` | optional ID regex `[A-Za-z0-9_-]{1,128}` |
| `requestId` | optional UUID |

Jika `conversationId` diberikan, server memuat history yang dimiliki UID dari Firestore dan menggunakan history terverifikasi tersebut sebagai pengganti `history` client. Conversation milik user lain/tidak ada menghasilkan `404`.

Success `200`:

```json
{
  "answer": "Jawaban defensif dan edukatif.",
  "summary": "Ringkasan singkat.",
  "suggestedQuestions": ["Pertanyaan lanjutan?"],
  "safetyStatus": "safe",
  "requiresOfficialHelp": false,
  "warningMsg": "Opsional bila OTP disanitasi"
}
```

Safety behavior:

- Credential/password/API key/private key/token/recovery code terdeteksi → `400`, code `SENSITIVE_DATA_DETECTED`.
- OTP/kode verifikasi 4–8 digit disensor menjadi `[SENSITIVE_OTP_REMOVED]`; response dapat memuat warning.
- Prompt injection atau harmful request yang cocok pola → tetap `200`, tetapi response `blocked_and_redirected`; provider dan quota tidak dipakai.
- AI config tidak tersedia → `503 AI_NOT_CONFIGURED`.
- Input melampaui config → `413 AI_INPUT_TOO_LONG`.
- Invalid model JSON/schema → `502 AI_INVALID_RESPONSE`.

Quota/idempotency:

- 20 provider requests/UID/hari UTC, minimum interval 1,5 detik.
- `requestId` membuat in-memory deduplication key `${uid}:tutor:${requestId}` selama 60 detik. Concurrent/repeated request pada instance yang sama menerima Promise/result yang sama.
- Quota dan dedup bukan persistent/distributed; restart atau instance Cloud Run lain memiliki state sendiri.
- Endpoint Tutor tidak otomatis menulis conversation/messages. Persistence tersedia melalui AI history endpoints terpisah.

### 12.2 `POST /api/ai/insight`

Body strict:

```json
{
  "completedLessonsCount": 20,
  "quizScores": [
    { "courseId": "course-id", "score": 80, "passed": true, "incorrectTopics": [] }
  ],
  "simulationResults": [
    { "simulationId": "phishing-email", "classification": "Phishing", "score": 90, "passed": true }
  ],
  "overallProgress": 50,
  "requestId": "00000000-0000-4000-8000-000000000000"
}
```

Validation route:

- `completedLessonsCount`: required integer 0–10000.
- `quizScores`: optional array unknown max 100, default `[]`; hanya tiga item terakhir dipakai dan field disanitasi/clamp.
- `simulationResults`: optional array unknown max 100, default `[]`; hanya tiga terakhir dipakai.
- `overallProgress`: required number 0–100.
- `requestId`: optional UUID.

Data Insight berasal dari body client untuk analisis saja; endpoint tidak membaca atau menulis progress Firestore. Output tidak mengubah state belajar.

Success `200`:

```json
{
  "summary": "Ringkasan maksimal dua kalimat pendek.",
  "strongTopics": [{ "topic": "Phishing", "reason": "Didukung skor kuis." }],
  "improvementTopics": [{ "topic": "Password", "reason": "Masih perlu diperkuat." }],
  "recommendations": [
    { "type": "lesson", "id": "lesson-id", "title": "Judul", "reason": "Alasan" }
  ],
  "studyTip": "Tips belajar singkat.",
  "confidence": "medium"
}
```

- Maksimal dua strong topics, dua improvement topics, dan dua recommendations.
- 10 requests/UID/hari UTC, minimum interval 2 detik.
- `requestId` dedup in-memory 60 detik dengan key UID+insight.
- Structured generation menggunakan token limit Insight terpisah (default 1400).
- Empty/truncated response dapat dicoba ulang satu kali pada level Insight formatting.
- Error khusus: `422 AI_INSIGHT_SAFETY_REJECTED`; `502` untuk empty/truncated/invalid format/schema; `503` timeout/config/provider.

## 13. AI Conversation History

Semua endpoint berada di `/api/me/ai`, membutuhkan user token, dan menggunakan ownership check. Tidak ada pagination atau explicit rate limiter.

| Method dan path | Input | Success | Side effect/error |
| --- | --- | --- | --- |
| `GET /api/me/ai/conversations` | Tidak ada | `200`, conversation milik UID, newest `lastMessageAt` first | Koleksi `aiConversations`. |
| `POST /api/me/ai/conversations` | Conversation create body | `201`, created object | Membuat `aiConversations`; timestamps dari `Timestamp.now()`. |
| `DELETE /api/me/ai/conversations/:conversationId` | ID regex 1–128 | `204`, no body | Menghapus conversation dan messages dengan batch; `404` ownership; `409` jika >450 messages. |
| `GET /api/me/ai/conversations/:conversationId/messages` | ID regex | `200`, messages oldest first | Ownership `404`; koleksi `aiMessages`. |
| `POST /api/me/ai/conversations/:conversationId/exchanges` | Exchange body | `201 {success:true}` | Membuat user+assistant message dan update conversation timestamps. |

Conversation create body strict:

```json
{
  "contextType": "lesson",
  "title": "Diskusi Phishing",
  "learningPathId": "beginner-path",
  "courseId": "course-id",
  "lessonId": "lesson-id"
}
```

`contextType` required; `title` 2–120; tiga context ID optional dan mengikuti regex `[A-Za-z0-9_-]{1,128}`.

Exchange body strict:

```json
{
  "userContent": "Pertanyaan pengguna",
  "assistantContent": "Jawaban assistant yang sudah dihasilkan",
  "safetyStatus": "safe",
  "requestId": "00000000-0000-4000-8000-000000000000"
}
```

- `userContent`: 1–4000; `assistantContent`: 1–20000.
- `safetyStatus`: `safe`, `caution`, `blocked_and_redirected`, atau `insufficient_context`.
- Content dikirim oleh client; endpoint ini tidak memanggil AI provider.
- Optional UUID `requestId` memberi persistent idempotency: deterministic SHA-256-derived IDs untuk pasangan message. Retry dengan key sama tidak menduplikasi data; collision lintas exchange menghasilkan `409`.

## 14. Admin Content API

Seluruh `/api/admin/learning-paths`, `/courses`, dan `/lessons` memerlukan user token dengan `admin: true`. Mutation memakai Firestore transaction, menjaga parent counters, dan menulis `adminAuditLogs`.

### 14.1 Shared list query

| Query | Behavior |
| --- | --- |
| `status` | Optional `draft`/`published`/`archived`; `all` berarti tanpa filter; nilai lain `400` |
| `search` | Optional prefix search case-insensitive melalui `searchTitle` |
| `limit` | Optional; default 20; service clamp 1–50. Route memakai `parseInt`; invalid text jatuh ke default |
| `cursor` | Optional document ID; bila dokumen ada, query `startAfter`; bila tidak ada, cursor diabaikan |
| `learningPathId` | Filter tambahan untuk courses |
| `courseId` | Filter tambahan untuk lessons |

List response:

```json
{
  "items": [],
  "nextCursor": null
}
```

### 14.2 Learning path endpoints

| Method dan path | Success | Error/side effect |
| --- | --- | --- |
| `GET /api/admin/learning-paths` | `200 {items,nextCursor}` | Filters/pagination di atas. |
| `GET /api/admin/learning-paths/:id` | `200` object | `404` bila tidak ada. |
| `POST /api/admin/learning-paths` | `201` object | Slug auto-normalized; duplicate slug `409`; menulis path + audit. |
| `PATCH /api/admin/learning-paths/:id` | `200` object | Empty body `400`; duplicate slug `409`; publish/archive action dicatat. |
| `DELETE /api/admin/learning-paths/:id` | `200 {success:true,deletedId}` | `404`; `409` jika masih memiliki course; audit. |

Learning path request fields:

| Field | Create | Validasi/default |
| --- | --- | --- |
| `title` | Required | trim 3–120 |
| `slug` | Optional | max 120; default dari title lalu normalize |
| `description` | Optional | max 2000, default empty |
| `shortDescription` | Optional | max 300; service fallback dari description |
| `level` | Optional | string max 50, default `Beginner` |
| `estimatedDuration` | Optional | nonnegative integer, default 60 |
| `thumbnailURL` | Optional/default empty | max 500; empty atau HTTP/HTTPS URL |
| `status` | Optional | draft/published/archived, default draft |
| `order` | Optional | nonnegative integer, default 0 |
| `xpReward` | Optional | nonnegative integer; service default 300 |
| `badgeName`, `bgColor` | Optional | max 100 / max 50 |

PATCH memakai subset schema yang sama dan strict.

### 14.3 Course endpoints

| Method dan path | Success | Error/side effect |
| --- | --- | --- |
| `GET /api/admin/courses` | `200 {items,nextCursor}` | Optional `learningPathId` plus shared filters. |
| `GET /api/admin/courses/:id` | `200` object | `404`. |
| `POST /api/admin/courses` | `201` object | Parent path wajib ada (`400`); slug course unik global (`409`); menaikkan parent `courseCount`; audit. |
| `PATCH /api/admin/courses/:id` | `200` object | Empty `400`; parent/slug validation; bila pindah path, update kedua counter dan `learningPathId` semua child lessons; audit. |
| `DELETE /api/admin/courses/:id` | `200 {success:true,deletedId}` | `409` jika masih punya lessons; menurunkan parent count; audit. |

Course fields: required `learningPathId` string nonempty dan `title` 3–120. Optional `slug` max120, `description` max2000, `shortDescription` max300, `category` max100 default General, `level` max50 default beginner, `estimatedDuration` nonnegative integer default30, `thumbnailURL` empty/HTTP(S), `status`, `order`, nonnegative `xpReward` (service default50), serta `learningOutcomes` max20 item masing-masing max300. Schema strict; PATCH menerima subset.

### 14.4 Lesson endpoints

| Method dan path | Success | Error/side effect |
| --- | --- | --- |
| `GET /api/admin/lessons` | `200 {items,nextCursor}` | Optional `courseId` plus shared filters. |
| `GET /api/admin/lessons/:id` | `200` object | `404`. |
| `POST /api/admin/lessons` | `201` object | Parent course wajib ada (`400`); slug unik hanya di dalam course (`409`); derives `learningPathId`; menaikkan `lessonCount`; audit. |
| `PATCH /api/admin/lessons/:id` | `200` object | Empty `400`; parent/slug validation; pindah course memperbarui kedua counter dan derived path; audit. |
| `DELETE /api/admin/lessons/:id` | `200 {success:true,deletedId}` | Menurunkan parent `lessonCount`; audit. |

Lesson fields: required `courseId` nonempty dan `title` 3–120. Optional `slug` max120, `summary` max1000, `objective` max1000, `content` max50000, `contentType` max50, `estimatedDuration` nonnegative integer, `status`, `order`, nonnegative `xpReward`, `exampleCase {title:max150, description:max1000}`, `securityTips` max20×300, dan `keyTakeaways` max20×300. Service defaults duration 10 dan XP 15. Schema strict; client tidak dapat menetapkan `learningPathId` langsung.

## 15. Admin Users, Audit Logs, and Statistics

Semua endpoint membutuhkan `admin: true`.

### 15.1 `GET /api/admin/users`

- Query `limit`: coerced integer 1–500, default 100.
- Success `200`: array, bukan `{items}`.
- Firebase Auth `listUsers` digabung dengan Firestore `users` profile.
- Field: `uid`, `email`, `displayName`, `role`, `accountStatus`, `totalXp`, `currentLevel`, `createdAt`, `lastSignInAt`.
- Role diprioritaskan dari custom claim admin; account status dari Firebase disabled atau profile.
- Tidak ada cursor pagination; hanya page pertama dari Firebase Auth listUsers sesuai limit.

### 15.2 `PATCH /api/admin/users/:uid`

- Path UID: trim, 1–128.
- Body strict, minimal satu:

```json
{
  "role": "admin",
  "accountStatus": "active"
}
```

- Role: `user`/`admin`; status: `active`/`disabled`.
- Admin tidak boleh menurunkan role sendiri atau menonaktifkan diri sendiri (`409`).
- Target tidak ada `404`.
- Mengubah Firebase Auth disabled state/custom claims, merge `users` role/status, dan menulis `adminAuditLogs`.
- Success `200`: updated combined user record.

### 15.3 `GET /api/admin/audit-logs`

- Query `limit`: coerced integer 1–100, default 50.
- Success `200`: array latest logs, order `createdAt desc`.
- Koleksi `adminAuditLogs`.
- Tidak ada cursor pagination.

### 15.4 `GET /api/admin/stats`

Success `200`:

```json
{
  "learningPaths": 3,
  "coursesPublished": 25,
  "lessonsPublished": 79,
  "quizzesCount": 25,
  "simulationAttempts": 0,
  "activeCertificates": 0
}
```

Angka dihitung dengan Firestore count aggregation. `learningPaths` dan `quizzesCount` menghitung semua status; courses/lessons hanya published; certificates hanya active.

## 16. Profile, Settings, Authentication, and Upload: Non-REST Integrations

Audit tidak menemukan Express endpoint untuk profile pengguna, settings, authentication, atau upload/storage. Implementasi sebenarnya:

| Capability | Implementasi | Security boundary |
| --- | --- | --- |
| Register Email/Password | Firebase Auth Client SDK; membuat profile `users/{uid}` langsung via Firestore Client SDK dan mengirim email verification | Firebase Auth + Firestore rules |
| Login Email/Password/Google | Firebase Auth Client SDK | Firebase Auth authorized domains/providers |
| Password reset, verify email, change email/password | Firebase Auth Client SDK | Firebase reauthentication/verification |
| Read/update own profile & onboarding | Firestore Client SDK langsung pada `users/{uid}` | Rules hanya owner; writable fields di-whitelist |
| Upload avatar | Firebase Storage Client SDK ke `users/{uid}/avatar/{filename}` | Owner-only write, public read, `<2 MiB`, MIME JPEG/PNG/WEBP |

Frontend juga memvalidasi avatar maksimal 2 MB dan tipe `image/jpeg`, `image/png`, atau `image/webp`, lalu menyinkronkan download URL ke Firebase Auth profile dan Firestore profile.

Ini bukan API Express pada `https://siberaga.web.id/api`, sehingga tidak ada method/path REST yang dapat didokumentasikan untuk capability tersebut.

## 17. Firestore Collections and Ownership

| Collection | Digunakan oleh | Akses Client SDK |
| --- | --- | --- |
| `users` | Profile, XP/level/streak, admin users | Owner boleh get/create/update field tertentu; backend Admin SDK untuk protected stats/access |
| `learningPaths` | Catalog/admin/lock/achievement | Denied; backend only |
| `courses` | Catalog/admin/progress/quiz/achievement | Denied; backend only |
| `lessons` | Catalog/admin/completion/achievement | Denied; backend only |
| `userProgress` | Lesson/course/path/simulation progress | Denied; backend only |
| `xpTransactions` | XP ledger/idempotency | Denied; backend only |
| `quizzes` | Quiz catalog/admin/submission | Denied; backend only |
| `questions` | Public safe questions/admin/scoring | Denied; backend only |
| `quizAttempts` | Attempt history | Denied; backend only |
| `quizSummaries` | Best score/pass state | Denied; backend only |
| `simulations` | Simulation metadata/admin | Denied; backend only |
| `simulationAttempts` | Attempt history/achievement | Denied; backend only |
| `badges` | Canonical badge catalog | Denied; backend only |
| `userBadges` | Badge awards | Denied; backend only |
| `certificates` | Certificate generation/verify/download | Denied; backend only |
| `aiConversations` | User AI conversations | Denied; backend only |
| `aiMessages` | User/assistant history | Denied; backend only |
| `adminAuditLogs` | Mutation audit | Denied; backend only |

Firestore rules menerapkan default deny untuk collection lain. Firebase Admin SDK melewati client security rules, sehingga endpoint Express harus mengandalkan token middleware, ownership checks, Zod validation, dan service business rules.

## 18. Idempotency Summary

| Operation | Idempotency implementation |
| --- | --- |
| Complete lesson | Deterministic lesson progress dan XP transaction IDs; XP hanya sekali |
| Pass quiz | Attempt selalu baru; first-pass XP deterministic per UID+quiz |
| Submit simulation | Attempt selalu baru; reward deterministic per UID+simulation |
| Evaluate badge | Deterministic userBadge doc per UID+badge |
| Generate certificate | Deterministic certificate doc per UID+learning path; repeated active call updates name |
| Save AI exchange | Persistent deterministic pair hanya jika UUID `requestId` diberikan |
| AI Tutor/Insight request | In-memory dedup 60 detik hanya jika UUID `requestId` diberikan; instance-local |
| Admin CRUD | Tidak mendukung idempotency key; duplicate constraints ditangani dengan transaction/conflict rules |

## 19. Locking and Prerequisites

- Published status diperlukan untuk catalog exposure, lesson completion, quiz submission, certificate eligibility, dan simulation submission.
- Learning paths diurutkan berdasarkan `order`, lalu document ID sebagai tie-breaker. Path sebelumnya harus selesai sebelum lesson/quiz pada path berikutnya.
- Courses diurutkan berdasarkan `order` (lesson service juga memakai document ID tie-breaker; quiz path course sorting hanya memakai order). Course sebelumnya harus `completed`.
- Course menjadi `completed` ketika quiz lulus; 100% lesson saja tidak cukup.
- Quiz terkunci sampai seluruh lesson course selesai (`lessonsCompleted: true`).
- Certificate membutuhkan path progress completed, semua published courses completed, dan quiz tiap course passed.
- Badge path lebih ketat: setiap required course harus memiliki published lessons dan published quizzes, semua lesson selesai, semua quiz lulus, dan course progress completed.
- Simulation tidak tergantung learning path/course; profil active dan simulation published adalah prerequisite.

## 20. Verified Implementation Constraints

- Tidak ada OpenAPI/Swagger route atau schema generator pada project.
- Tidak ada CORS middleware; frontend dan API diasumsikan same-origin atau ditangani oleh deployment layer.
- Tidak ada global API rate limiter; hanya route yang disebut pada bagian rate limiting.
- Banyak list endpoint tidak memiliki pagination: progress, quiz attempts, simulations, badges, certificates, AI history, admin quizzes/questions/certificates/simulations.
- AI quota dan request dedup tersimpan di memory process, bukan Firestore/Redis, sehingga tidak konsisten lintas instance dan hilang saat restart.
- `GET /api/simulations` dan badge catalog/progress reads dapat melakukan write untuk memastikan default/canonical definitions.
- Reset learning state tidak menghapus seluruh histori gamification/assessment; hanya `userProgress`, `xpTransactions`, dan field learning aggregate pada profile.
- Public certificate verify menyembunyikan `userId`, email, dan `verificationHash`; admin/owner certificate list mengembalikan stored certificate object.
- Firebase Storage avatar adalah client-direct integration, bukan backend upload endpoint.

---

Dokumentasi ini mencakup hanya route yang benar-benar dipasang oleh `server.ts`. Route SPA wildcard tidak dihitung sebagai API, dan endpoint yang hanya disebut dalam komentar/dokumentasi lama tetapi tidak terdaftar tidak dimasukkan.
