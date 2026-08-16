import { Feature, LearningPath, FaqItem, ProblemSolution, Step, Course, Lesson } from "./types";
import { intermediateCourses, intermediateLessons } from "./intermediate_data";
import { advancedCourses, advancedLessons } from "./advanced_data";
import {
  liveCatalogAdditionalCourses,
  liveCatalogAdditionalLessons,
} from "./live_catalog_additions";

const completeIntermediateCourses = [
  ...intermediateCourses,
  ...liveCatalogAdditionalCourses.filter(
    (course) => course.learningPathId === "intermediate-path",
  ),
].sort((first, second) => first.order - second.order);

const completeAdvancedCourses = [
  ...advancedCourses,
  ...liveCatalogAdditionalCourses.filter(
    (course) => course.learningPathId === "advanced-path",
  ),
].sort((first, second) => first.order - second.order);

export const features: Feature[] = [
  {
    id: "materi-interaktif",
    title: "Materi Interaktif",
    description: "Pelajari materi singkat yang ramah pemula tanpa istilah rumit, dilengkapi kuis otomatis untuk menguji pemahamanmu seketika.",
    iconName: "book-open",
    bgColor: "bg-pastel-blue"
  },
  {
    id: "simulasi-ancaman",
    title: "Simulasi Ancaman",
    description: "Praktik langsung mengenali jebakan digital seperti email phishing, chat penipuan, hingga taktik manipulasi sosial (social engineering).",
    iconName: "shield-alert",
    bgColor: "bg-pastel-peach"
  },
  {
    id: "ai-tutor",
    title: "AI Tutor Personal",
    description: "Bertanya kapan saja kepada asisten cerdas yang dipandu khusus untuk menjelaskan konsep keamanan siber secara defensif dan ramah.",
    iconName: "bot",
    bgColor: "bg-pastel-mint"
  }
];

export const problemsAndSolutions: ProblemSolution[] = [
  {
    id: "ps-1",
    problem: "Materi keamanan siber di luar sana terasa sangat teknis, rumit, dan membosankan untuk pemula.",
    solution: "Cyber Academy AI menyajikan teori secara interaktif melalui kartu belajar, analogi sederhana, dan kuis ramah pemula.",
    illustrationName: "confused-user",
    bgColor: "bg-pastel-yellow"
  },
  {
    id: "ps-2",
    problem: "Hanya membaca teori tidak cukup membuat kita waspada terhadap serangan phishing atau scam asli.",
    solution: "Kami menghadirkan ruang simulasi interaktif yang menduplikasi skenario ancaman digital dunia nyata secara aman.",
    illustrationName: "phishing-trap",
    bgColor: "bg-pastel-lavender"
  }
];

export const courses: Course[] = [
  {
    id: "dasar-keamanan-siber",
    learningPathId: "beginner-path",
    title: "Dasar Keamanan Siber",
    slug: "dasar-keamanan-siber",
    description: "Mengenal dunia siber, dasar ancaman digital, dan mengapa perlindungan informasi itu sangat penting bagi semua orang.",
    category: "Digital Safety",
    level: "beginner",
    order: 1,
    estimatedDuration: 30,
    xpReward: 50,
    learningOutcomes: [
      "Memahami definisi dasar keamanan siber (cybersecurity)",
      "Mengenal tiga pilar keamanan informasi (CIA Triad)",
      "Mengetahui alasan mengapa peretas mengincar data pribadi pengguna biasa"
    ],
    lessonCount: 2,
    status: "published"
  },
  {
    id: "password-keamanan-akun",
    learningPathId: "beginner-path",
    title: "Password dan Keamanan Akun",
    slug: "password-keamanan-akun",
    description: "Panduan taktis membuat kata sandi tangguh, mengelola banyak akun secara aman, dan mengaktifkan proteksi ekstra 2FA.",
    category: "Account Security",
    level: "beginner",
    order: 2,
    estimatedDuration: 40,
    xpReward: 60,
    learningOutcomes: [
      "Mampu membuat kombinasi password yang mustahil ditebak peretas dalam waktu singkat",
      "Memahami cara kerja Autentikasi Dua Faktor (2FA) untuk perlindungan ekstra",
      "Mengerti pentingnya menggunakan Pengelola Kata Sandi (Password Manager)"
    ],
    lessonCount: 2,
    status: "published"
  },
  {
    id: "phishing-penipuan-digital",
    learningPathId: "beginner-path",
    title: "Phishing dan Penipuan Digital",
    slug: "phishing-penipuan-digital",
    description: "Pelajari cara mengenali jebakan rekayasa sosial, link palsu, email penipuan, serta cara menghindarinya secara preventif.",
    category: "Phishing",
    level: "beginner",
    order: 3,
    estimatedDuration: 45,
    xpReward: 80,
    learningOutcomes: [
      "Mampu mengidentifikasi ciri-ciri pesan phishing di email atau WhatsApp",
      "Memahami teknik manipulasi emosi (urgensi, hadiah palsu) yang digunakan pelaku",
      "Mengetahui tindakan penyelamatan diri jika tidak sengaja mengklik link berbahaya"
    ],
    lessonCount: 3,
    status: "published"
  },
  {
    id: "privasi-data-pribadi",
    learningPathId: "beginner-path",
    title: "Privasi dan Data Pribadi",
    slug: "privasi-data-pribadi",
    description: "Kiat meminimalkan jejak digital di internet, melindungi hak privasi, dan mengamankan info sensitif di media sosial.",
    category: "Privacy",
    level: "beginner",
    order: 4,
    estimatedDuration: 35,
    xpReward: 60,
    learningOutcomes: [
      "Mengerti bahaya oversharing (berbagi informasi berlebihan) di internet",
      "Mengetahui cara mengontrol pengaturan privasi di berbagai media sosial populer",
      "Meminimalkan jejak digital sensitif yang rentan disalahgunakan pelaku kejahatan"
    ],
    lessonCount: 2,
    status: "published"
  },
  ...completeIntermediateCourses,
  ...completeAdvancedCourses
];

export const lessons: Lesson[] = [
  // Course 1 Lessons
  {
    id: "l-pengantar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    learningPathId: "beginner-path",
    title: "Pengantar Keamanan Siber",
    slug: "pengantar-keamanan-siber",
    order: 1,
    objective: "Memahami apa itu keamanan siber dan mengapa pilar CIA Triad sangat mendasar bagi keamanan informasi digital kita.",
    content: `Keamanan Siber (Cybersecurity) adalah praktik melindungi sistem, jaringan, perangkat, dan data penting dari serangan digital yang berbahaya. 

Di era modern, hampir semua aspek hidup kita terhubung ke internet: perbankan, obrolan keluarga, tugas sekolah, hingga belanja harian. Di sinilah konsep **CIA Triad** bekerja sebagai fondasi utama:

1. **Confidentiality (Kerahasiaan):** Memastikan hanya orang yang berhak yang bisa membaca datamu. Contohnya: Pesan WhatsApp-mu tidak bisa dibaca orang asing.
2. **Integrity (Integritas):** Menjamin bahwa data tidak diubah secara ilegal oleh pihak lain di tengah jalan. Contohnya: Saldo rekening bank-mu tetap akurat dan tidak berubah sendiri.
3. **Availability (Ketersediaan):** Memastikan data dan sistem selalu siap diakses kapan pun kamu membutuhkannya. Contohnya: Aplikasi mobile banking tidak tumbang saat kamu ingin bertransaksi mendesak.

Jika salah satu dari ketiga aspek ini runtuh, maka terjadi celah keamanan siber yang dapat dimanfaatkan oleh pihak tidak bertanggung jawab.`,
    exampleCase: {
      title: "Kebocoran Saldo Akibat Hilangnya Integritas",
      description: "Sebuah sistem pembayaran online mengalami bug yang membolehkan pengguna mengubah parameter harga barang sebelum menekan tombol bayar, sehingga peretas bisa membeli laptop seharga Rp10 juta hanya dengan membayar Rp10 ribu."
    },
    securityTips: [
      "Selalu gunakan enkripsi data HTTPS saat berselancar di situs web.",
      "Sadari bahwa data digitalmu adalah aset berharga yang harus dilindungi layaknya barang fisik."
    ],
    keyTakeaways: [
      "Keamanan siber bukan hanya urusan programmer, melainkan kewaspadaan setiap individu pengguna internet.",
      "Tiga pilar utama keamanan adalah Kerahasiaan (Confidentiality), Integritas (Integrity), dan Ketersediaan (Availability)."
    ],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published"
  },
  {
    id: "l-mengapa-data-berharga",
    courseId: "dasar-keamanan-siber",
    learningPathId: "beginner-path",
    title: "Mengapa Data Anda Berharga?",
    slug: "mengapa-data-berharga",
    order: 2,
    objective: "Mengetahui nilai nyata dari data pribadi Anda di mata pelaku kejahatan siber (cybercriminals) dan pasar gelap.",
    content: `Seringkali kita berpikir: *"Saya kan hanya orang biasa, bukan pejabat atau artis terkenal. Mengapa peretas mau mengincar data saya?"*

Ini adalah kesalahan berpikir yang paling umum! Faktanya, bagi peretas, **data pribadi Anda adalah tambang emas.** Berikut alasannya:

- **Pencurian Identitas (Identity Theft):** Nama lengkap, NIK, dan tanggal lahir Anda dapat disalahgunakan pelaku untuk mengajukan pinjaman online (pinjol) ilegal atas nama Anda.
- **Serangan Ransomware:** Peretas mengunci foto-foto keluarga atau dokumen kerjamu yang berharga, lalu memerasmu untuk membayar uang tebusan jika ingin data tersebut kembali.
- **Penyebaran Spam & Phishing:** Daftar kontak email atau nomor WhatsApp milikmu bisa diretas untuk mengirimkan pesan jebakan siber ke teman-teman terdekatmu agar mereka percaya karena pesan itu dikirim atas namamu.
- **Penjualan Data Massal:** Jutaan data pribadi orang biasa dikumpulkan dan dijual murah di forum internet gelap (Dark Web) untuk kebutuhan spam iklan hingga penipuan terarah.`,
    exampleCase: {
      title: "Pinjaman Online Ilegal Atas Nama Korban",
      description: "Rudi kaget saat didatangi penagih hutang pinjol ilegal. Setelah ditelusuri, Rudi pernah memposting foto selfie memegang KTP di media sosialnya untuk mengikuti kuis berhadiah ponsel gratis."
    },
    securityTips: [
      "Jangan pernah membagikan foto dokumen identitas resmi (KTP, SIM, Paspor) ke publik.",
      "Batasi informasi diri yang terlalu personal di platform online mana pun."
    ],
    keyTakeaways: [
      "Semua orang tanpa terkecuali adalah target potensial peretasan siber.",
      "Data Anda adalah mata uang di internet gelap, sekecil apa pun datanya wajib kita lindungi."
    ],
    estimatedDuration: 8,
    xpReward: 15,
    status: "published"
  },

  // Course 2 Lessons
  {
    id: "l-cara-membuat-sandi-kuat",
    courseId: "password-keamanan-akun",
    learningPathId: "beginner-path",
    title: "Cara Membuat Sandi Kuat",
    slug: "cara-membuat-sandi-kuat",
    order: 1,
    objective: "Mampu merancang kata sandi yang mudah diingat pemiliknya namun mustahil dibobol menggunakan metode Brute Force oleh peretas.",
    content: `Banyak dari kita masih menggunakan password sederhana seperti \`123456\`, \`rahasia\`, atau tanggal lahir sendiri. Kata sandi seperti ini bisa dibobol peretas hanya dalam hitungan detik!

Untuk membuat kata sandi yang benar-benar aman, gunakan taktik **Passphrase (Frasa Sandi)**:

1. **Gunakan 3-4 Kata Acak:** Gabungkan kata-kata biasa yang tidak saling berhubungan secara logis. Contoh: \`kucing-mandi-kopi-hangat\`.
2. **Tambahkan Variasi Karakter:** Selipkan huruf besar, angka, dan simbol unik di antara kata. Contoh: \`Kuc1ng-M@nd1-Kop1!\`.
3. **Hindari Informasi Personal:** Jangan gunakan nama anak, peliharaan, tanggal lahir, atau alamat rumah yang mudah dicari di media sosialmu.
4. **Prinsip Utama:** Setiap akun penting wajib menggunakan kata sandi yang unik! Jangan pernah mendaur ulang satu kata sandi yang sama di semua akun sosial mediamu.`,
    exampleCase: {
      title: "Pembobolan Massal Akibat Sandi Duplikat",
      description: "Sandi akun Instagram milik Sinta berhasil diretas karena dia menggunakan sandi yang sama persis dengan akun forum game kecil yang pernah mengalami kebocoran database data pengguna."
    },
    securityTips: [
      "Gunakan Password Manager terpercaya (seperti Google Password Manager atau Bitwarden) agar tidak perlu menghafal puluhan sandi unik.",
      "Ganti kata sandi secara berkala minimal setiap 6 bulan untuk akun paling krusial seperti email utama."
    ],
    keyTakeaways: [
      "Panjang kata sandi jauh lebih penting daripada kerumitannya.",
      "Satu akun, satu password unik adalah aturan mutlak keamanan digital."
    ],
    estimatedDuration: 12,
    xpReward: 15,
    status: "published"
  },
  {
    id: "l-mengenal-2fa",
    courseId: "password-keamanan-akun",
    learningPathId: "beginner-path",
    title: "Mengenal Two-Factor Authentication",
    slug: "mengenal-2fa",
    order: 2,
    objective: "Memahami pentingnya 2FA dan bagaimana sistem ini bertindak sebagai tameng kedua yang menyelamatkan akunmu saat kata sandi bocor.",
    content: `Bayangkan peretas berhasil menebak kata sandimu. Tanpa **Two-Factor Authentication (2FA)**, akunmu langsung jatuh ke tangan mereka seketika.

2FA adalah lapisan pertahanan kedua. Setelah kamu memasukkan kata sandi (lapisan 1), sistem akan meminta pembuktian kedua (lapisan 2) untuk memastikan bahwa itu benar-benar kamu:

Ada beberapa metode 2FA:
- **Aplikasi Autentikator (Sangat Direkomendasikan):** Menggunakan aplikasi seperti Google Authenticator untuk menghasilkan kode 6 digit acak yang berubah setiap 30 detik.
- **SMS OTP:** Mengirimkan kode token via SMS. Cukup praktis, namun rawan terhadap pembajakan kartu SIM (SIM Swap).
- **Kunci Keamanan Fisik (Security Key):** Kunci hardware berbentuk USB yang harus dicolokkan ke perangkat fisik untuk memverifikasi login.

Dengan mengaktifkan 2FA, peretas yang memiliki kata sandimu sekalipun tidak akan pernah bisa masuk ke akunmu tanpa memegang kode rahasia di tangan fisikmu!`,
    exampleCase: {
      title: "Selamat dari Pembajakan Akun Berkat 2FA",
      description: "Andi menerima notifikasi login mencurigakan dari Rusia di emailnya. Peretas berhasil menebak kata sandi Andi, namun terhenti total karena sistem meminta kode 2FA yang hanya ada di ponsel Andi."
    },
    securityTips: [
      "Segera aktifkan 2FA di WhatsApp, Google, Instagram, dan aplikasi keuangan Anda.",
      "Simpan 'Backup Codes' atau kode pemulihan darurat 2FA di tempat fisik yang aman."
    ],
    keyTakeaways: [
      "Kata sandi saja kini tidak lagi cukup untuk mengamankan identitas onlinemu.",
      "2FA adalah penangkal peretasan paling efektif yang wajib diaktifkan saat ini."
    ],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published"
  },

  // Course 3 Lessons
  {
    id: "l-apa-itu-phishing",
    courseId: "phishing-penipuan-digital",
    learningPathId: "beginner-path",
    title: "Apa Itu Phishing?",
    slug: "apa-itu-phishing",
    order: 1,
    objective: "Memahami konsep penipuan phishing dan bagaimana metode manipulasi sosial ini mencuri data berhargamu.",
    content: `**Phishing** (diambil dari kata *fishing* yang berarti memancing) adalah teknik penipuan digital di mana pelaku memancing korban untuk memberikan data sensitif seperti password, nomor kartu kredit, atau kode OTP.

Alih-alih meretas sistem komputer yang rumit, pelaku phishing memilih untuk meretas **pikiran manusia** menggunakan rekayasa sosial (social engineering).

Cara kerjanya sederhana:
1. Pelaku menyamar sebagai instansi terpercaya (bank, e-commerce, kurir paket, atau teman kerja).
2. Mereka mengirimkan pesan darurat atau menggiurkan (hadiah gratis, blokir rekening, kiriman paket hilang).
3. Korban digiring untuk mengklik link palsu yang mengarah ke situs tiruan yang menyerupai situs asli.
4. Ketika korban menginput datanya di situs palsu tersebut, data itu langsung terkirim ke tangan peretas.`,
    exampleCase: {
      title: "Jebakan Undangan Pernikahan APK Palsu",
      description: "Banyak pengguna Android kehilangan saldo m-banking setelah mengunduh file '.APK' yang dikirim pelaku via WhatsApp dengan kedok 'Undangan Pernikahan Digital'. File tersebut ternyata spyware yang merekam aktivitas layar dan SMS OTP."
    },
    securityTips: [
      "Jangan pernah mengklik tautan tidak dikenal dari pengirim mencurigakan.",
      "Perhatikan format file kiriman di WhatsApp, hindari membuka file berekstensi .APK dari nomor tidak dikenal."
    ],
    keyTakeaways: [
      "Phishing mengeksploitasi emosi manusia (panik, serakah, penasaran) bukan celah teknis sistem.",
      "Selalu verifikasi informasi mencurigakan langsung ke kanal customer service resmi."
    ],
    estimatedDuration: 12,
    xpReward: 15,
    status: "published"
  },
  {
    id: "l-ciri-ciri-email-phishing",
    courseId: "phishing-penipuan-digital",
    learningPathId: "beginner-path",
    title: "Ciri-Ciri Email Phishing",
    slug: "ciri-ciri-email-phishing",
    order: 2,
    objective: "Melatih refleks mata Anda agar mampu mendeteksi indikator bahaya pada pesan phishing dalam waktu 3 detik.",
    content: `Meskipun phishing dirancang sangat meyakinkan, selalu ada celah atau tanda bahaya yang tertinggal jika kita jeli memperhatikan. Berikut ciri utamanya:

- **Domain Pengirim Palsu:** Alamat email sekilas terlihat resmi, namun memiliki ejaan typo atau domain aneh. Contoh: \`support@bank-aman-login.xyz\` bukannya \`support@bankaman.co.id\`.
- **Bahasa Mendesak & Mengancam:** Pelaku menciptakan urgensi palsu agar korban panik dan bertindak ceroboh. Contoh: *"Akun Anda akan diblokir dalam 24 jam! Klik verifikasi sekarang!"*
- **Tautan/Link Tersembunyi:** Teks tombol bertuliskan "Verifikasi", namun jika kamu melayangkan kursor di atasnya (hover), link aslinya mengarah ke website asing tidak dikenal.
- **Meminta Informasi Rahasia:** Instansi resmi mana pun, terutama bank, tidak akan pernah meminta kata sandi, nomor kartu ATM, atau kode OTP Anda via email atau chat obrolan umum.`,
    exampleCase: {
      title: "Email Tagihan Netflix Palsu",
      description: "Budi menerima email panik yang mengklaim langganan Netflix miliknya gagal didebit dan akan segera dihentikan. Tanpa memeriksa pengirim, Budi mengklik tautan verifikasi dan menginput detail kartu kreditnya di website tiruan."
    },
    securityTips: [
      "Biasakan memeriksa ejaan alamat email pengirim dengan teliti sebelum membaca isinya.",
      "Gunakan fitur 'hover' (arahkan kursor) tanpa mengklik untuk melihat ke mana tautan aslinya mengarah."
    ],
    keyTakeaways: [
      "Pesan mencurigakan selalu memicu kepanikan atau rasa ingin tahu yang ekstrem.",
      "Institusi resmi tidak akan pernah menanyakan rahasia autentikasi Anda."
    ],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published"
  },
  {
    id: "l-mengapa-pelaku-phishing",
    courseId: "phishing-penipuan-digital",
    learningPathId: "beginner-path",
    title: "Mengapa Pelaku Menggunakan Phishing?",
    slug: "mengapa-pelaku-phishing",
    order: 3,
    objective: "Memahami psikologi serangan siber dan mengapa taktik rekayasa sosial ini sangat digemari peretas di seluruh dunia.",
    content: `Peretas menggunakan phishing karena **manusia adalah rantai terlemah dalam sistem keamanan siber.**

Sangat sulit membobol enkripsi militer atau server perbankan modern yang terlindung firewall canggih seharga miliaran rupiah. Namun, sangat mudah membujuk seorang staf administrasi yang lelah untuk memberikan passwordnya secara sukarela melalui email penipuan yang cerdas.

Pelaku memanfaatkan kelemahan psikologis manusia:
- **Rasa Takut/Kepanikan:** *"Rekening Anda dibekukan!"* membuat kita bertindak tanpa berpikir jernih.
- **Keserakahan:** *"Selamat! Anda memenangkan undian Rp50 juta!"* memicu kita untuk buru-buru memasukkan data perbankan.
- **Rasa Hormat pada Otoritas:** Pelaku menyamar sebagai atasan kerja, CEO perusahaan, atau polisi yang menuntut tindakan mendesak dari kita.`,
    exampleCase: {
      title: "Serangan Phishing Skala Perusahaan",
      description: "Perusahaan ride-sharing raksasa berhasil ditembus peretas hanya karena salah satu karyawannya memberikan kode OTP internal kepada penipu yang menelepon dan mengaku sebagai tim IT Dukungan Teknis pusat."
    },
    securityTips: [
      "Terapkan kebijakan skeptis: Tarik napas, tenang, dan selalu verifikasi ulang setiap instruksi mendesak.",
      "Pahami bahwa rasa panik adalah musuh utama keamanan siber Anda."
    ],
    keyTakeaways: [
      "Peretasan pikiran manusia jauh lebih murah dan cepat bagi pelaku daripada meretas kode program.",
      "Membangun pertahanan siber dimulai dari melatih ketenangan emosional diri saat online."
    ],
    estimatedDuration: 8,
    xpReward: 15,
    status: "published"
  },

  // Course 4 Lessons
  {
    id: "l-jejak-digital-internet",
    courseId: "privasi-data-pribadi",
    learningPathId: "beginner-path",
    title: "Jejak Digital di Internet",
    slug: "jejak-digital-internet",
    order: 1,
    objective: "Mengenali apa itu jejak digital aktif dan pasif, serta bagaimana jejak tersebut mempengaruhi keamanan dan reputasi jangka panjang kita.",
    content: `Setiap kali kita membuka browser, menyukai postingan, atau mencari lokasi di peta, kita meninggalkan **Jejak Digital (Digital Footprint)**.

Ada dua jenis jejak digital:
1. **Jejak Digital Aktif:** Data yang sengaja kita bagikan ke publik. Contohnya: Foto selfie di Instagram, twit di X (Twitter), komentar di forum publik, atau ulasan produk belanjaan.
2. **Jejak Digital Pasif:** Informasi yang terekam tanpa kita sadari secara langsung. Contohnya: Riwayat pencarian web, alamat IP koneksi Wi-Fi, waktu aktif onlinemu, hingga data cookies pelacak iklan.

Mengapa ini berbahaya? Pelaku kejahatan siber dapat mengumpulkan jejak-jejak digital kecilmu ini untuk merangkai profil lengkap dirimu, yang kemudian digunakan sebagai bahan menyusun serangan phishing yang sangat terarah (*Spear Phishing*).`,
    exampleCase: {
      title: "Penipuan Berdasarkan Jejak Digital Liburan",
      description: "Dewi memposting status bandara dan tiket pesawat di Instagram Story-nya. Pelaku memanfaatkannya untuk menelepon orang tua Dewi di kampung, mengklaim Dewi mengalami kecelakaan parah di bandara liburan dan meminta transfer uang pengobatan darurat."
    },
    securityTips: [
      "Secara berkala, cari namamu di Google (egosearch) untuk melihat informasi publik apa saja yang terekspos.",
      "Hapus akun-akun lama yang sudah tidak pernah kamu gunakan lagi."
    ],
    keyTakeaways: [
      "What goes online stays online forever! Apa yang sudah masuk ke internet akan menetap di sana selamanya dan hampir mustahil dihapus 100%.",
      "Jejak digitalmu hari ini menentukan profil keamanan digitalmu di masa depan."
    ],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published"
  },
  {
    id: "l-mengamankan-media-sosial",
    courseId: "privasi-data-pribadi",
    learningPathId: "beginner-path",
    title: "Mengamankan Media Sosial",
    slug: "mengamankan-media-sosial",
    order: 2,
    objective: "Menerapkan setelan privasi terbaik pada akun media sosialmu untuk mencegah pengintaian oleh pelaku kejahatan.",
    content: `Media sosial dirancang agar kita saling berbagi, namun seringkali pengaturan bawaannya terlalu terbuka bagi publik.

Mari lakukan audit keamanan media sosial kita dengan langkah taktis berikut:

- **Ubah Akun Menjadi Privat:** Batasi agar hanya teman-teman yang kamu kenal di dunia nyata yang bisa melihat postingan atau aktivitas keseharianmu.
- **Batasi Izin Aplikasi Pihak Ketiga:** Seringkali kita menggunakan opsi "Masuk dengan Facebook" atau "Masuk dengan Google" pada game kuis kecil. Periksa setelan akunmu dan hapus akses aplikasi pihak ketiga yang mencurigakan.
- **Saring Pertemanan:** Jangan asal menerima pertemanan dari akun asing yang tidak dikenal di medsos.
- **Waspadai Fitur Lokasi:** Hindari memposting foto dengan penanda lokasi langsung (geotagging) rumah pribadi, alamat sekolah, atau kantor secara live.`,
    exampleCase: {
      title: "Tantangan Kuis Berbahaya yang Menguras Privasi",
      description: "Tren kuis media sosial bertema 'Variasikan Nama Gadismu' atau 'Nama Peliharaan Pertamamu' ternyata merupakan taktik peretas untuk mengumpulkan jawaban atas pertanyaan keamanan (Security Questions) pemulihan kata sandi perbankan milik pengguna."
    },
    securityTips: [
      "Jangan ikuti tren kuis viral di medsos yang menanyakan detail masa kecil, nama ibu kandung, atau tanggal lahir.",
      "Periksa menu pengaturan 'Privasi & Keamanan' di platform medsosmu setidaknya sebulan sekali."
    ],
    keyTakeaways: [
      "Melindungi privasi bukan berarti bersembunyi, melainkan mengontrol siapa yang berhak melihat duniamu.",
      "Media sosialmu adalah gerbang masuk pertama peretas untuk meneliti kepribadianmu."
    ],
    estimatedDuration: 10,
    xpReward: 15,
    status: "published"
  },
  ...intermediateLessons,
  ...advancedLessons,
  ...liveCatalogAdditionalLessons
];

export const learningPaths: LearningPath[] = [
  {
    id: "beginner-path",
    title: "Beginner: Fondasi Keamanan Siber",
    description: "Pelajari cara dasar melindungi akun pribadi, menyusun password tangguh, dan mengenali taktik penipuan digital paling umum.",
    level: "Beginner",
    courseCount: 4,
    durationMinutes: 120,
    xpReward: 300,
    bgColor: "bg-pastel-mint",
    badgeName: "Beginner Master",
    courses: [
      { title: "Dasar Keamanan Siber", description: "Mengenal dunia siber dan mengapa perlindungan informasi itu sangat penting.", lessonsCount: 2, completed: false, locked: false },
      { title: "Sandi Tangguh & Autentikasi", description: "Teknik membuat kata sandi aman dan mengaktifkan 2-Factor Authentication (2FA).", lessonsCount: 2, completed: false, locked: false },
      { title: "Waspada Phishing & Social Engineering", description: "Bagaimana penyerang mengelabui emosi kita untuk mencuri data berharga.", lessonsCount: 3, completed: false, locked: false },
      { title: "Privasi Data & Media Sosial", description: "Membatasi jejak digital dan mengamankan informasi pribadi di internet.", lessonsCount: 2, completed: false, locked: false }
    ]
  },
  {
    id: "intermediate-path",
    title: "Intermediate: Deteksi & Pertahanan Aktif",
    description: "Beranjak dari fondasi menuju kemampuan mengenali ancaman, melindungi jaringan dan aplikasi, serta melakukan respons defensif dasar.",
    level: "Intermediate",
    courseCount: completeIntermediateCourses.length,
    durationMinutes: completeIntermediateCourses.reduce((total, course) => total + course.estimatedDuration, 0),
    xpReward: 500,
    bgColor: "bg-pastel-blue",
    badgeName: "Intermediate Master",
    courses: completeIntermediateCourses.map((course) => ({
      title: course.title,
      description: course.description,
      lessonsCount: course.lessonCount,
      completed: false,
      locked: true,
    }))
  },
  {
    id: "advanced-path",
    title: "Advanced: Pengamanan Sistem Mendalam",
    description: "Pelajari assessment legal, secure development, forensik, analisis malware aman, threat intelligence, SIEM, respons insiden, dan arsitektur Zero Trust.",
    level: "Advanced",
    courseCount: completeAdvancedCourses.length,
    durationMinutes: completeAdvancedCourses.reduce((total, course) => total + course.estimatedDuration, 0),
    xpReward: 800,
    bgColor: "bg-pastel-lavender",
    badgeName: "Advanced Master",
    courses: completeAdvancedCourses.map((course) => ({
      title: course.title,
      description: course.description,
      lessonsCount: course.lessonCount,
      completed: false,
      locked: true,
    }))
  }
];

export const steps: Step[] = [
  {
    stepNumber: "01",
    title: "Pilih Jalur Belajar",
    description: "Mulailah dari jalur Pemula hingga Lanjutan sesuai kebutuhan dan tingkat pemahaman keahlianmu saat ini.",
    bgColor: "bg-pastel-mint"
  },
  {
    stepNumber: "02",
    title: "Pelajari Materi Interaktif",
    description: "Baca materi pembelajaran berdurasi singkat yang disajikan dengan visual menarik dan bahasa yang sederhana.",
    bgColor: "bg-pastel-blue"
  },
  {
    stepNumber: "03",
    title: "Hadapi Simulasi Skenario",
    description: "Uji instingmu dalam simulasi phishing atau kuis interaktif tanpa khawatir berisiko mengorbankan sistem aslimu.",
    bgColor: "bg-pastel-yellow"
  },
  {
    stepNumber: "04",
    title: "Kumpulkan Badge & Sertifikat",
    description: "Kumpulkan skor XP, naikkan level akun belajarmu, buka badge legendaris, serta raih sertifikat resmi kelulusan.",
    bgColor: "bg-pastel-lavender"
  }
];

export const faqs: FaqItem[] = [
  {
    question: "Apakah Cyber Academy AI ini gratis?",
    answer: "Ya! Seluruh materi dasar dan simulasi di platform ini 100% gratis untuk diakses oleh siapa saja demi mewujudkan Indonesia Makin Cakap Digital."
  },
  {
    question: "Bagaimana AI Tutor membantu saya belajar?",
    answer: "AI Tutor berbasis Vertex AI terintegrasi dengan modul pembelajaran. Pengguna dapat bertanya mengenai materi yang sedang dipelajari dan memperoleh penjelasan keamanan siber yang defensif serta ramah pemula."
  },
  {
    question: "Apa itu Simulasi Phishing interaktif?",
    answer: "Ini adalah lingkungan aman untuk melatih kewaspadaanmu. Kamu akan ditunjukkan contoh email, chat WA, atau tautan mencurigakan, lalu ditantang untuk menandai bagian mana saja yang mengandung indikator bahaya."
  },
  {
    question: "Apakah saya mendapatkan sertifikat resmi?",
    answer: "Tentu! Setelah kamu menyelesaikan seluruh kuis dan simulasi di akhir Jalur Belajar Beginner dengan nilai minimal kelulusan (70), kamu bisa langsung mengunduh sertifikat digital yang dilengkapi ID unik."
  },
  {
    question: "Apakah materi di sini diperbarui?",
    answer: "Ya, modul materi dan jenis simulasi disesuaikan dengan jenis tren ancaman siber terbaru di Indonesia agar relevan dengan kebutuhan praktis kehidupan sehari-hari."
  }
];
