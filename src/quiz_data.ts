import { Quiz, Question } from "./types";
import { intermediateQuestions, intermediateQuizzes } from "./intermediate_data";
import { advancedQuestions, advancedQuizzes } from "./advanced_data";
import {
  liveCatalogAdditionalQuestions,
  liveCatalogAdditionalQuizzes,
} from "./live_catalog_additions";

export const quizzes: Quiz[] = [
  {
    id: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    title: "Quiz Dasar Keamanan Siber",
    description: "Uji pemahamanmu mengenai pilar CIA Triad dan pentingnya mengamankan data pribadi milik masyarakat biasa.",
    questionCount: 5,
    passingScore: 70,
    xpReward: 30,
    status: "published",
    createdAt: "2026-07-19T00:00:00Z",
    updatedAt: "2026-07-19T00:00:00Z"
  },
  {
    id: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    title: "Quiz Password dan Keamanan Akun",
    description: "Evaluasi kemampuanmu membuat sandi kuat dengan taktik Passphrase, menggunakan Password Manager, dan mengaktifkan 2FA.",
    questionCount: 5,
    passingScore: 70,
    xpReward: 30,
    status: "published",
    createdAt: "2026-07-19T00:00:00Z",
    updatedAt: "2026-07-19T00:00:00Z"
  },
  {
    id: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    title: "Quiz Phishing dan Penipuan Digital",
    description: "Buktikan kepekaanmu dalam mendeteksi email phishing palsu, taktik rekayasa sosial, dan prosedur darurat penyelamatan data.",
    questionCount: 5,
    passingScore: 70,
    xpReward: 30,
    status: "published",
    createdAt: "2026-07-19T00:00:00Z",
    updatedAt: "2026-07-19T00:00:00Z"
  },
  {
    id: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    title: "Quiz Privasi dan Data Pribadi",
    description: "Uji pengetahuanmu tentang meminimalkan jejak digital aktif, mengelola pengaturan privasi medsos, dan bahaya oversharing KTP.",
    questionCount: 5,
    passingScore: 70,
    xpReward: 30,
    status: "published",
    createdAt: "2026-07-19T00:00:00Z",
    updatedAt: "2026-07-19T00:00:00Z"
  },
  ...intermediateQuizzes,
  ...advancedQuizzes,
  ...liveCatalogAdditionalQuizzes
];

export const questions: Question[] = [
  // Quiz 1: Dasar Keamanan Siber
  {
    id: "q_dks_1",
    quizId: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    questionText: "Apa tujuan utama dari aspek Confidentiality (Kerahasiaan) dalam CIA Triad?",
    options: [
      { id: "a", text: "Memastikan data hanya bisa dibaca oleh pihak yang berwenang" },
      { id: "b", text: "Memastikan data selalu bisa diakses kapan saja saat server down" },
      { id: "c", text: "Menjamin data tidak mengalami perubahan ilegal di tengah jalan" },
      { id: "d", text: "Mempercepat koneksi jaringan internet pengguna" }
    ],
    correctOptionId: "a",
    explanation: "Aspek Confidentiality (Kerahasiaan) menjamin bahwa informasi sensitif hanya dapat diakses oleh pihak yang sah dan memiliki hak akses, mencegah kebocoran informasi ke pihak lain.",
    order: 1,
    status: "published"
  },
  {
    id: "q_dks_2",
    quizId: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    questionText: "Apa yang dijamin oleh aspek Integrity (Integritas) dalam CIA Triad?",
    options: [
      { id: "a", text: "Saluran komunikasi internet dienkripsi menggunakan VPN premium" },
      { id: "b", text: "Data tetap akurat, konsisten, dan tidak diubah secara ilegal oleh pihak lain" },
      { id: "c", text: "Server tidak pernah mati atau tumbang meski sedang diserang peretas" },
      { id: "d", text: "Akun media sosial aman dari laporan (report) massal pengguna lain" }
    ],
    correctOptionId: "b",
    explanation: "Integrity (Integritas) menjamin bahwa data tetap utuh, akurat, konsisten, dan tidak dimanipulasi secara ilegal oleh pihak lain selama proses transmisi atau penyimpanan.",
    order: 2,
    status: "published"
  },
  {
    id: "q_dks_3",
    quizId: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    questionText: "Mengapa pelaku kejahatan siber juga mengincar data pribadi milik masyarakat biasa, bukan hanya pejabat tinggi?",
    options: [
      { id: "a", text: "Karena data masyarakat biasa sering disalahgunakan untuk pendaftaran pinjaman online ilegal atau spam kontak" },
      { id: "b", text: "Karena masyarakat biasa memiliki akses langsung ke server militer rahasia" },
      { id: "c", text: "Karena peretas hanya sekadar iseng tanpa motif ekonomi atau keuntungan finansial" },
      { id: "d", text: "Karena data masyarakat biasa lebih sulit dienkripsi dibandingkan data pejabat" }
    ],
    correctOptionId: "a",
    explanation: "Di pasar gelap, data milik orang biasa sangat berharga untuk disalahgunakan, seperti pendaftaran pinjol ilegal atas nama korban, spam marketing, atau pemerasan.",
    order: 3,
    status: "published"
  },
  {
    id: "q_dks_4",
    quizId: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    questionText: "Pilar ketiga dalam CIA Triad adalah Availability (Ketersediaan). Apa makna sesungguhnya dari pilar ini?",
    options: [
      { id: "a", text: "Memastikan informasi atau sistem selalu siap diakses oleh pihak berhak kapan pun saat dibutuhkan" },
      { id: "b", text: "Mengubah kata sandi secara otomatis setiap 24 jam sekali" },
      { id: "c", text: "Menyediakan layanan kuis gratis yang viral di media sosial" },
      { id: "d", text: "Membagikan seluruh data pribadi ke semua kontak secara terbuka" }
    ],
    correctOptionId: "a",
    explanation: "Availability (Ketersediaan) berarti menjamin bahwa data, aplikasi, dan sistem siber selalu dapat diakses dan digunakan dengan lancar oleh pihak yang berwenang kapan pun mereka membutuhkannya.",
    order: 4,
    status: "published"
  },
  {
    id: "q_dks_5",
    quizId: "dasar-keamanan-siber",
    courseId: "dasar-keamanan-siber",
    questionText: "Jika salah satu dari tiga aspek dalam CIA Triad runtuh, apa konsekuensi utama yang terjadi?",
    options: [
      { id: "a", text: "Terjadi celah keamanan siber yang dapat dieksploitasi oleh pihak tidak bertanggung jawab" },
      { id: "b", text: "Sistem komputer akan langsung mati secara permanen dan tidak bisa dinyalakan lagi" },
      { id: "c", text: "Pengguna akan otomatis mendapatkan bonus XP dari sistem keamanan" },
      { id: "d", text: "Akun media sosial pengguna akan dinonaktifkan secara otomatis oleh pemerintah" }
    ],
    correctOptionId: "a",
    explanation: "Keruntuhan pilar CIA Triad (baik kebocoran data, kerusakan data, maupun matinya sistem) menandakan adanya celah keamanan siber yang merugikan pengguna.",
    order: 5,
    status: "published"
  },

  // Quiz 2: Password dan Keamanan Akun
  {
    id: "q_pka_1",
    quizId: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    questionText: "Apakah taktik terbaik dalam merancang kata sandi yang tangguh menurut materi?",
    options: [
      { id: "a", text: "Menerapkan taktik Passphrase dengan menggabungkan 3-4 kata acak yang cukup panjang" },
      { id: "b", text: "Menggunakan tanggal lahir lengkap digabung dengan nama panggilan Anda" },
      { id: "c", text: "Menggunakan kata sandi pendek namun mengandung huruf kapital semua" },
      { id: "d", text: "Menulis kata sandi di kertas memo dan menempelkannya di monitor komputer Anda" }
    ],
    correctOptionId: "a",
    explanation: "Passphrase (seperti 'meja-kayu-hijau-terbang') menggabungkan beberapa kata acak sehingga menghasilkan karakter yang panjang, membuatnya sangat sulit dibobol mesin brute force namun mudah diingat manusia.",
    order: 1,
    status: "published"
  },
  {
    id: "q_pka_2",
    quizId: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    questionText: "Mengapa Two-Factor Authentication (2FA) diibaratkan sebagai benteng pertahanan kedua?",
    options: [
      { id: "a", text: "Karena 2FA hanya aktif jika kata sandi utama dinonaktifkan sementara" },
      { id: "b", text: "Karena jika kata sandi utama bocor, peretas tetap terhenti karena membutuhkan kode verifikasi fisik tambahan" },
      { id: "c", text: "Karena 2FA menjamin komputer Anda tidak akan pernah terkena virus selamanya" },
      { id: "d", text: "Karena sistem 2FA berbayar mahal sehingga keamanannya lebih tinggi" }
    ],
    correctOptionId: "b",
    explanation: "Dengan 2FA aktif, peretas yang berhasil menebak password Anda tetap tidak bisa masuk karena terhalang oleh permintaan pembuktian kedua, seperti kode sekali pakai (OTP) dari aplikasi di ponsel fisik Anda.",
    order: 2,
    status: "published"
  },
  {
    id: "q_pka_3",
    quizId: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    questionText: "Apa risiko utama dari kebiasaan menggunakan kata sandi yang sama di semua akun digital Anda?",
    options: [
      { id: "a", text: "Jika salah satu akun diretas, pelaku dapat dengan mudah membobol seluruh akun Anda lainnya" },
      { id: "b", text: "Koneksi internet Anda akan melambat secara drastis saat membuka akun tersebut" },
      { id: "c", text: "Akun Anda akan otomatis terhapus oleh sistem dalam kurun waktu 30 hari" },
      { id: "d", text: "Anda akan kesulitan mengirimkan file atau dokumen antar perangkat" }
    ],
    correctOptionId: "a",
    explanation: "Kebiasaan memakai satu password untuk semua akun (credential reuse) sangat berbahaya. Sekali satu layanan mengalami kebocoran data, peretas akan menguji password tersebut ke semua akun media sosial atau perbankan Anda.",
    order: 3,
    status: "published"
  },
  {
    id: "q_pka_4",
    quizId: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    questionText: "Bagaimana cara kerja Password Manager (Pengelola Kata Sandi) dalam mempermudah keamanan akun?",
    options: [
      { id: "a", text: "Menyimpan, menghasilkan, dan mengisi otomatis kata sandi unik yang rumit untuk setiap akun Anda" },
      { id: "b", text: "Menghapus akun media sosial yang sudah tidak pernah digunakan secara otomatis" },
      { id: "c", text: "Membagikan kata sandi Anda ke forum internet terbuka agar tidak mudah hilang" },
      { id: "d", text: "Mengubah kata sandi Anda menjadi kuis media sosial secara terjadwal" }
    ],
    correctOptionId: "a",
    explanation: "Password Manager menyimpan semua kredensial Anda dalam lemari besi digital yang terenkripsi aman. Anda hanya perlu mengingat satu 'Master Password' utama, sementara aplikasi tersebut menghasilkan sandi unik yang rumit di tiap situs.",
    order: 4,
    status: "published"
  },
  {
    id: "q_pka_5",
    quizId: "password-keamanan-akun",
    courseId: "password-keamanan-akun",
    questionText: "Di bawah ini, manakah contoh kata sandi yang paling lemah dan rentan terhadap pembobolan cepat?",
    options: [
      { id: "a", text: "password123" },
      { id: "b", text: "kucing-berlari-makan-ikan" },
      { id: "c", text: "K#9x!LmP@q2" },
      { id: "d", text: "buku-gambar-biru-tua" }
    ],
    correctOptionId: "a",
    explanation: "'password123' adalah salah satu kata sandi paling populer dan terlemah di dunia. Jenis sandi ini langsung dicoba oleh peretas dalam hitungan detik menggunakan daftar otomatis (dictionary attack).",
    order: 5,
    status: "published"
  },

  // Quiz 3: Phishing dan Penipuan Digital
  {
    id: "q_ppd_1",
    quizId: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    questionText: "Apa yang dieksploitasi oleh pelaku penipuan phishing melalui rekayasa sosial (social engineering)?",
    options: [
      { id: "a", text: "Sistem enkripsi bersertifikat militer pada server cloud perusahaan" },
      { id: "b", text: "Kelemahan emosional dan psikologis manusia seperti rasa panik, serakah, penasaran, atau patuh" },
      { id: "c", text: "Kerusakan fisik pada chip kartu SIM ponsel milik korban" },
      { id: "d", text: "Sistem pendingin pada pusat data server aplikasi resmi" }
    ],
    correctOptionId: "b",
    explanation: "Social engineering (rekayasa sosial) adalah seni memanipulasi psikologi manusia. Penipu memicu emosi korban (seperti takut diblokir atau senang menang hadiah) agar korban kehilangan kewaspadaan dan bertindak impulsif.",
    order: 1,
    status: "published"
  },
  {
    id: "q_ppd_2",
    quizId: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    questionText: "Anda menerima pesan darurat dari layanan streaming fiktif 'Netaflix' bahwa akun dibatasi, dengan tautan ke 'support@netaf1ix-billing.xyz'. Apa indikator bahayanya?",
    options: [
      { id: "a", text: "Nama pengirim tidak menggunakan huruf kapital secara keseluruhan" },
      { id: "b", text: "Alamat email pengirim menggunakan domain typo tiruan 'netaf1ix-billing.xyz'" },
      { id: "c", text: "Pesan tersebut dikirimkan pada malam hari di atas pukul 9 malam" },
      { id: "d", text: "Tautan di dalam pesan tidak memiliki warna biru cerah di layar" }
    ],
    correctOptionId: "b",
    explanation: "Indikator utama email phishing adalah ketidaksesuaian domain pengirim. Domain typo (typosquatting) seperti mengganti huruf 'l' dengan angka '1' ('netaf1ix') digunakan pelaku untuk mengelabui korban agar mengira itu domain resmi.",
    order: 2,
    status: "published"
  },
  {
    id: "q_ppd_3",
    quizId: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    questionText: "Apa tindakan penyelamatan darurat pertama jika Anda terlanjur mengklik link mencurigakan dan menginput kata sandi?",
    options: [
      { id: "a", text: "Segera ganti kata sandi akun tersebut dan aktifkan proteksi ekstra 2FA jika belum aktif" },
      { id: "b", text: "Membagikan pesan penipuan tersebut ke grup pertemanan agar mereka ikut menginput data" },
      { id: "c", text: "Mematikan jaringan listrik rumah Anda selama 24 jam penuh tanpa menyalakan HP" },
      { id: "d", text: "Membalas email pelaku dengan meminta maaf agar akun tidak diblokir" }
    ],
    correctOptionId: "a",
    explanation: "Jika Anda terlanjur menginput kredensial di situs palsu, segeralah ubah kata sandi akun asli Anda sebelum peretas sempat menggunakannya. Mengaktifkan 2FA juga akan mengunci akun Anda meski peretas mengetahui passwordnya.",
    order: 3,
    status: "published"
  },
  {
    id: "q_ppd_4",
    quizId: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    questionText: "Manakah taktik manipulasi psikologis yang paling sering digunakan dalam pesan penipuan phishing?",
    options: [
      { id: "a", text: "Memberikan waktu tenggang yang sangat santai dan tidak memaksa" },
      { id: "b", text: "Menciptakan rasa panik yang sangat mendesak atau menawarkan keuntungan besar yang tidak logis" },
      { id: "c", text: "Mengirimkan surat fisik cetak melalui kurir pos nasional" },
      { id: "d", text: "Membantu memperbaiki sistem keamanan komputer pengguna secara cuma-cuma" }
    ],
    correctOptionId: "b",
    explanation: "Urgensi mendesak ('Akun Anda akan diblokir dalam 1 jam!') atau iming-iming menggiurkan ('Anda memenangkan Rp100 juta!') didesain pelaku agar korban panik/senang berlebih dan langsung bertindak tanpa berpikir panjang.",
    order: 4,
    status: "published"
  },
  {
    id: "q_ppd_5",
    quizId: "phishing-penipuan-digital",
    courseId: "phishing-penipuan-digital",
    questionText: "Mengapa tautan (link) eksternal dari email atau chat yang tidak dikenal tidak boleh diklik secara sembarangan?",
    options: [
      { id: "a", text: "Karena tautan tersebut dapat mengarahkan Anda ke situs tiruan pencuri data sensitif atau menyusupkan malware ke perangkat Anda" },
      { id: "b", text: "Karena klik tersebut akan otomatis mengurangi sisa kuota internet Anda sampai habis" },
      { id: "c", text: "Karena layar fisik ponsel Anda bisa langsung retak jika menekan tautan palsu" },
      { id: "d", text: "Karena tautan tersebut hanya bisa dibuka jika menggunakan komputer militer khusus" }
    ],
    correctOptionId: "a",
    explanation: "Tautan mencurigakan dapat mengarahkan Anda ke situs palsu (fake login screen) yang didesain persis menyerupai aslinya demi mencuri password/OTP Anda, atau memicu unduhan aplikasi jahat (malware) secara sembunyi-semua.",
    order: 5,
    status: "published"
  },

  // Quiz 4: Privasi dan Data Pribadi
  {
    id: "q_pdp_1",
    quizId: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    questionText: "Apa bahaya utama dari tren kuis media sosial viral yang menanyakan tentang detail masa kecil Anda secara spesifik?",
    options: [
      { id: "a", text: "Kuis tersebut akan memenuhi memori penyimpanan internal ponsel Anda" },
      { id: "b", text: "Detail tersebut bisa digunakan peretas untuk menebak jawaban atas pertanyaan keamanan akun penting Anda" },
      { id: "c", text: "Kuis tersebut akan memotong sisa pulsa telepon Anda setiap kali dibagikan" },
      { id: "d", text: "Akun media sosial Anda akan otomatis diblokir oleh pemilik platform kuis" }
    ],
    correctOptionId: "b",
    explanation: "Banyak kuis media sosial (seperti 'Nama Guru Favoritmu' atau 'Hewan Peliharaan Pertamamu') adalah taktik rekayasa sosial terselubung untuk mengumpulkan jawaban atas Security Questions (Pertanyaan Keamanan) pemulihan akun perbankan atau email.",
    order: 1,
    status: "published"
  },
  {
    id: "q_pdp_2",
    quizId: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    questionText: "Mengapa pakar keamanan menyarankan agar Anda mengubah pengaturan akun media sosial menjadi privat?",
    options: [
      { id: "a", text: "Supaya postingan harian Anda otomatis mendapatkan ribuan like dari robot" },
      { id: "b", text: "Untuk membatasi siapa saja yang bisa mengintai, menganalisis, dan menyalahgunakan informasi aktivitas harian Anda" },
      { id: "c", text: "Agar tagihan internet bulanan Anda menjadi jauh lebih murah" },
      { id: "d", text: "Untuk mempercepat waktu booting awal perangkat elektronik Anda" }
    ],
    correctOptionId: "b",
    explanation: "Membiarkan akun media sosial terbuka secara publik (oversharing) memberi celah bagi peretas untuk mempelajari kebiasaan, teman dekat, dan aktivitas Anda demi melancarkan serangan rekayasa sosial yang sangat meyakinkan.",
    order: 2,
    status: "published"
  },
  {
    id: "q_pdp_3",
    quizId: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    questionText: "Apa yang dimaksud dengan konsep Jejak Digital Aktif di internet?",
    options: [
      { id: "a", text: "Data yang kita tinggalkan di internet secara sadar dan sengaja, seperti memposting foto, status, atau menulis komentar" },
      { id: "b", text: "Jejak langkah kaki fisik yang terekam kamera CCTV saat membawa ponsel berjalan" },
      { id: "c", text: "Riwayat pencarian web yang otomatis terhapus sesaat setelah kita menutup aplikasi browser" },
      { id: "d", text: "Alamat IP jaringan internet Wi-Fi yang kita pasang di rumah pribadi" }
    ],
    correctOptionId: "a",
    explanation: "Jejak digital aktif mencakup segala bentuk informasi yang dibagikan secara sengaja oleh pengguna, seperti mengunggah postingan, mengirim email, atau mengisi formulir online.",
    order: 3,
    status: "published"
  },
  {
    id: "q_pdp_4",
    quizId: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    questionText: "Mengapa kita dilarang keras mengunggah foto selfie memegang Kartu Tanda Penduduk (KTP) asli di internet?",
    options: [
      { id: "a", text: "Karena foto tersebut melanggar aturan estetika media sosial modern" },
      { id: "b", text: "Karena data NIK dan foto wajah Anda sangat rentan disalahgunakan pelaku kejahatan untuk pinjaman online ilegal" },
      { id: "c", text: "Karena sistem pencarian gambar otomatis akan langsung memblokir akun Anda" },
      { id: "d", text: "Karena warna kartu KTP tidak akan serasi dengan latar belakang feed media sosial" }
    ],
    correctOptionId: "b",
    explanation: "Foto selfie bersama KTP memuat informasi identitas utuh dan biometrik wajah. Data ini sangat diburu oleh pelaku kejahatan keuangan digital untuk melakukan registrasi pinjaman online ilegal atau penipuan perbankan atas namamu.",
    order: 4,
    status: "published"
  },
  {
    id: "q_pdp_5",
    quizId: "privasi-data-pribadi",
    courseId: "privasi-data-pribadi",
    questionText: "Apa langkah terbaik sebelum mengizinkan aplikasi pihak ketiga mengakses akun media sosial Anda?",
    options: [
      { id: "a", text: "Meneliti rincian data apa saja yang diminta oleh aplikasi tersebut, dan menolaknya jika meminta izin yang berlebihan" },
      { id: "b", text: "Menyetujui seluruh permintaan akses secepat mungkin agar game kuis bisa segera dimainkan" },
      { id: "c", text: "Menonaktifkan fitur enkripsi bawaan perangkat ponsel Anda terlebih dahulu" },
      { id: "d", text: "Menghubungi pihak berwajib terdekat untuk meminta persetujuan tertulis" }
    ],
    correctOptionId: "a",
    explanation: "Sebelum mengklik 'Setuju' pada aplikasi kuis medsos atau game pihak ketiga, baca baik-baik detail datanya. Seringkali aplikasi kuis main-main meminta akses berlebih ke kontak, email, atau profil publik yang kelak bisa disalahgunakan.",
    order: 5,
    status: "published"
  },
  ...intermediateQuestions,
  ...advancedQuestions,
  ...liveCatalogAdditionalQuestions
];

export const questionsByQuiz: Record<string, Question[]> = questions.reduce((acc, q) => {
  if (!acc[q.quizId]) acc[q.quizId] = [];
  acc[q.quizId].push(q);
  return acc;
}, {} as Record<string, Question[]>);

// Mapping question to its recommended lesson (for remedial mapping)
export const questionToLessonMap: Record<string, string> = {
  // Quiz 1
  "q_dks_1": "l-pengantar-keamanan-siber",
  "q_dks_2": "l-pengantar-keamanan-siber",
  "q_dks_3": "l-mengapa-data-berharga",
  "q_dks_4": "l-pengantar-keamanan-siber",
  "q_dks_5": "l-pengantar-keamanan-siber",
  // Quiz 2
  "q_pka_1": "l-cara-membuat-sandi-kuat",
  "q_pka_2": "l-mengenal-2fa",
  "q_pka_3": "l-cara-membuat-sandi-kuat",
  "q_pka_4": "l-cara-membuat-sandi-kuat",
  "q_pka_5": "l-cara-membuat-sandi-kuat",
  // Quiz 3
  "q_ppd_1": "l-apa-itu-phishing",
  "q_ppd_2": "l-ciri-ciri-email-phishing",
  "q_ppd_3": "l-mengapa-pelaku-phishing",
  "q_ppd_4": "l-apa-itu-phishing",
  "q_ppd_5": "l-apa-itu-phishing",
  // Quiz 4
  "q_pdp_1": "l-mengamankan-media-sosial",
  "q_pdp_2": "l-mengamankan-media-sosial",
  "q_pdp_3": "l-jejak-digital-internet",
  "q_pdp_4": "l-jejak-digital-internet",
  "q_pdp_5": "l-mengamankan-media-sosial"
};
