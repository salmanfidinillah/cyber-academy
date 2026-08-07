# Wireframe
# Cyber Academy AI

**Document:** Wireframe  
**Version:** 1.0  
**Status:** Ready for UI Design and Vibe Coding  
**Wireframe Type:** Low-Fidelity Responsive Wireframe  
**Visual Direction:** Friendly Pastel Neo-Brutalism  
**Frontend:** React + Vite + TypeScript + Tailwind CSS



---

## 1. Purpose

Dokumen ini menjadi acuan struktur tampilan Cyber Academy AI sebelum masuk ke high-fidelity design dan implementasi frontend.

Wireframe digunakan untuk:

- Menentukan posisi dan prioritas elemen.
- Menentukan CTA utama pada setiap halaman.
- Menjaga alur sesuai User Flow.
- Menentukan responsive behavior.
- Menjadi panduan pembuatan komponen React.
- Menentukan loading, empty, error, locked, success, dan disabled state.

Detail warna, font, border, hard shadow, icon, dan ilustrasi mengikuti [`../design-system.md`](../design-system.md).

---

## 2. Wireframe Principles

### 2.1 Mobile-First

- Konten utama satu kolom pada mobile.
- Tombol utama minimal 52 px.
- Tidak boleh ada horizontal overflow.
- Sidebar berubah menjadi drawer atau bottom navigation.
- Area baca lesson tetap nyaman.

### 2.2 One Primary Action

Setiap area hanya memiliki satu CTA utama.

```text
Primary   : Mulai Belajar
Secondary : Lihat Jalur Belajar
```

### 2.3 Clear Learning Direction

Pengguna selalu dapat melihat posisi, progress, reward, dan langkah berikutnya.

### 2.4 Progressive Disclosure

Pembahasan quiz, detail badge, requirement course, dan pengaturan lanjutan hanya ditampilkan saat diperlukan.

---

## 3. Global Layout

### 3.1 Public Desktop

```text
┌───────────────────────────────────────────────────────────────┐
│ LOGO   Beranda  Fitur  Jalur Belajar  FAQ  [Masuk] [Mulai]  │
├───────────────────────────────────────────────────────────────┤
│                        MAIN CONTENT                           │
├───────────────────────────────────────────────────────────────┤
│ FOOTER                                                        │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 User App Desktop

```text
┌───────────────┬──────────────────────────────────────────────┐
│ LOGO          │ Page Title                    🔔 Avatar      │
│ Dashboard     ├──────────────────────────────────────────────┤
│ Belajar       │                                              │
│ Simulasi      │               MAIN CONTENT                   │
│ AI Tutor      │                                              │
│ Progress      │                                              │
│ Badge         │                                              │
│ Sertifikat    │                                              │
│ Pengaturan    │                                              │
│ Keluar        │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

### 3.3 User App Mobile

```text
┌───────────────────────────────┐
│ LOGO              🔔 Avatar  │
├───────────────────────────────┤
│          MAIN CONTENT         │
├───────────────────────────────┤
│ Home Belajar AI Progress Profil│
└───────────────────────────────┘
```

---

## 4. Landing Page

**Route:** `/`  
**Priority:** Must Have

### Desktop

```text
┌────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                             │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ HERO ILLUSTRATION          │ │ [Belajar Aman di Era Digital]  │ │
│ │ Smartphone + Shield + AI   │ │ Belajar Cybersecurity,         │ │
│ │                            │ │ Lindungi Dunia Digitalmu       │ │
│ └────────────────────────────┘ │ Deskripsi singkat              │ │
│                                │ [Mulai Belajar dengan Google]  │ │
│                                │ Lihat Jalur Belajar →          │ │
│                                └─────────────────────────────────┘ │
│                                                                    │
│ [Materi Interaktif] [Simulasi Ancaman] [AI Tutor]                 │
├────────────────────────────────────────────────────────────────────┤
│ MENGAPA CYBER ACADEMY AI?                                         │
│ [Ilustrasi masalah] [Penjelasan solusi + CTA]                      │
├────────────────────────────────────────────────────────────────────┤
│ JALUR BELAJAR                                                      │
│ [Beginner] [Intermediate Preview] [Advanced Preview]               │
├────────────────────────────────────────────────────────────────────┤
│ CARA KERJA                                                         │
│ [Pilih Jalur] → [Belajar] → [Berlatih] → [Dapat Pencapaian]       │
├────────────────────────────────────────────────────────────────────┤
│ SIMULASI PHISHING PREVIEW                                          │
│ [Mock Email] [Penjelasan + Coba Simulasi]                          │
├────────────────────────────────────────────────────────────────────┤
│ AI TUTOR PREVIEW                                                   │
│ [User Question] [AI Answer] [Tanya AI Tutor]                       │
├────────────────────────────────────────────────────────────────────┤
│ GAMIFICATION: XP | Level | Badge | Sertifikat                      │
├────────────────────────────────────────────────────────────────────┤
│ FAQ                                                                │
├────────────────────────────────────────────────────────────────────┤
│ FINAL CTA: [Mulai Belajar Sekarang]                                │
├────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                             │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile

```text
┌───────────────────────────────┐
│ LOGO                     ☰   │
├───────────────────────────────┤
│ HERO ILLUSTRATION             │
│ [Belajar Aman di Era Digital] │
│ Heading                       │
│ Deskripsi                     │
│ [Mulai Belajar dengan Google] │
│ Lihat Jalur Belajar →         │
│ [Feature Card 1]              │
│ [Feature Card 2]              │
│ [Feature Card 3]              │
│ Section berikutnya ditumpuk   │
└───────────────────────────────┘
```

---

## 5. Authentication

### 5.1 Login

**Route:** `/auth/login`

```text
┌────────────────────────────┬──────────────────────────────┐
│ LOGIN ILLUSTRATION         │ Selamat Datang Kembali      │
│ Laptop + Shield + Lock     │ Email                       │
│                            │ [________________________]   │
│                            │ Password                    │
│                            │ [____________________ 👁]    │
│                            │ Lupa password?              │
│                            │ [Masuk]                     │
│                            │ -------- atau --------      │
│                            │ [Masuk dengan Google]       │
│                            │ Belum punya akun? Daftar    │
└────────────────────────────┴──────────────────────────────┘
```

Mobile berubah menjadi satu kolom dengan form sebagai fokus utama.

### 5.2 Register

**Route:** `/auth/register`

```text
┌────────────────────────────┬──────────────────────────────┐
│ REGISTER ILLUSTRATION      │ Buat Akun Baru              │
│ User + Shield + Book       │ Nama Lengkap                │
│                            │ Email                       │
│                            │ Password                    │
│                            │ Konfirmasi Password         │
│                            │ [✓ Terms dan Privacy]       │
│                            │ [Daftar]                    │
│                            │ [Daftar dengan Google]      │
└────────────────────────────┴──────────────────────────────┘
```

### 5.3 Forgot Password

```text
┌──────────────────────────────────────┐
│ ← Kembali ke Login                   │
│ Mail + Lock Illustration             │
│ Lupa Password?                       │
│ Email                                │
│ [________________________________]   │
│ [Kirim Link Reset]                   │
└──────────────────────────────────────┘
```

Success state menampilkan konfirmasi bahwa email reset telah dikirim.

---

## 6. Onboarding

**Route:** `/onboarding/*`

```text
┌────────────────────────────────────────────────────────────┐
│ LOGO                         Langkah 2 dari 5               │
│ [============== 40% =============================]         │
├────────────────────────────────────────────────────────────┤
│                 Apa tujuan belajarmu?                      │
│ [Melindungi akun pribadi]                                  │
│ [Belajar dasar cybersecurity]                              │
│ [Persiapan karier]                                         │
│ [Lewati]                                      [Lanjutkan] │
└────────────────────────────────────────────────────────────┘
```

Urutan:

```text
Welcome → Learning Goal → Skill Level → Interests
→ Daily Study Time → Recommendation Result
```

Recommendation result:

```text
[Celebration Illustration]
Jalur Belajar yang Cocok untukmu
[Beginner Cybersecurity Path]
4 Course · 180 menit
[Mulai Belajar]
[Ke Dashboard]
```

---

## 7. Dashboard

**Route:** `/dashboard`

### Desktop

```text
┌───────────────┬──────────────────────────────────────────────────────┐
│ Sidebar       │ Halo, Salman!                                      │
│               │                                                    │
│               │ [LANJUTKAN BELAJAR]                               │
│               │ Phishing dan Penipuan Digital                     │
│               │ [============ 50% ============]                    │
│               │ [Lanjutkan Materi]                                 │
│               │                                                    │
│               │ [250 XP] [Level 3] [Streak 4 Hari]                │
│               │                                                    │
│               │ [Daily Challenge] [Recommended Course]            │
│               │ [AI Learning Insight] [Latest Badge]              │
└───────────────┴──────────────────────────────────────────────────────┘
```

### Mobile

```text
[Greeting]
[Continue Learning Card]
[XP Card] [Level Card]
[Daily Challenge]
[Recommended Course]
[AI Insight]
[Latest Badge]
[Bottom Navigation]
```

States:

- Loading: skeleton cards.
- Empty: CTA ke Beginner Path.
- Error: tombol `Coba Lagi`.

---

## 8. Learning Paths

### 8.1 Path List

**Route:** `/learn/paths`

```text
[Jalur Belajar]
[Beginner Path — Progress 50% — Lanjutkan]
[Intermediate — Terkunci — Lihat Preview]
[Advanced — Terkunci]
```

### 8.2 Path Detail

**Route:** `/learn/paths/[pathSlug]`

```text
Breadcrumb
[Path Overview]
Title · Description · Course Count · Duration · Certificate
[============ 50% ============]
[Lanjutkan Course]

Course List:
1. Dasar Keamanan Siber        ✓ Selesai
2. Password dan Keamanan Akun  50%
3. Phishing Digital            Belum Dimulai
4. Privasi Data                🔒 Terkunci
```

---

## 9. Course Detail

**Route:** `/learn/courses/[courseSlug]`

```text
Breadcrumb
[Beginner] [Phishing]
Phishing dan Penipuan Digital
Description
45 menit · 3 lesson · +50 XP
[========== 33% ==========]
[Lanjutkan Materi]

Yang Akan Dipelajari
✓ Memahami phishing
✓ Mengenali pesan mencurigakan
✓ Menentukan tindakan aman

Daftar Materi
01 Apa Itu Phishing?             ✓ Selesai
02 Ciri-Ciri Pesan Phishing      [Lanjutkan]
03 Tindakan Aman                 🔒

[Quiz Akhir] [Simulasi Phishing]
```

---

## 10. Lesson Page

**Route:** `/learn/courses/[courseSlug]/lessons/[lessonSlug]`

### Desktop

```text
┌──────────────────────┬──────────────────────────────────────────────┐
│ COURSE CONTENT       │ Materi 2 dari 3                            │
│ ✓ Apa Itu Phishing   │ Ciri-Ciri Pesan Phishing                  │
│ ● Ciri-Ciri Phishing │ [============ 66% ============]           │
│ 🔒 Tindakan Aman     │                                            │
│                      │ TUJUAN                                     │
│                      │ Main lesson content                        │
│                      │ [Contoh Kasus Card]                        │
│                      │ [Tips Keamanan Card]                       │
│                      │ Key Takeaways                              │
│                      │ [← Sebelumnya] [Tandai Selesai →]         │
│                      │ [Tanya AI Tutor]                           │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Mobile

```text
← Course    Materi 2/3    ☰
Title
Progress
Objective
Main content
[Contoh Kasus]
[Tips Keamanan]
Key Takeaways
[Tanya AI Tutor]
[Tandai Selesai]
← Sebelumnya   Berikutnya →
```

---

## 11. Quiz

**Route:** `/learn/courses/[courseSlug]/quiz`

```text
Quiz Phishing                    Soal 2 dari 5
[============ 40% ============]

Manakah ciri utama pesan phishing?
[○ Menggunakan domain resmi]
[● Meminta OTP secara mendesak]
[○ Tidak meminta data pribadi]

[← Sebelumnya] [Selanjutnya →]
2 dari 5 pertanyaan terjawab
```

Submit modal:

```text
Kirim Jawaban?
Kamu telah menjawab 5 dari 5 soal.
[Kembali] [Kirim Jawaban]
```

---

## 12. Quiz Result

### Passed

```text
[Celebration Illustration]
Kamu Lulus!
Score: 80
Passing Score: 70
+30 XP · Badge Phishing Hunter
[Lihat Pembahasan] [Lanjutkan Course]
```

### Failed

```text
[Supportive Illustration]
Belum Lulus
Score: 60
Ulangi materi: Ciri-Ciri Pesan Phishing
[Ulangi Materi] [Coba Quiz Lagi]
```

---

## 13. AI Tutor

**Route:** `/ai-tutor`

### Desktop

```text
┌──────────────────┬───────────────────────────────────────────────┐
│ + Chat Baru      │ AI Tutor                Context: Lesson      │
│ Riwayat          │ [AI Welcome Message]                         │
│ • Phishing       │                         [User Message]       │
│ • Password       │ [AI Response]                                │
│                  │ • Periksa domain                             │
│                  │ • Waspadai bahasa mendesak                   │
│                  │ [Suggested Questions]                        │
│                  │ [Tulis pertanyaan...              ][Kirim]   │
│                  │ Disclaimer                                   │
└──────────────────┴───────────────────────────────────────────────┘
```

### Mobile

Conversation history menjadi drawer. Chat memakai satu kolom penuh.

States:

- Loading: “AI Tutor sedang menyiapkan jawaban...”
- Error: `Coba Lagi`.
- Rate limit: `Lanjutkan Belajar`.
- Safe refusal: penolakan singkat dan alternatif defensif.

---

## 14. Simulations

### 14.1 Simulation List

**Route:** `/simulations`

```text
Simulasi Keamanan
[Email Phishing — Beginner — 5 menit — +25 XP — Mulai]
[Scam Chat — Segera Hadir]
```

### 14.2 Phishing Scenario

```text
Simulasi Email Phishing       Langkah 1 dari 2
[============ 50% ============]

[Simulated Email]
From: security@bank-aman-login.xyz
Subject: Akun Anda Akan Diblokir
[Verifikasi Sekarang]

Menurutmu email ini:
[Aman] [Mencurigakan] [Phishing]
[Lanjutkan]
```

### 14.3 Indicator Selection

```text
[✓] Domain tidak resmi
[✓] Bahasa mendesak
[ ] Menggunakan logo
[✓] Meminta klik link
[Submit Analisis]
```

### 14.4 Result

```text
Analisis Tepat!
Score: 100 · +25 XP
Indikator Bahaya
Tindakan Aman
[Ulangi Simulasi] [Kembali ke Dashboard]
```

---

## 15. Progress

**Route:** `/progress`

```text
Progress Belajar
[Overall 35%] [Total XP 250] [Streak 4 Hari]

Progress Jalur Belajar
[Beginner Path — 50%]

Performa Quiz
[Rata-rata 78] [Lulus 3 dari 4]

[Topik Kuat: Password Security]
[Perlu Ditingkatkan: Phishing]

[AI Learning Insight]
[Generate Insight / Lihat Rekomendasi]

Riwayat XP
```

---

## 16. Daily Challenge

**Route:** `/daily-challenge`

```text
Tantangan Harian              Streak: 4 Hari
[Jangan Berikan OTP — +20 XP]
Pertanyaan
[Answer Options]
[Kirim Jawaban]
```

Completed state menampilkan XP dan streak terbaru.

---

## 17. Badges

**Route:** `/badges`

```text
Badge dan Pencapaian
[Semua] [Diperoleh] [Terkunci]

[First Step] [Phishing Hunter] [Quiz Master 🔒]
[Password Guard] [Privacy Protect] [Cyber Defender]
```

Badge detail modal menampilkan icon, deskripsi, dan tanggal diperoleh.

---

## 18. Certificates

### 18.1 Certificate List

**Route:** `/certificates`

```text
[Beginner Cybersecurity Path]
Status: Tersedia
[Preview] [Generate Sertifikat]

[Intermediate Path]
Status: Terkunci
```

### 18.2 Certificate Preview

```text
CERTIFICATE
Diberikan kepada
SALMAN FIDINILLAH
Telah menyelesaikan Beginner Cybersecurity Path
Tanggal
Certificate ID                         [QR CODE]

[Unduh PDF] [Salin Link Verifikasi]
```

### 18.3 Public Verification

**Route:** `/verify-certificate/[certificateId]`

```text
Sertifikat Valid
Nama
Learning Path
Tanggal
Certificate ID
[Kembali ke Cyber Academy AI]
```

---

## 19. Profile and Settings

### 19.1 Profile

**Route:** `/profile`

```text
[Avatar] Salman Fidinillah
Email · Level 3 · 250 XP
[Edit Profil]

[4 Badge] [2 Course] [1 Sertifikat]
Aktivitas Terbaru
```

### 19.2 Edit Profile

```text
Avatar [Upload]
Nama Tampilan [Input]
Bio [Textarea]
Tujuan Belajar [Dropdown]
Skill Level [Dropdown]
[Batal] [Simpan Perubahan]
```

### 19.3 Settings

Desktop memakai submenu kiri, sedangkan mobile memakai daftar menu:

```text
[Akun >]
[Preferensi Belajar >]
[Tampilan >]
[Privasi >]
[Hapus Akun >]
```

Delete account membutuhkan confirmation text dan tombol destructive.

---

## 20. Admin

### 20.1 Admin Dashboard

**Route:** `/admin`

```text
Sidebar Admin
[Total User] [Published Courses] [AI Requests]
Recent Activity
```

### 20.2 Course Management

```text
Courses                         [+ New Course]
[Search] [Level] [Status]
Table: Title | Level | Status | Actions
```

### 20.3 Course Form

```text
Title
Slug
Description
Learning Path · Level · Category
XP Reward · Duration · Order
Learning Outcomes
Status
[Cancel] [Save Draft] [Publish]
```

### 20.4 Lesson Editor

```text
Title
Objective
Markdown/Rich Text Editor
Security Tips
Key Takeaways
[Preview] [Save Draft] [Publish]
```

---

## 21. Global States

### Loading

- Page header skeleton.
- Card skeleton.
- Text skeleton.
- Button text: `Memuat...`, `Mengirim...`, atau `Menyimpan...`.

### Empty

- No course progress → CTA ke Beginner Path.
- No badge → CTA menyelesaikan materi.
- No certificate → CTA melihat progress.
- No AI conversation → CTA memulai chat.

### Error

```text
Network Error     → [Coba Lagi]
Unauthorized      → [Masuk Kembali]
Forbidden         → [Kembali ke Dashboard]
Not Found         → [Kembali ke Beranda]
Server Error      → [Coba Lagi]
```

---

## 22. Responsive Behavior

| Page | Desktop | Mobile |
|---|---|---|
| Landing | Hero dua kolom | Ilustrasi di atas |
| Auth | Ilustrasi + form | Form satu kolom |
| Dashboard | Sidebar + grid | Bottom nav + cards |
| Learning Paths | Large cards | Satu card per row |
| Course | Wide overview | Stacked content |
| Lesson | Sidebar + reading area | Drawer + full width |
| Quiz | Centered card | Full width |
| AI Tutor | History + chat | Single chat view |
| Progress | Multi-column | Stacked cards |
| Admin | Sidebar + table | Horizontal table scroll |

---

## 23. Component Mapping

| Wireframe Element | React Component |
|---|---|
| Primary CTA | `Button` |
| Feature Card | `FeatureCard` |
| Course Card | `CourseCard` |
| Lesson Row | `LessonItem` |
| Quiz Answer | `QuizOption` |
| Progress | `ProgressBar` |
| XP Summary | `XpIndicator` |
| Badge | `AchievementBadge` |
| AI Message | `AiMessage` |
| User Message | `UserMessage` |
| Suggested Question | `SuggestedQuestion` |
| Alert | `Alert` |
| Modal | `Modal` |
| Navbar | `PublicNavbar` |
| Sidebar | `AppSidebar` |
| Mobile Navigation | `MobileBottomNav` |
| Empty State | `EmptyState` |
| Error State | `ErrorState` |
| Loading | `Skeleton` |

---

## 24. MVP Page Priority

### Phase 1

```text
Landing
Login
Register
Dashboard
Learning Path
Course Detail
Lesson
Quiz
Quiz Result
AI Tutor
```

### Phase 2

```text
Simulation
Progress
Badge
Certificate
Profile
Settings
```

### Phase 3

```text
Daily Challenge
Certificate Verification
Admin Dashboard
Admin Course Form
Admin Lesson Editor
Admin Quiz Editor
```

---

## 25. Recommended Vibe Coding Order

```text
1. Design tokens
2. Global layout
3. Reusable UI components
4. Navbar dan sidebar
5. Landing page
6. Authentication
7. Dashboard shell
8. Learning path dan course
9. Lesson
10. Quiz dan result
11. AI Tutor
12. Simulation
13. Progress dan achievement
14. Certificate
15. Profile dan settings
16. Admin
```

---

## 26. General Vibe Coding Prompt

```text
Berdasarkan:
- ../prd.md
- ../sitemap.md
- ../user-flow.md
- ../design-system.md
- wireframe.md

Buat halaman [NAMA HALAMAN] saja.

Ikuti struktur wireframe yang sudah ditentukan.
Jangan mengubah hierarki informasi.
Jangan menambahkan section atau fitur baru.
Gunakan reusable React components.
Gunakan Friendly Pastel Neo-Brutalism.
Gunakan responsive mobile-first.
Sertakan loading, empty, error, disabled, hover, active, dan focus state yang relevan.
Jangan mengubah design tokens.
Jangan membuat halaman lain.
```

---

## 27. Prototype Flow

```text
Landing
→ Login
→ Dashboard
→ Learning Path
→ Course Detail
→ Lesson
→ AI Tutor
→ Complete Lesson
→ Quiz
→ Quiz Result
→ Badge
→ Simulation
→ Progress
→ Certificate
```

---

## 28. Review Checklist

### Navigation

- [ ] Public navigation jelas.
- [ ] Sidebar user jelas.
- [ ] Bottom navigation maksimal lima item.
- [ ] Breadcrumb tersedia.

### Layout

- [ ] Hero desktop dua kolom.
- [ ] Mobile satu kolom.
- [ ] Dashboard tidak terlalu padat.
- [ ] Lesson nyaman dibaca.
- [ ] Quiz memiliki pilihan besar.
- [ ] AI Tutor mudah digunakan.

### States

- [ ] Loading tersedia.
- [ ] Empty tersedia.
- [ ] Error tersedia.
- [ ] Locked tersedia.
- [ ] Success tersedia.
- [ ] Disabled tersedia.

### Responsive and Accessibility

- [ ] Tidak ada horizontal overflow.
- [ ] Sidebar berubah menjadi drawer.
- [ ] CTA mudah disentuh.
- [ ] Form memiliki label.
- [ ] Focus state terlihat.
- [ ] Status tidak hanya berdasarkan warna.

---

## 29. Definition of Done

Wireframe dianggap selesai apabila:

- Seluruh halaman MVP memiliki struktur.
- Desktop dan mobile layout telah ditentukan.
- CTA utama setiap halaman jelas.
- Loading, empty, error, locked, dan success state tersedia.
- Component mapping tersedia.
- User journey dapat diikuti dari landing page sampai certificate.
- Wireframe sesuai PRD, Sitemap, Information Architecture, User Flow, dan Design System.
- Dokumen dapat digunakan langsung sebagai konteks vibe coding.

---

## 30. Final Wireframe Summary

```text
Public Experience
→ Landing + Authentication

Learning Experience
→ Dashboard + Learning Path + Course + Lesson

Practice Experience
→ Quiz + Simulation + Daily Challenge

AI Experience
→ AI Tutor + Learning Insight

Achievement Experience
→ Progress + XP + Badge + Certificate

Management Experience
→ Profile + Settings + Admin
```

Wireframe ini memastikan setiap halaman memiliki tujuan, struktur, tindakan utama, dan perilaku responsif yang jelas sebelum implementasi frontend dimulai.
