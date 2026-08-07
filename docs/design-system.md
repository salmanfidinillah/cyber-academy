# Design System Cyber Academy AI

## 1. Pengantar

Design system ini dibuat sebagai catatan tentang pola visual yang benar-benar dipakai di Cyber Academy AI. Isinya disusun dari audit source project final, terutama `src/index.css`, `src/components/LandingPage.css`, komponen dasar `NeoButton`, `NeoCard`, dan `NeoBadge`, serta halaman landing, autentikasi, dashboard, jalur belajar, lesson, simulasi, badge, sertifikat, pengaturan, dan admin.

Tujuannya sederhana: ketika ada halaman atau fitur yang dikembangkan lagi, tampilannya tidak berjalan sendiri-sendiri. Warna, font, border, jarak, tombol, dan feedback sebaiknya mengikuti pola yang sudah dikenal pengguna.

Pengguna Cyber Academy AI berasal dari tingkat pemula sampai lanjutan. Karena itu tampilannya dibuat ramah dan mudah dipindai, tetapi tetap tegas saat menunjukkan status seperti selesai, terkunci, berhasil, atau gagal.

Dokumen ini menggambarkan kondisi project saat diaudit. Beberapa halaman masih memakai nilai warna langsung atau pola lama yang sedikit berbeda. Perbedaan tersebut tetap dicatat supaya dokumen ini tidak memberi gambaran yang lebih rapi daripada implementasi aslinya.

## 2. Prinsip Desain

### Ramah untuk pemula

Cybersecurity sering terlihat berat dan menakutkan. Project ini mengimbanginya dengan warna pastel, bahasa antarmuka yang langsung, ilustrasi, serta bentuk card yang mudah dikenali. Pengguna tetap mendapat tanda bahaya ketika diperlukan, tetapi keseluruhan halaman tidak dibuat gelap atau penuh simbol ancaman.

### Jelas dan mudah dibaca

Teks utama memakai warna hampir hitam, sedangkan teks penjelas memakai abu-abu gelap. Heading dipisahkan dari body melalui jenis font, ukuran, dan weight. Pada halaman lesson, lebar bacaan dibatasi `max-w-[52rem]` dan line-height dibuat longgar agar materi tidak melelahkan.

### Modern tanpa dekorasi berlebihan

Border hitam, shadow tanpa blur, sedikit rotasi, dan animasi pendek memberi karakter pada tampilan. Dekorasi dipakai untuk membantu hierarchy, bukan untuk menutup isi. Contohnya, bentuk abstrak pada hero diletakkan di belakang konten dan diberi `aria-hidden="true"`.

### Konsisten di beberapa ukuran layar

Layout dibangun mulai dari satu kolom, kemudian bertambah pada breakpoint `sm`, `md`, atau `lg`. Tombol yang berjajar di desktop sering berubah menjadi `w-full` di mobile. Sidebar desktop juga diganti menjadi topbar dan drawer agar layar kecil tidak dipaksa meniru desktop.

### Visual keamanan yang tidak menakutkan

Simbol perisai, gembok, bot, dan peringatan tetap digunakan karena sesuai dengan materi. Namun simbol tersebut ditempatkan pada card pastel, bentuk rounded, dan ilustrasi sederhana. Hasilnya masih terasa sebagai aplikasi belajar, bukan dashboard pemantauan ancaman.

### Fungsi lebih penting daripada hiasan

State aktif, terkunci, selesai, error, dan loading selalu perlu dibaca lebih dulu daripada dekorasi. Shadow dan animasi hover boleh memperkuat interaksi, tetapi tidak boleh menjadi satu-satunya penanda. Teks, ikon, warna, serta atribut aksesibilitas sebaiknya bekerja bersama.

## 3. Identitas Visual

Gaya utama Cyber Academy AI adalah friendly neo-brutalism. Bentuknya terlihat dari border hitam setebal 2–4 px, shadow solid yang bergeser ke kanan bawah, card dengan sudut membulat, dan warna pastel yang cukup berani. Gaya ini paling jelas pada landing page, dashboard, jalur belajar, simulasi, lesson, badge, dan sertifikat.

Sudut card umumnya berada di sekitar 12–24 px. Card penting seperti hero dashboard, panel CTA, atau header simulasi dapat memakai radius 24–28 px. Chip dan badge memakai `rounded-full`. Walaupun border tegas, rounded corner menjaga tampilan tetap ramah.

Ilustrasi landing page dibuat langsung sebagai komponen React dan SVG di `src/components/Illustrations.tsx`. Bentuk ponsel, perisai, AI Tutor, preview phishing, XP, badge, dan sertifikat menggunakan bahasa visual yang sama dengan UI: pastel, border hitam, dan shadow sederhana.

Hijau mint menjadi warna pengenal utama. Biru dipakai sebagai penyeimbang pada hero landing, dashboard, panel AI, status informasi, dan area admin. Kuning, peach, serta ungu membantu membedakan kelompok card, tetapi sebaiknya tidak semuanya dimasukkan ke satu card sekaligus.

## 4. Palet Warna

Token utama berada di `src/index.css`. Landing page menambah warna lokal melalui `src/components/LandingPage.css`. Beberapa halaman badge dan sertifikat masih memakai HEX langsung yang sedikit berbeda dari token utama.

| Nama Warna | Nilai HEX / CSS | Penggunaan |
|------------|-----------------|------------|
| Brand Background | `#F7F4EE` / `bg-brand-bg` | Latar dasar halaman dan hero landing |
| Brand Surface | `#FFFDF8` / `bg-brand-surface` | Card, navbar, sidebar pengguna, footer, dan panel utama |
| Brand Text | `#111111` / `text-brand-text` | Teks utama, ikon, isi tombol, dan elemen kontras tinggi |
| Brand Muted | `#4F4F4F` / `text-brand-muted` | Deskripsi, metadata, helper text, dan teks sekunder |
| Brand Border | `#111111` / `border-brand-border` | Border utama dan warna shadow neo-brutalist |
| Pastel Mint | `#B8F1D5` / `bg-pastel-mint` | Warna utama, primary button, state selesai, progress, dan active sidebar pengguna |
| Pastel Blue | `#B9DDFC` / `bg-pastel-blue` | Warna sekunder, informasi, dashboard, AI panel, dan active sidebar admin |
| Pastel Yellow | `#FFE28A` / `bg-pastel-yellow` | Highlight, warning ringan, header drawer, filter aktif, dan card pendukung |
| Pastel Peach | `#FFC4AC` / `bg-pastel-peach` | Peringatan, studi kasus, simulasi, serta card pendukung |
| Pastel Lavender | `#D8C8FF` / `bg-pastel-lavender` | Badge, gamifikasi, dan variasi card pendukung |
| Pastel Green | `#D7F2B2` / `bg-pastel-green` | Lampu/status kecil pada ilustrasi |
| Pastel Red | `#FFB8B8` / `bg-pastel-red` | Destructive button, close button, error, dan logout |
| Pastel Orange | `#FFD0A8` / `bg-pastel-orange` | Warna pendukung yang hanya dipakai terbatas |
| Pastel Gray | `#E5E2DB` / `bg-pastel-gray` | State terkunci, placeholder, dan elemen netral |
| Landing Blue Soft | `#DCEEFF` / `var(--landing-blue-soft)` | Shell ilustrasi hero, band biru, footer landing, dan hover link landing |
| Landing AI Background | `#E7F3FF` | Latar section preview AI Tutor |
| Admin Page Background | `#F8F9FA` | Latar halaman admin pada `AdminShell.tsx` |
| Admin Sidebar Background | `#F0F4F8` | Sidebar dan drawer admin |
| Success khusus verifikasi | `#E6F4EA` dengan teks `#137333` | Pesan berhasil pada `VerifyEmailPage.tsx` |
| Error khusus verifikasi | `#FCE8E6` dengan teks `#C5221F` | Pesan gagal pada `VerifyEmailPage.tsx` |
| Badge Mint lama | `#B4F0D2` | Header dan badge tertentu pada `BadgeList.tsx` serta sertifikat |
| Badge Yellow lama | `#FFE696` | Badge, filter, dan sertifikat pada halaman lama |
| Badge Blue lama | `#B4E0FA` | Badge Intermediate |
| Badge Lavender lama | `#D6C8FF` | Badge Advanced dan halaman sertifikat |

Hijau dipakai sebagai identitas utama karena paling sering muncul pada branding, primary action, progress, state selesai, dan navigasi aktif pengguna. Pemakaiannya tidak harus memenuhi seluruh layar. Pada landing page, biru muda mengambil area yang cukup besar agar halaman tidak terasa hanya berisi satu warna hijau.

Warna pastel dipakai per kelompok informasi. Satu card biasanya memiliki satu warna dasar, lalu memakai putih untuk panel di dalamnya. Border dan teks tetap hitam supaya warna latar tidak mengurangi keterbacaan.

Untuk status, pola yang paling mudah dipertahankan adalah mint untuk berhasil atau selesai, kuning/peach untuk peringatan, merah pastel untuk error atau aksi berbahaya, dan biru untuk informasi. Status tetap perlu teks atau ikon; warna saja tidak cukup.

Catatan audit: warna badge dan sertifikat belum sepenuhnya memakai token `@theme`. Ada juga class `bg-pastel-pink` pada beberapa halaman admin dan `CourseDetail.tsx`, tetapi token `pastel-pink` tidak dideklarasikan di `src/index.css`. Class tersebut jangan dijadikan acuan baru sebelum tokennya dipastikan.

## 5. Typography

Project mengimpor **Fredoka** dan **Nunito Sans** dari Google Fonts di `src/index.css`. Fredoka dipakai sebagai `font-heading`, sedangkan Nunito Sans menjadi `font-sans` dan font body global. `font-mono` juga muncul pada ID, kode, label teknis, dan metadata kecil; font ini memakai stack monospace bawaan Tailwind karena tidak ada font monospace khusus yang didefinisikan.

| Elemen | Font | Ukuran | Weight | Penggunaan |
|--------|------|--------|--------|------------|
| Hero heading | Fredoka | `text-[clamp(2.55rem,8.8vw,4.8rem)]` | `font-bold` | Judul utama landing page |
| Section heading landing | Fredoka | CSS `clamp(1.9rem,5.8vw,2.75rem)` | `700` | Judul section landing dengan `line-height: 1.08` |
| Judul halaman | Fredoka | Umumnya `text-3xl sm:text-4xl` | `font-bold` atau `font-extrabold` | Dashboard, jalur belajar, progress, badge, dan halaman lain |
| Judul lesson | Fredoka | `text-3xl sm:text-4xl` | `font-extrabold` | Judul materi pada `LessonReader.tsx` |
| Judul card | Fredoka | `text-lg`, `text-xl`, atau `text-2xl` | `font-bold` / `font-extrabold` | Card course, dashboard, simulasi, dan panel |
| Body utama | Nunito Sans | `text-sm sm:text-base` | `font-medium` / `font-semibold` | Deskripsi, materi, dan penjelasan |
| Body lesson | Nunito Sans | `text-[0.98rem] sm:text-base` | `font-medium` | Isi bacaan, memakai `leading-[1.8]` |
| Metadata | Nunito Sans | `text-[10px]`, `text-xs`, atau `text-sm` | Biasanya `font-bold` | XP, durasi, kategori, helper text, dan status kecil |
| Label teknis / kode | Stack monospace | `text-[10px]` sampai `text-sm` | `font-bold` | ID, kategori, kode, dan blok kode |
| Teks tombol | Fredoka | `text-xs` hingga `text-lg` sesuai size | `font-bold` | Semua variant `NeoButton` |

Heading tidak perlu selalu memakai ukuran terbesar. Hierarchy di project lebih sering dibentuk dari kombinasi ukuran dan weight. `font-extrabold` banyak dipakai untuk judul halaman atau angka statistik, sedangkan paragraf memakai `font-medium` atau `font-semibold`.

Huruf tebal sebaiknya dipakai untuk judul, label, nilai penting, dan tindakan. Jika seluruh paragraf dibuat `font-bold`, pembaca akan kesulitan membedakan bagian yang benar-benar penting. Untuk materi panjang, pola `font-medium` dengan `leading-relaxed` atau `leading-[1.8]` lebih sesuai.

## 6. Spacing dan Layout

Project memakai skala spacing Tailwind. Nilai yang paling sering muncul adalah `2`, `3`, `4`, `5`, dan `6`, atau sekitar 0,5 rem sampai 1,5 rem. Pola ini cukup konsisten walaupun tidak ditulis sebagai token spacing terpisah.

Card dasar `NeoCard` memakai `p-5 sm:p-6`, jadi padding bergerak dari 1,25 rem di layar kecil ke 1,5 rem mulai breakpoint `sm`. Card yang lebih besar sering memakai `p-6 sm:p-8`. Komponen padat seperti chip, baris navigasi, dan input memakai `p-2`, `p-3`, atau `px-3 py-2.5`.

Landing page memakai jarak section `py-16 sm:py-20`, yaitu 4 rem pada mobile dan 5 rem mulai `sm`. Kontennya berada di `max-w-7xl` dengan padding horizontal `px-4 sm:px-6`. Jarak grid umumnya `gap-5` sampai `gap-7`.

Shell aplikasi memakai padding `p-3.5 sm:p-6`. Lebar konten berubah sesuai kebutuhan halaman:

- landing dan AI Tutor: sampai `max-w-7xl`;
- dashboard: sampai `max-w-[1500px]`;
- progress dan admin: umumnya `max-w-6xl`;
- jalur belajar dan course: `max-w-5xl` atau `max-w-7xl`;
- lesson: `max-w-[52rem]`;
- autentikasi: `max-w-md`.

Grid dibuat dari satu kolom terlebih dahulu. Landing feature berubah menjadi dua kolom di `sm` dan tiga kolom di `lg`. Jalur belajar menjadi tiga kolom di `md`. Dashboard memakai dua kolom untuk statistik kecil, tiga di `sm`, dan enam di `xl`; bagian konten utama baru dibagi dua di `lg`.

Mobile tidak sekadar mengecilkan desktop. Sidebar hilang, tombol menu tampil di topbar, card action menjadi lebar penuh, grid kembali ke satu kolom, dan drawer AI lesson menjadi selebar layar. Pada tabel admin, overflow horizontal diletakkan pada pembungkus card agar halaman utama tidak ikut melebar.

Pencegahan horizontal overflow dilakukan dari beberapa arah: `overflow-x: hidden` pada `html, body`, `overflow-x-clip` pada shell, `min-w-0` pada item flex/grid, `max-w-full` pada media dan form control, serta `overflow-wrap:anywhere` untuk teks panjang. Blok kode dan tabel lesson boleh scroll secara lokal karena isinya memang dapat lebih lebar dari area baca.

## 7. Border, Radius, dan Shadow

Border hitam adalah elemen yang paling konsisten. Ketebalannya dibagi berdasarkan tingkat kepentingan:

- 1 px untuk pemisah kecil atau detail dalam card;
- 2 px untuk input, chip, progress bar, dan panel di dalam card;
- 3 px untuk card, tombol, ikon utama, dan drawer;
- 4 px untuk batas navbar, sidebar, hero, section band, atau card utama.

Radius yang sering dipakai adalah `rounded-lg` (8 px), `rounded-xl` (12 px), `rounded-2xl` (16 px), serta nilai langsung seperti `rounded-[20px]`, `rounded-[22px]`, `rounded-[24px]`, dan `rounded-[28px]`. Badge, avatar bulat, dan progress bar memakai `rounded-full`.

Shadow neo-brutalist tidak memakai blur. Nilai dasar dari `src/index.css` adalah:

```css
.neo-shadow-sm { box-shadow: 3px 3px 0 0 #111111; }
.neo-shadow    { box-shadow: 5px 5px 0 0 #111111; }
.neo-shadow-lg { box-shadow: 8px 8px 0 0 #111111; }
```

Contoh kombinasi yang dipakai card dasar:

```tsx
className="neo-border rounded-[20px] p-5 sm:p-6 bg-brand-surface neo-shadow"
```

Shadow dipakai pada card utama, tombol, elemen aktif, preview, dan panel mengambang. Panel kecil di dalam card, input, deskripsi, atau tabel padat sering cukup memakai border tanpa shadow. Jangan memberi setiap elemen shadow besar karena hierarchy akan hilang.

Hover interaktif biasanya menggeser elemen sedikit ke atas dan memperbesar offset shadow. Active state bergerak ke kanan bawah sambil mengecilkan shadow sehingga terasa seperti tombol ditekan.

## 8. Komponen Utama

### 8.1 Button

Komponen utama berada di `src/components/NeoButton.tsx`. Variant yang tersedia adalah `primary`, `secondary`, `yellow`, `peach`, `lavender`, `destructive`, `ghost`, dan `mint`. `primary` dan `mint` sama-sama memakai `bg-pastel-mint`; secondary memakai putih, destructive memakai merah pastel, sedangkan ghost transparan tanpa border dan shadow utama.

Ukuran `sm`, `md`, dan `lg` mengatur padding, ukuran teks, dan radius. Button menggunakan Fredoka, teks hitam, focus ring hitam, hover naik sedikit, serta active state yang mengurangi shadow. Disabled state menurunkan opacity, mengganti cursor, dan menahan transform.

Loading state tidak diatur otomatis oleh `NeoButton`. Halaman pemakai mengganti label seperti “Sedang Memproses...” atau menambahkan ikon `RefreshCw`/`Loader2` yang berputar. Pola ini harus disertai `disabled` agar tindakan tidak terkirim dua kali.

Icon button berbentuk persegi dengan ukuran yang berbeda menurut konteks. Tombol menu topbar memakai `size-11` atau 44 px, close button drawer `size-10` atau 40 px, sedangkan toggle sidebar desktop `size-8` atau 32 px. Untuk aksi sentuh utama, pola 44 px (`min-h-11` atau `min-height: 2.75rem`) lebih aman. Ukuran 32–40 px sebaiknya hanya dipakai pada kontrol padat dan tetap memiliki label aksesibel.

Ada utility `.neo-button` di `src/index.css` yang menetapkan tinggi minimum 2,75 rem dan border 2 px. Utility ini dipakai pada bagian simulasi, sedangkan `NeoButton` memakai `neo-border` 3 px. Jadi saat ini belum ada satu ukuran minimum yang dipaksakan ke semua tombol.

### 8.2 Card

`NeoCard.tsx` menjadi card dasar dengan border 3 px, radius 20 px, padding responsif, background surface, dan pilihan shadow `sm`, `md`, atau `lg`. Prop `interactive` menambahkan pola hover/active yang sama dengan tombol.

Card informasi memakai satu warna dasar pastel dan konten ringkas. Card progress menambahkan angka besar, label kecil, dan progress bar. Course card menampilkan nomor, status, deskripsi, XP, progress, serta aksi. Card dashboard lebih padat dan memakai warna berbeda untuk memisahkan statistik, misi aktif, AI Insight, badge, dan sertifikat.

Landing page memiliki card yang sedikit lebih ekspresif: radius 20–22 px, border 3 px, shadow 5–6 px, dan hover yang menaikkan card. Hero serta preview dapat memakai shadow 8–9 px karena menjadi pusat perhatian.

Empty state biasanya berupa card putih atau pastel dengan border solid/dashed, ikon, judul singkat, penjelasan, dan satu aksi yang jelas. Contohnya ada di `Dashboard.tsx`, `BadgeList.tsx`, dan `ProgressPage.tsx`.

Card yang tidak bisa diklik tidak perlu hover transform. Card course, stat, atau landing yang memiliki aksi boleh naik sekitar 1–5 px dan menambah shadow, tetapi isi tidak boleh berubah posisi terlalu jauh.

### 8.3 Form

Form login dan register memakai label Fredoka, ikon di sisi kiri, input putih, border 3 px, radius 12 px, dan padding kiri `pl-10`. Focus state memakai `focus:ring-4 focus:ring-black/10` atau ring pastel pada halaman pengaturan dan AI panel.

Password field memakai `type="password"` dan ikon gembok. Validasi dijalankan sebelum submit, lalu error ditampilkan sebagai panel merah pastel dengan teks yang menjelaskan masalah. Pada `SettingsSecurity.tsx`, pesan kecil juga muncul langsung di bawah field ketika panjang atau konfirmasi password belum sesuai.

Disabled state memakai opacity 50–60 persen. Tombol submit juga dinonaktifkan saat proses berjalan. Form AI Tutor memakai label `sr-only`, input 3 px, dan tombol kirim 44 px.

Aturan konsistensinya: label harus tetap terlihat atau tersedia untuk screen reader, placeholder tidak boleh menggantikan label, error ditempatkan dekat field atau form, dan status loading harus mencegah submit ulang. Beberapa label pada form autentikasi belum memakai pasangan `htmlFor` dan `id`, jadi bagian ini masih perlu dijaga pada pengembangan berikutnya.

### 8.4 Navigation

Navbar landing bersifat sticky, berada di atas dengan `z-50`, background `#FFFDF8`, dan border bawah 4 px. Pada `md` ke atas, link section serta tombol login/register tampil sejajar. Di bawah `md`, navbar berubah menjadi tombol hamburger dan menu vertikal yang muncul di bawah navbar.

Navigasi aplikasi setelah login memakai `AppSidebar.tsx`. Sidebar desktop muncul mulai `lg`, memiliki lebar 16 rem saat terbuka dan 5 rem saat diciutkan. Active state pengguna memakai mint, border hitam, dan shadow 3 px. Sidebar admin memakai struktur yang sama tetapi active state biru dan latar `#F0F4F8`.

Di bawah `lg`, aplikasi menampilkan `AppTopbar` dan `MobileSidebarDrawer`. Drawer memiliki lebar `min(90vw,20rem)`, overlay hitam 55 persen, tombol close merah, dan focus trap. Tekan Escape untuk menutup, scroll body dikunci, lalu fokus dikembalikan ke elemen sebelumnya.

Setiap item sidebar memakai ikon Lucide dan label. Ketika sidebar diciutkan, label disembunyikan tetapi `aria-label` serta tooltip tetap tersedia. Active link juga memakai `aria-current="page"`.

### 8.5 Badge dan Status

`NeoBadge.tsx` adalah badge kecil berbentuk pill dengan Fredoka bold, border 2 px, dan ukuran `sm` atau `md`. Komponen ini dipakai untuk label level, status lesson, dan metadata singkat.

Badge pencapaian berbeda dari chip UI. Pada `BadgeList.tsx`, badge pencapaian adalah card penuh yang memuat ikon, nama, kategori, status diraih/terkunci, dan progress. Saat dipilih, detailnya tampil dalam modal. Warna badge pencapaian juga memakai mapping khusus per milestone.

Badge dekoratif pada landing seperti kicker, eyebrow, dan proof chip tidak menunjukkan pencapaian pengguna. Bentuknya dapat mirip pill, tetapi isinya hanya membantu hierarchy. Label “Belajar • Praktik • Aman” di hero bahkan dibuat sebagai teks sederhana pada bagian atas card ilustrasi, bukan badge pencapaian.

Status success memakai mint atau hijau, warning memakai kuning/peach, error memakai merah pastel, dan informasi memakai biru. Status harus tetap memiliki kata seperti “Selesai”, “Terkunci”, “Gagal”, atau “Memuat”, ditambah ikon bila membantu.

### 8.6 Modal, Drawer, dan Panel

Modal nyata yang terlihat di project antara lain detail badge dan celebration setelah lesson selesai. Modal lesson memakai `role="dialog"`, `aria-modal="true"`, overlay hitam 45 persen, card `max-w-md`, dan batas tinggi viewport agar isi tetap dapat discroll. Badge modal juga memakai role dialog, Escape, dan fokus awal pada tombol close.

`LessonDrawer.tsx` menjadi dasar daftar materi di kiri dan AI Tutor di kanan. Drawer daftar materi selebar `min(92vw,23rem)`. Panel AI maksimal `27.5rem` dan berubah menjadi full width pada mobile. Keduanya memakai overlay `bg-black/55`, animasi masuk dari sisi terkait, focus trap, tombol close merah, dan body scroll lock.

Panel AI Tutor memiliki header kecil, daftar pesan yang bisa discroll, `aria-live="polite"`, input tetap di bawah, dan tombol untuk membuka AI Tutor layar penuh. Drawer materi menampilkan active, completed, locked, serta available state dengan warna dan ikon yang berbeda.

Form admin juga memakai panel modal di tengah dengan overlay hitam, `max-h-[calc(100dvh-1.5rem)]`, dan overflow internal. Namun penerapan role dialog dan pengelolaan fokus pada modal admin belum terlihat seragam. Pola `LessonDrawer` lebih aman dijadikan acuan.

### 8.7 Progress dan Feedback

Progress bar muncul di dashboard, lesson, jalur belajar, course, quiz, badge, onboarding, dan sertifikat. Bentuk umumnya berupa track putih ber-border hitam, sudut penuh, lalu fill mint atau hitam. `DashboardProgressBar` dan progress lesson sudah memakai `role="progressbar"` beserta nilai ARIA. Beberapa progress di badge, quiz, dan halaman lama masih hanya visual.

Loading ditampilkan dalam tiga bentuk: spinner dengan pesan, skeleton card, dan loading di dalam tombol. `LoadingBoundary.tsx` menjadi fallback umum. Dashboard, badge, serta simulasi juga memiliki skeleton berbentuk card agar layout tidak meloncat terlalu banyak.

Project belum memiliki komponen toast atau snackbar yang dipakai bersama. Feedback lebih sering ditampilkan sebagai alert inline, card status, atau pesan di dekat form. Ada pula pemakaian `window.alert` ketika path atau course terkunci. Untuk pengembangan berikutnya, pola inline lebih sesuai dengan tampilan project dan lebih mudah dikontrol daripada menambah gaya toast baru tanpa aturan.

Empty state memakai border dashed atau card putih, judul, penjelasan, dan CTA. Error state memakai peach/merah, `role="alert"` pada beberapa bagian, serta tombol coba lagi. Success state memakai mint dan teks yang menjelaskan tindakan berikutnya. Status tidak perlu animasi terus-menerus; animasi pendek atau spinner cukup saat ada proses.

## 9. Icon dan Ilustrasi

Library icon utama adalah `lucide-react`, sesuai `package.json` dan import di hampir seluruh komponen. Ikonnya memakai gaya outline, ukuran seragam, dan warna mengikuti `currentColor`. Ukuran yang paling sering dipakai adalah 16 px (`size-4`), 20 px (`size-5`), 24 px (`size-6`), dan 32 px (`size-8`).

Ikon 16–20 px dipakai di samping teks tombol atau metadata. Ikon 20–24 px dipakai pada navigasi dan header card. Ikon yang lebih besar muncul pada empty state, ilustrasi, atau statistik. Ikon dekoratif diberi `aria-hidden="true"`, sedangkan icon-only button diberi `aria-label`.

Landing page memakai ilustrasi React/SVG buatan langsung pada `Illustrations.tsx`, bukan library ilustrasi eksternal. `HeroIllustration` memiliki `role="img"` dan label yang menjelaskan ponsel aman, perisai, dan AI Tutor. Preview phishing dan gamifikasi dibangun dari card, SVG, serta shape CSS agar menyatu dengan design system.

Dekorasi seperti sparkle, lingkaran, grid, dan shape miring sebaiknya tetap berada di belakang isi, tidak menerima pointer event, dan tidak mengambil ruang yang mengganggu layout. Animasi dekoratif perlu ringan dan harus berhenti ketika pengguna memilih reduced motion.

## 10. Responsivitas

Project tidak mengganti breakpoint Tailwind, jadi pola yang dipakai mengikuti breakpoint bawaan: `sm` mulai 640 px, `md` mulai 768 px, `lg` mulai 1024 px, dan `xl` mulai 1280 px. Ada beberapa breakpoint kecil khusus seperti `min-[360px]` dan `min-[390px]` untuk tombol atau statistik yang sempit.

### Desktop

Pada `lg`, landing hero memakai grid 12 kolom dengan teks 7 kolom dan ilustrasi 5 kolom. Dashboard dan halaman detail dapat memakai dua kolom. Sidebar aplikasi muncul fixed, dapat diciutkan dari 16 rem menjadi 5 rem, sedangkan konten menyesuaikan margin kiri.

### Tablet

Navbar landing sudah memakai menu desktop mulai `md`, tetapi sidebar aplikasi belum muncul sampai `lg`. Pada ukuran ini aplikasi masih memakai topbar dan drawer. Banyak grid berubah menjadi dua atau tiga kolom, sementara panel besar tetap diberi lebar maksimum agar tidak terlalu melebar.

### Mobile

Layout kembali ke satu kolom, padding utama mengecil, dan tombol aksi sering menjadi `w-full`. Navbar landing membuka menu vertikal. Hero menempatkan teks di atas ilustrasi, card ilustrasi dibatasi sekitar 390 px, shadow diperkecil, serta art di-scale agar tidak keluar layar.

Dashboard menampilkan statistik dua kolom dan menyusun CTA secara vertikal. Card course dan progress kembali menjadi satu kolom. Lesson tetap memakai satu kolom selebar 52 rem maksimum, navigasi materi menjadi bertumpuk, daftar materi dibuka dari drawer kiri, dan AI Tutor menjadi panel full screen pada layar kecil.

Drawer menggunakan `dvh`, batas tinggi viewport, `overscroll-contain`, dan safe-area padding pada composer AI. Teks panjang, email, ID, serta judul diberi `break-words`, `break-all`, atau `overflow-wrap:anywhere`. Prinsip ini penting agar tidak ada horizontal overflow di mobile.

## 11. Accessibility

Beberapa praktik yang sudah ada dan perlu dipertahankan:

- warna teks utama `#111111` berada di atas latar terang dan pastel;
- button utama memakai focus ring yang terlihat;
- sidebar memakai `aria-current`, tooltip, dan label saat mode collapsed;
- drawer mobile dan lesson memakai role dialog, Escape, focus trap, body scroll lock, serta focus restore;
- banyak ikon dekoratif memakai `aria-hidden="true"`;
- ilustrasi hero mempunyai role dan label;
- progress lesson serta dashboard memiliki role dan nilai ARIA;
- area chat memakai `aria-live="polite"`;
- animasi dikurangi melalui `prefers-reduced-motion` dan `useReducedMotion`;
- tombol utama dan item navigasi sering memakai tinggi sekitar 44 px.

Project belum bisa dianggap selesai dari sisi accessibility. Beberapa hal yang masih perlu dijaga atau ditingkatkan adalah:

- label pada form login/register terlihat secara visual, tetapi belum semuanya terhubung ke input melalui `htmlFor` dan `id`;
- card badge memakai `onClick` pada `div` tanpa pola keyboard setara;
- badge modal menangani Escape dan fokus awal, tetapi belum memiliki focus trap serta focus restore sekuat `LessonDrawer`;
- beberapa progress bar belum memiliki `role="progressbar"` dan nilai ARIA;
- beberapa gambar memakai alt umum seperti “Profile” atau “Profile Preview”;
- tombol icon padat berukuran 32–40 px masih ada;
- beberapa modal admin belum memakai semantic dialog dan pengelolaan fokus yang seragam;
- `window.alert` masih dipakai untuk state terkunci pada beberapa halaman.

Kontras pastel terhadap teks hitam terlihat cukup kuat secara visual, tetapi dokumen ini tidak mengklaim seluruh kombinasi sudah lulus audit WCAG. Setiap warna teks tambahan, terutama teks abu-abu atau warna status di atas pastel, tetap perlu diuji ketika diubah.

## 12. Do and Don’t

| Do | Don’t |
|----|-------|
| Gunakan mint sebagai warna utama untuk branding, primary action, progress, dan state selesai. | Jangan memenuhi satu halaman hanya dengan hijau; gunakan putih, background netral, atau biru sebagai penyeimbang. |
| Gunakan satu warna pastel utama per card dan putih untuk panel di dalamnya. | Jangan mencampur mint, biru, kuning, peach, dan ungu dalam satu card tanpa hierarchy. |
| Pertahankan border hitam 2–4 px sesuai tingkat kepentingan elemen. | Jangan menambah warna border baru untuk card biasa. |
| Pakai shadow solid 3, 5, atau 8 px yang sudah ada. | Jangan membuat drop shadow blur besar yang tidak cocok dengan gaya neo-brutalist. |
| Gunakan `NeoButton`, `NeoCard`, dan `NeoBadge` ketika pola dasarnya sesuai. | Jangan membuat variasi tombol baru hanya untuk mengganti sedikit padding atau warna. |
| Sertakan hover, active, focus, disabled, dan loading state pada tindakan. | Jangan membuat tombol yang hanya berubah ketika mouse hover. |
| Gunakan `min-w-0`, wrapping, dan container maksimum pada flex/grid. | Jangan membiarkan judul, email, ID, atau tabel memperlebar seluruh halaman. |
| Buat tombol utama full width di mobile jika ruang sempit. | Jangan memaksa beberapa CTA panjang tetap sejajar di mobile. |
| Bedakan badge pencapaian dari chip dekoratif atau label section. | Jangan memakai gaya badge pencapaian untuk dekorasi yang tidak memiliki status. |
| Tampilkan status dengan warna, teks, dan bila perlu ikon. | Jangan mengandalkan warna saja untuk menandai berhasil, warning, error, atau terkunci. |
| Letakkan dekorasi di belakang isi dan tandai sebagai dekoratif. | Jangan menaruh shape atau label sampai menabrak teks, ilustrasi utama, atau border card. |
| Gunakan reduced-motion dan animasi singkat. | Jangan membuat animasi terus bergerak tanpa penghormatan pada preferensi pengguna. |

## 13. Contoh Implementasi

Potongan berikut diambil dari pola yang benar-benar ada di project dan dipendekkan agar mudah dibaca.

### Primary button

Sumber: `src/components/Dashboard.tsx` dan `src/components/NeoButton.tsx`.

```tsx
<NeoButton
  type="button"
  variant="primary"
  size="sm"
  onClick={() => onNavigate("/learn/paths")}
>
  Jelajahi Jalur Belajar
</NeoButton>
```

### Card

Sumber: pola `NeoCard` pada `src/components/ProgressPage.tsx`.

```tsx
<NeoCard
  bgColor="bg-pastel-blue"
  className="p-6 flex flex-col justify-between space-y-4"
>
  <span className="text-xs font-heading font-extrabold uppercase text-brand-muted">
    Penyelesaian Materi
  </span>
  <div className="text-4xl font-heading font-extrabold">
    {completedLessonsCount} / {totalLessons}
  </div>
</NeoCard>
```

### Input

Sumber: pola input pada `src/components/Login.tsx`.

```tsx
<input
  type="email"
  required
  disabled={isSubmitting}
  className="w-full rounded-xl border-3 border-brand-border bg-white
             py-2.5 pl-10 pr-4 text-sm font-medium text-brand-text
             focus:outline-none focus:ring-4 focus:ring-black/10
             disabled:opacity-50"
/>
```

### Responsive grid

Sumber: feature grid pada `src/components/LandingPage.tsx`.

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((feature, index) => (
    <article
      key={feature.id}
      className={`${backgrounds[index % backgrounds.length]}
                  rounded-[22px] border-[3px] border-brand-border p-6`}
    >
      <h3 className="text-xl font-bold sm:text-2xl">{feature.title}</h3>
    </article>
  ))}
</div>
```

### Status badge

Sumber: `src/components/LessonReader.tsx`.

```tsx
{isCompleted && (
  <NeoBadge bgColor="bg-pastel-mint">
    Selesai
  </NeoBadge>
)}
```

### Progress bar dengan nilai aksesibel

Sumber: pola progress pada `src/components/LessonReader.tsx`.

```tsx
<div
  className="h-4 overflow-hidden rounded-full border-2 border-black bg-white"
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={completionPercent}
>
  <div
    className="h-full bg-pastel-mint transition-[width]"
    style={{ width: `${completionPercent}%` }}
  />
</div>
```

## 14. Penutup

Design system ini menjadi acuan supaya pengembangan Cyber Academy AI berikutnya tetap terasa sebagai bagian dari aplikasi yang sama. Tidak semua halaman harus terlihat identik, tetapi warna, typography, border, shadow, spacing, state, dan perilaku responsifnya perlu mengikuti pola yang sudah ada.

Jika nanti ada komponen baru, sebaiknya cek dulu apakah kebutuhan tersebut bisa dipenuhi oleh `NeoButton`, `NeoCard`, `NeoBadge`, pola navigation, atau pola drawer yang sekarang. Dengan begitu tampilan dapat berkembang tanpa kehilangan identitas dan tanpa menambah variasi yang sebenarnya tidak diperlukan.
