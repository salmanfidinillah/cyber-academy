import type { Course, Lesson, Question, Quiz } from "./types";

// Data ini berasal dari ekspor read-only Firestore produksi pada
// 2026-08-01. Document ID dan seluruh relasi katalog dipertahankan.
// Field order course dinormalisasi agar urutan jalur unik dan berurutan.
export const liveCatalogAdditionalCourses: Course[] = [
  {
    "id": "incident-response-etika",
    "learningPathId": "advanced-path",
    "title": "Incident Response & Etika Siber",
    "slug": "incident-response-etika",
    "description": "Menangani insiden secara terstruktur, menjaga bukti, berkomunikasi, dan bertindak hanya dengan izin.",
    "category": "Incident Response",
    "level": "advanced",
    "order": 11,
    "estimatedDuration": 60,
    "xpReward": 120,
    "learningOutcomes": [
      "Menjalankan tahapan respons insiden",
      "Menjaga bukti dan komunikasi",
      "Memahami batas izin dan etika"
    ],
    "lessonCount": 2,
    "status": "published"
  },
  {
    "id": "keamanan-jaringan-wifi",
    "learningPathId": "intermediate-path",
    "title": "Keamanan Jaringan & Wi-Fi",
    "slug": "keamanan-jaringan-wifi",
    "description": "Memahami jaringan lokal, risiko Wi-Fi publik, segmentasi, firewall, dan kebiasaan koneksi yang aman.",
    "category": "Network Defense",
    "level": "intermediate",
    "order": 8,
    "estimatedDuration": 60,
    "xpReward": 90,
    "learningOutcomes": [
      "Membedakan jaringan tepercaya dan berisiko",
      "Memahami firewall serta segmentasi",
      "Menerapkan koneksi Wi-Fi yang aman"
    ],
    "lessonCount": 2,
    "status": "published"
  },
  {
    "id": "keamanan-web-api",
    "learningPathId": "intermediate-path",
    "title": "Keamanan Web & API Dasar",
    "slug": "keamanan-web-api",
    "description": "Mempelajari validasi input, autentikasi, otorisasi, session, dan keamanan API secara defensif.",
    "category": "Application Security",
    "level": "intermediate",
    "order": 10,
    "estimatedDuration": 60,
    "xpReward": 90,
    "learningOutcomes": [
      "Membedakan autentikasi dan otorisasi",
      "Memvalidasi input di server",
      "Mengamankan secret dan session"
    ],
    "lessonCount": 2,
    "status": "published"
  },
  {
    "id": "kriptografi-praktis",
    "learningPathId": "advanced-path",
    "title": "Kriptografi Praktis",
    "slug": "kriptografi-praktis",
    "description": "Memilih hashing, enkripsi, TLS, dan pengelolaan kunci sesuai tujuan keamanan.",
    "category": "Cryptography",
    "level": "advanced",
    "order": 10,
    "estimatedDuration": 60,
    "xpReward": 120,
    "learningOutcomes": [
      "Membedakan hashing dan enkripsi",
      "Memahami TLS dan sertifikat",
      "Mengelola kunci secara aman"
    ],
    "lessonCount": 2,
    "status": "published"
  },
  {
    "id": "malware-ransomware-defense",
    "learningPathId": "intermediate-path",
    "title": "Malware & Ransomware Defense",
    "slug": "malware-ransomware-defense",
    "description": "Mengenali perilaku malware, mencegah infeksi, dan merespons ransomware tanpa memperparah keadaan.",
    "category": "Malware Defense",
    "level": "intermediate",
    "order": 9,
    "estimatedDuration": 60,
    "xpReward": 90,
    "learningOutcomes": [
      "Mengenali tanda infeksi",
      "Menerapkan backup 3-2-1",
      "Melakukan respons awal yang aman"
    ],
    "lessonCount": 2,
    "status": "published"
  },
  {
    "id": "owasp-risk-awareness",
    "learningPathId": "advanced-path",
    "title": "OWASP Risk Awareness",
    "slug": "owasp-risk-awareness",
    "description": "Memahami pola risiko aplikasi web dan cara menyusun mitigasi defensif berlapis.",
    "category": "Secure Engineering",
    "level": "advanced",
    "order": 9,
    "estimatedDuration": 60,
    "xpReward": 120,
    "learningOutcomes": [
      "Mengelompokkan risiko aplikasi",
      "Menerapkan secure-by-design",
      "Menyusun mitigasi berlapis"
    ],
    "lessonCount": 2,
    "status": "published"
  }
];

export const liveCatalogAdditionalLessons: Lesson[] = [
  {
    "id": "l-api-session-secret",
    "courseId": "keamanan-web-api",
    "learningPathId": "intermediate-path",
    "title": "API, Session & Secret",
    "slug": "api-session-secret",
    "order": 2,
    "objective": "Menjaga kredensial dan akses API tetap aman.",
    "content": "API harus memverifikasi token, memeriksa kepemilikan data, membatasi jumlah permintaan, dan tidak membocorkan stack trace. Session atau token perlu masa berlaku serta mekanisme pencabutan.\n\nSecret seperti API key tidak boleh ditanam di source frontend atau repository. Simpan di environment/secret manager dan berikan hanya kepada service account yang membutuhkan. Log juga harus disanitasi agar token, OTP, dan data pribadi tidak tercatat.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Gunakan rate limit untuk endpoint mahal.",
      "Rotasi secret yang terlanjur bocor."
    ],
    "keyTakeaways": [
      "Secret frontend bukan secret.",
      "API wajib memverifikasi identitas dan kepemilikan data."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-auth-validasi-server",
    "courseId": "keamanan-web-api",
    "learningPathId": "intermediate-path",
    "title": "Autentikasi, Otorisasi & Validasi",
    "slug": "auth-validasi-server",
    "order": 1,
    "objective": "Membangun batas kepercayaan yang benar pada aplikasi.",
    "content": "Autentikasi menjawab “siapa pengguna?”, sedangkan otorisasi menjawab “apa yang boleh ia lakukan?”. Keduanya harus diperiksa di server, bukan hanya dengan menyembunyikan tombol di frontend.\n\nSemua input pengguna harus dianggap tidak tepercaya. Gunakan skema validasi, batasi panjang dan tipe data, lalu gunakan query terparameterisasi. Jangan menerima role, XP, harga, atau status kelulusan langsung dari klien.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Terapkan least privilege.",
      "Tolak field yang tidak dikenal pada payload sensitif."
    ],
    "keyTakeaways": [
      "UI bukan batas keamanan.",
      "Validasi server mencegah manipulasi data klien."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-etika-disclosure",
    "courseId": "incident-response-etika",
    "learningPathId": "advanced-path",
    "title": "Etika, Izin & Responsible Disclosure",
    "slug": "etika-disclosure",
    "order": 2,
    "objective": "Melakukan pembelajaran dan pelaporan keamanan secara legal.",
    "content": "Pengujian keamanan hanya boleh dilakukan pada sistem milik sendiri atau dengan izin tertulis dan ruang lingkup yang jelas. Menemukan celah tidak memberi hak untuk mengambil data, mempertahankan akses, atau mempublikasikan detail berbahaya.\n\nResponsible disclosure berarti melaporkan temuan melalui kanal resmi, memberi waktu perbaikan yang wajar, meminimalkan data yang dikumpulkan, dan menjaga kerahasiaan. Jika ruang lingkup tidak jelas, berhenti dan minta konfirmasi.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Simpan bukti izin dan scope.",
      "Laporkan secara privat dengan langkah reproduksi minimal."
    ],
    "keyTakeaways": [
      "Izin adalah syarat mutlak.",
      "Tujuan keamanan defensif adalah mengurangi risiko, bukan membuktikan kemampuan."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  },
  {
    "id": "l-firewall-segmentasi",
    "courseId": "keamanan-jaringan-wifi",
    "learningPathId": "intermediate-path",
    "title": "Firewall & Segmentasi Dasar",
    "slug": "firewall-segmentasi",
    "order": 2,
    "objective": "Memahami cara membatasi lalu lintas dan penyebaran insiden.",
    "content": "Firewall menyaring lalu lintas berdasarkan aturan: sumber, tujuan, port, dan protokol. Prinsip yang aman adalah hanya membuka akses yang benar-benar dibutuhkan.\n\nSegmentasi memisahkan perangkat ke kelompok berbeda. Contohnya, perangkat tamu dan perangkat IoT ditempatkan pada jaringan terpisah dari laptop kerja. Jika satu perangkat terganggu, pemisahan ini membantu membatasi pergerakan ancaman. Catat perubahan aturan dan tinjau kembali aturan lama agar tidak menjadi celah.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Gunakan guest network untuk tamu dan IoT.",
      "Jangan membuka port internet tanpa kebutuhan jelas."
    ],
    "keyTakeaways": [
      "Firewall membatasi lalu lintas.",
      "Segmentasi mengurangi dampak ketika satu perangkat terinfeksi."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-hashing-enkripsi",
    "courseId": "kriptografi-praktis",
    "learningPathId": "advanced-path",
    "title": "Hashing, Enkripsi & Password",
    "slug": "hashing-enkripsi",
    "order": 1,
    "objective": "Menggunakan primitif kriptografi sesuai fungsinya.",
    "content": "Hashing bersifat satu arah dan cocok untuk verifikasi integritas. Enkripsi dapat dibalik menggunakan kunci dan cocok untuk menjaga kerahasiaan.\n\nPassword tidak disimpan dengan hash cepat biasa. Gunakan algoritme khusus password seperti Argon2, scrypt, atau bcrypt dengan salt unik. Jangan menciptakan algoritme kriptografi sendiri; gunakan library matang dan konfigurasi yang direkomendasikan.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Gunakan salt unik untuk setiap password.",
      "Jangan menyimpan password dalam plaintext."
    ],
    "keyTakeaways": [
      "Hashing dan enkripsi memiliki tujuan berbeda.",
      "Password memerlukan password hashing yang lambat."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  },
  {
    "id": "l-jaringan-dan-wifi-aman",
    "courseId": "keamanan-jaringan-wifi",
    "learningPathId": "intermediate-path",
    "title": "Jaringan dan Wi-Fi yang Aman",
    "slug": "jaringan-dan-wifi-aman",
    "order": 1,
    "objective": "Menilai keamanan koneksi sebelum mengirim data sensitif.",
    "content": "Jaringan menghubungkan perangkat agar dapat bertukar data. Pada Wi-Fi publik, kita tidak selalu mengetahui siapa pengelolanya atau siapa saja yang berada pada jaringan yang sama.\n\nSebelum memakai jaringan, periksa nama SSID, gunakan HTTPS, matikan fitur tersambung otomatis, dan hindari transaksi sensitif. VPN dapat membantu mengenkripsi jalur komunikasi, tetapi tidak mengubah situs palsu menjadi aman. Di rumah, ganti kata sandi router bawaan, gunakan WPA2 atau WPA3, dan perbarui firmware secara berkala.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Konfirmasi nama Wi-Fi resmi kepada petugas.",
      "Lupakan jaringan publik setelah selesai digunakan."
    ],
    "keyTakeaways": [
      "Wi-Fi publik harus diperlakukan sebagai jaringan tidak tepercaya.",
      "WPA2/WPA3 dan firmware terbaru memperkuat router."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-mengenali-malware",
    "courseId": "malware-ransomware-defense",
    "learningPathId": "intermediate-path",
    "title": "Mengenali Perilaku Malware",
    "slug": "mengenali-malware",
    "order": 1,
    "objective": "Mengenali indikator awal infeksi tanpa menjalankan sampel berbahaya.",
    "content": "Malware adalah perangkat lunak yang dirancang untuk merusak, memata-matai, mencuri, atau mengambil alih sistem. Tanda yang patut diperiksa antara lain proses asing, antivirus nonaktif, perubahan halaman awal browser, koneksi jaringan tidak wajar, dan file yang berubah sendiri.\n\nJangan menganalisis file mencurigakan di perangkat utama. Putuskan koneksi jaringan bila ada indikasi aktif, dokumentasikan gejala, lalu gunakan pemindai tepercaya atau bantuan tim TI.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Jangan membuka lampiran tak dikenal.",
      "Unduh perangkat lunak hanya dari sumber resmi."
    ],
    "keyTakeaways": [
      "Perilaku tidak wajar lebih penting daripada nama file.",
      "Isolasi lebih dulu sebelum investigasi."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-owasp-access-input",
    "courseId": "owasp-risk-awareness",
    "learningPathId": "advanced-path",
    "title": "Broken Access & Injection",
    "slug": "owasp-access-input",
    "order": 1,
    "objective": "Mencegah akses lintas pengguna dan input menjadi perintah.",
    "content": "Broken access control terjadi saat pengguna dapat melihat atau mengubah sumber daya di luar haknya. Setiap request harus memeriksa role dan kepemilikan objek.\n\nInjection terjadi ketika input pengguna diperlakukan sebagai perintah. Gunakan API/query terparameterisasi, validasi skema, encoding sesuai konteks, dan jangan membangun perintah dari string mentah. Pengujian harus dilakukan pada lingkungan yang berizin.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Uji akses horizontal dan vertikal.",
      "Gunakan parameterized query."
    ],
    "keyTakeaways": [
      "ID objek bukan bukti kepemilikan.",
      "Pisahkan data dari perintah."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  },
  {
    "id": "l-ransomware-backup",
    "courseId": "malware-ransomware-defense",
    "learningPathId": "intermediate-path",
    "title": "Ransomware & Strategi Backup",
    "slug": "ransomware-backup",
    "order": 2,
    "objective": "Mencegah kehilangan data dan menyiapkan pemulihan.",
    "content": "Ransomware mengenkripsi atau mengunci data lalu meminta tebusan. Pembayaran tidak menjamin data kembali dan dapat mendanai serangan berikutnya.\n\nGunakan strategi backup 3-2-1: tiga salinan data, pada dua jenis media, dengan satu salinan berada offline atau di lokasi berbeda. Uji proses pemulihan secara berkala. Jika ransomware terdeteksi, isolasi perangkat, jangan menghapus bukti, dan laporkan kepada penanggung jawab.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Pastikan backup tidak selalu terhubung ke perangkat.",
      "Uji restore, bukan hanya membuat backup."
    ],
    "keyTakeaways": [
      "Backup teruji adalah pertahanan penting terhadap ransomware.",
      "Respons awal: isolasi, catat, dan eskalasi."
    ],
    "estimatedDuration": 20,
    "xpReward": 25,
    "status": "published"
  },
  {
    "id": "l-secure-design-dependencies",
    "courseId": "owasp-risk-awareness",
    "learningPathId": "advanced-path",
    "title": "Secure Design & Dependencies",
    "slug": "secure-design-dependencies",
    "order": 2,
    "objective": "Mengelola risiko desain dan rantai pasok perangkat lunak.",
    "content": "Secure-by-design dimulai dengan threat modeling: aset apa yang dilindungi, siapa aktornya, batas kepercayaan, dan bagaimana kegagalan ditangani. Default harus aman dan tindakan sensitif memerlukan verifikasi tambahan.\n\nDependency perlu dikunci versinya, dipindai, dan diperbarui terencana. Minimalkan paket yang tidak perlu, tinjau sumber paket, serta gunakan lockfile. Jangan menjalankan perbaikan otomatis yang mengubah versi mayor tanpa pengujian.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Catat trust boundary sejak desain.",
      "Tinjau dependensi dan lockfile secara rutin."
    ],
    "keyTakeaways": [
      "Banyak celah berasal dari keputusan desain.",
      "Rantai pasok adalah bagian dari permukaan serangan."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  },
  {
    "id": "l-siklus-respons-insiden",
    "courseId": "incident-response-etika",
    "learningPathId": "advanced-path",
    "title": "Siklus Respons Insiden",
    "slug": "siklus-respons-insiden",
    "order": 1,
    "objective": "Mengelola insiden dari persiapan sampai perbaikan.",
    "content": "Respons insiden mencakup persiapan, identifikasi, containment, eradication, recovery, dan lessons learned. Prioritas awal adalah keselamatan, pembatasan dampak, serta pelestarian bukti.\n\nJangan terburu-buru menghapus file atau mematikan sistem kritis tanpa menilai dampaknya. Catat waktu, indikator, keputusan, dan pihak yang terlibat. Setelah pulih, lakukan evaluasi akar masalah dan perbarui kontrol.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Siapkan daftar kontak dan playbook sebelum insiden.",
      "Gunakan catatan waktu yang konsisten."
    ],
    "keyTakeaways": [
      "Respons insiden adalah proses terstruktur.",
      "Lessons learned mencegah kejadian berulang."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  },
  {
    "id": "l-tls-key-management",
    "courseId": "kriptografi-praktis",
    "learningPathId": "advanced-path",
    "title": "TLS & Pengelolaan Kunci",
    "slug": "tls-key-management",
    "order": 2,
    "objective": "Menjaga komunikasi dan kunci kriptografi.",
    "content": "TLS melindungi komunikasi antara klien dan server serta membantu memverifikasi identitas server melalui sertifikat. Peringatan sertifikat tidak boleh diabaikan.\n\nKunci perlu dibuat dengan sumber acak yang aman, disimpan di secret manager/KMS, dibatasi aksesnya, dirotasi, dan dapat dicabut. Pisahkan kunci per lingkungan. Jangan mencatat secret ke log atau memasukkannya ke image container.",
    "exampleCase": {
      "title": "Latihan Keputusan Defensif",
      "description": "Terapkan konsep pada lingkungan lab atau sistem yang Anda miliki dan telah diizinkan."
    },
    "securityTips": [
      "Aktifkan HTTPS dan redirect HTTP.",
      "Gunakan KMS/secret manager untuk kunci."
    ],
    "keyTakeaways": [
      "TLS melindungi data saat transit.",
      "Keamanan enkripsi bergantung pada pengelolaan kunci."
    ],
    "estimatedDuration": 20,
    "xpReward": 30,
    "status": "published"
  }
];

export const liveCatalogAdditionalQuizzes: Quiz[] = [
  {
    "id": "incident-response-etika",
    "courseId": "incident-response-etika",
    "title": "Quiz Incident Response & Etika Siber",
    "description": "Evaluasi pemahaman defensif untuk Incident Response & Etika Siber.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 50,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  },
  {
    "id": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "title": "Quiz Keamanan Jaringan & Wi-Fi",
    "description": "Evaluasi pemahaman defensif untuk Keamanan Jaringan & Wi-Fi.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 40,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  },
  {
    "id": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "title": "Quiz Keamanan Web & API Dasar",
    "description": "Evaluasi pemahaman defensif untuk Keamanan Web & API Dasar.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 40,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  },
  {
    "id": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "title": "Quiz Kriptografi Praktis",
    "description": "Evaluasi pemahaman defensif untuk Kriptografi Praktis.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 50,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  },
  {
    "id": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "title": "Quiz Malware & Ransomware Defense",
    "description": "Evaluasi pemahaman defensif untuk Malware & Ransomware Defense.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 40,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  },
  {
    "id": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "title": "Quiz OWASP Risk Awareness",
    "description": "Evaluasi pemahaman defensif untuk OWASP Risk Awareness.",
    "questionCount": 5,
    "passingScore": 70,
    "xpReward": 50,
    "status": "published",
    "createdAt": "2026-07-27T13:52:15.426Z",
    "updatedAt": "2026-07-27T13:52:15.426Z"
  }
];

export const liveCatalogAdditionalQuestions: Question[] = [
  {
    "id": "q_incident_response_etika_1",
    "quizId": "incident-response-etika",
    "courseId": "incident-response-etika",
    "questionText": "Tahap setelah identifikasi biasanya?",
    "options": [
      {
        "id": "a",
        "text": "Containment"
      },
      {
        "id": "b",
        "text": "Marketing"
      },
      {
        "id": "c",
        "text": "Menghapus semua bukti"
      },
      {
        "id": "d",
        "text": "Publikasi"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Containment membatasi dampak sebelum eradication dan recovery.",
    "recommendedLessonId": "l-siklus-respons-insiden",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_incident_response_etika_2",
    "quizId": "incident-response-etika",
    "courseId": "incident-response-etika",
    "questionText": "Mengapa bukti perlu dijaga?",
    "options": [
      {
        "id": "a",
        "text": "Untuk memperbesar file"
      },
      {
        "id": "b",
        "text": "Mendukung analisis dan akuntabilitas"
      },
      {
        "id": "c",
        "text": "Agar sistem lambat"
      },
      {
        "id": "d",
        "text": "Untuk dibagikan publik"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Bukti membantu memahami kejadian dan keputusan respons.",
    "recommendedLessonId": "l-siklus-respons-insiden",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_incident_response_etika_3",
    "quizId": "incident-response-etika",
    "courseId": "incident-response-etika",
    "questionText": "Kapan pengujian keamanan boleh dilakukan?",
    "options": [
      {
        "id": "a",
        "text": "Kapan saja"
      },
      {
        "id": "b",
        "text": "Pada sistem sendiri atau dengan izin tertulis"
      },
      {
        "id": "c",
        "text": "Jika penasaran"
      },
      {
        "id": "d",
        "text": "Saat admin offline"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Otorisasi dan scope adalah batas legal serta etis.",
    "recommendedLessonId": "l-siklus-respons-insiden",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_incident_response_etika_4",
    "quizId": "incident-response-etika",
    "courseId": "incident-response-etika",
    "questionText": "Jika scope pengujian tidak jelas, tindakan benar?",
    "options": [
      {
        "id": "a",
        "text": "Terus mencoba"
      },
      {
        "id": "b",
        "text": "Berhenti dan minta konfirmasi"
      },
      {
        "id": "c",
        "text": "Ambil data"
      },
      {
        "id": "d",
        "text": "Publikasikan celah"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Ambiguitas scope harus diselesaikan sebelum melanjutkan.",
    "recommendedLessonId": "l-etika-disclosure",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_incident_response_etika_5",
    "quizId": "incident-response-etika",
    "courseId": "incident-response-etika",
    "questionText": "Tujuan lessons learned?",
    "options": [
      {
        "id": "a",
        "text": "Menyalahkan individu"
      },
      {
        "id": "b",
        "text": "Memperbaiki kontrol dan mencegah kejadian berulang"
      },
      {
        "id": "c",
        "text": "Menghapus log"
      },
      {
        "id": "d",
        "text": "Menutup komunikasi"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Evaluasi pascainsiden mengubah temuan menjadi perbaikan.",
    "recommendedLessonId": "l-etika-disclosure",
    "order": 5,
    "status": "published"
  },
  {
    "id": "q_keamanan_jaringan_wifi_1",
    "quizId": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "questionText": "Apa tindakan paling aman saat memakai Wi-Fi publik?",
    "options": [
      {
        "id": "a",
        "text": "Melakukan transfer bank segera"
      },
      {
        "id": "b",
        "text": "Memastikan HTTPS dan menghindari aktivitas sensitif"
      },
      {
        "id": "c",
        "text": "Mematikan kata sandi perangkat"
      },
      {
        "id": "d",
        "text": "Membagikan hotspot ke semua orang"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Wi-Fi publik tidak sepenuhnya tepercaya; batasi aktivitas sensitif dan pastikan koneksi terenkripsi.",
    "recommendedLessonId": "l-jaringan-dan-wifi-aman",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_keamanan_jaringan_wifi_2",
    "quizId": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "questionText": "Standar keamanan Wi-Fi yang disarankan?",
    "options": [
      {
        "id": "a",
        "text": "WEP"
      },
      {
        "id": "b",
        "text": "WPA2 atau WPA3"
      },
      {
        "id": "c",
        "text": "Jaringan tanpa sandi"
      },
      {
        "id": "d",
        "text": "SSID tersembunyi saja"
      }
    ],
    "correctOptionId": "b",
    "explanation": "WPA2/WPA3 menyediakan perlindungan yang jauh lebih kuat daripada WEP.",
    "recommendedLessonId": "l-jaringan-dan-wifi-aman",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_keamanan_jaringan_wifi_3",
    "quizId": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "questionText": "Tujuan segmentasi jaringan adalah?",
    "options": [
      {
        "id": "a",
        "text": "Memperbesar layar"
      },
      {
        "id": "b",
        "text": "Membatasi penyebaran ancaman"
      },
      {
        "id": "c",
        "text": "Menghapus log"
      },
      {
        "id": "d",
        "text": "Menonaktifkan router"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Segmentasi memisahkan aset sehingga insiden tidak mudah menyebar.",
    "recommendedLessonId": "l-jaringan-dan-wifi-aman",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_keamanan_jaringan_wifi_4",
    "quizId": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "questionText": "Apa fungsi utama firewall?",
    "options": [
      {
        "id": "a",
        "text": "Mengganti baterai"
      },
      {
        "id": "b",
        "text": "Menyaring lalu lintas jaringan"
      },
      {
        "id": "c",
        "text": "Membuat password"
      },
      {
        "id": "d",
        "text": "Mempercepat CPU"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Firewall menerapkan aturan terhadap lalu lintas masuk dan keluar.",
    "recommendedLessonId": "l-firewall-segmentasi",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_keamanan_jaringan_wifi_5",
    "quizId": "keamanan-jaringan-wifi",
    "courseId": "keamanan-jaringan-wifi",
    "questionText": "Mengapa firmware router perlu diperbarui?",
    "options": [
      {
        "id": "a",
        "text": "Agar warna berubah"
      },
      {
        "id": "b",
        "text": "Untuk menutup kerentanan dan memperbaiki bug"
      },
      {
        "id": "c",
        "text": "Agar SSID hilang"
      },
      {
        "id": "d",
        "text": "Supaya internet gratis"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Pembaruan firmware sering membawa perbaikan keamanan.",
    "recommendedLessonId": "l-firewall-segmentasi",
    "order": 5,
    "status": "published"
  },
  {
    "id": "q_keamanan_web_api_1",
    "quizId": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "questionText": "Autorisasi menjawab pertanyaan?",
    "options": [
      {
        "id": "a",
        "text": "Siapa pengguna"
      },
      {
        "id": "b",
        "text": "Apa yang boleh dilakukan pengguna"
      },
      {
        "id": "c",
        "text": "Berapa ukuran layar"
      },
      {
        "id": "d",
        "text": "Apa warna tombol"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Otorisasi menentukan hak akses setelah identitas diketahui.",
    "recommendedLessonId": "l-auth-validasi-server",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_keamanan_web_api_2",
    "quizId": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "questionText": "Di mana validasi sensitif wajib dilakukan?",
    "options": [
      {
        "id": "a",
        "text": "Server"
      },
      {
        "id": "b",
        "text": "CSS"
      },
      {
        "id": "c",
        "text": "Hanya browser"
      },
      {
        "id": "d",
        "text": "Nama file"
      }
    ],
    "correctOptionId": "a",
    "explanation": "Klien dapat dimodifikasi sehingga server harus menjadi sumber kebenaran.",
    "recommendedLessonId": "l-auth-validasi-server",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_keamanan_web_api_3",
    "quizId": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "questionText": "Di mana API key backend disimpan?",
    "options": [
      {
        "id": "a",
        "text": "Source frontend"
      },
      {
        "id": "b",
        "text": "Secret manager/environment server"
      },
      {
        "id": "c",
        "text": "Judul halaman"
      },
      {
        "id": "d",
        "text": "LocalStorage publik"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Secret server harus dikelola di lingkungan backend.",
    "recommendedLessonId": "l-auth-validasi-server",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_keamanan_web_api_4",
    "quizId": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "questionText": "Tujuan rate limiting?",
    "options": [
      {
        "id": "a",
        "text": "Mengubah font"
      },
      {
        "id": "b",
        "text": "Membatasi penyalahgunaan dan beban berlebih"
      },
      {
        "id": "c",
        "text": "Menghapus autentikasi"
      },
      {
        "id": "d",
        "text": "Membuka semua endpoint"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Rate limit membantu melawan spam dan penggunaan berlebihan.",
    "recommendedLessonId": "l-api-session-secret",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_keamanan_web_api_5",
    "quizId": "keamanan-web-api",
    "courseId": "keamanan-web-api",
    "questionText": "Prinsip least privilege berarti?",
    "options": [
      {
        "id": "a",
        "text": "Semua orang admin"
      },
      {
        "id": "b",
        "text": "Akses minimum sesuai kebutuhan"
      },
      {
        "id": "c",
        "text": "Tanpa password"
      },
      {
        "id": "d",
        "text": "Data selalu publik"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Pengguna dan layanan hanya memperoleh izin yang diperlukan.",
    "recommendedLessonId": "l-api-session-secret",
    "order": 5,
    "status": "published"
  },
  {
    "id": "q_kriptografi_praktis_1",
    "quizId": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "questionText": "Hashing umumnya bersifat?",
    "options": [
      {
        "id": "a",
        "text": "Dua arah"
      },
      {
        "id": "b",
        "text": "Satu arah"
      },
      {
        "id": "c",
        "text": "Tanpa output"
      },
      {
        "id": "d",
        "text": "Hanya visual"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Hash dirancang tidak mudah dibalik ke input asli.",
    "recommendedLessonId": "l-hashing-enkripsi",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_kriptografi_praktis_2",
    "quizId": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "questionText": "Algoritme yang tepat untuk password?",
    "options": [
      {
        "id": "a",
        "text": "MD5 cepat"
      },
      {
        "id": "b",
        "text": "Argon2/bcrypt/scrypt"
      },
      {
        "id": "c",
        "text": "Base64"
      },
      {
        "id": "d",
        "text": "Plaintext"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Password hashing yang lambat dan salted menghambat brute force.",
    "recommendedLessonId": "l-hashing-enkripsi",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_kriptografi_praktis_3",
    "quizId": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "questionText": "Fungsi TLS?",
    "options": [
      {
        "id": "a",
        "text": "Mewarnai halaman"
      },
      {
        "id": "b",
        "text": "Melindungi data saat transit dan identitas server"
      },
      {
        "id": "c",
        "text": "Menghapus autentikasi"
      },
      {
        "id": "d",
        "text": "Mengganti CPU"
      }
    ],
    "correctOptionId": "b",
    "explanation": "TLS mengenkripsi komunikasi dan menggunakan sertifikat.",
    "recommendedLessonId": "l-hashing-enkripsi",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_kriptografi_praktis_4",
    "quizId": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "questionText": "Kunci produksi sebaiknya disimpan di?",
    "options": [
      {
        "id": "a",
        "text": "Repository publik"
      },
      {
        "id": "b",
        "text": "Secret manager/KMS"
      },
      {
        "id": "c",
        "text": "HTML"
      },
      {
        "id": "d",
        "text": "Nama branch"
      }
    ],
    "correctOptionId": "b",
    "explanation": "KMS/secret manager memberikan kontrol akses dan audit.",
    "recommendedLessonId": "l-tls-key-management",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_kriptografi_praktis_5",
    "quizId": "kriptografi-praktis",
    "courseId": "kriptografi-praktis",
    "questionText": "Salt password harus?",
    "options": [
      {
        "id": "a",
        "text": "Sama untuk semua"
      },
      {
        "id": "b",
        "text": "Unik untuk setiap password"
      },
      {
        "id": "c",
        "text": "Dihapus"
      },
      {
        "id": "d",
        "text": "Menjadi nama user"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Salt unik menghambat tabel hash pra-komputasi.",
    "recommendedLessonId": "l-tls-key-management",
    "order": 5,
    "status": "published"
  },
  {
    "id": "q_malware_ransomware_defense_1",
    "quizId": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "questionText": "Apa respons awal saat indikasi malware aktif?",
    "options": [
      {
        "id": "a",
        "text": "Mengirim file ke teman"
      },
      {
        "id": "b",
        "text": "Mengisolasi perangkat dari jaringan"
      },
      {
        "id": "c",
        "text": "Mematikan antivirus"
      },
      {
        "id": "d",
        "text": "Mengunggah semua data"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Isolasi membantu menghentikan komunikasi dan penyebaran.",
    "recommendedLessonId": "l-mengenali-malware",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_malware_ransomware_defense_2",
    "quizId": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "questionText": "Arti backup 3-2-1?",
    "options": [
      {
        "id": "a",
        "text": "3 password, 2 email, 1 akun"
      },
      {
        "id": "b",
        "text": "3 salinan, 2 media, 1 offsite/offline"
      },
      {
        "id": "c",
        "text": "3 cloud gratis"
      },
      {
        "id": "d",
        "text": "Backup setiap 321 hari"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Strategi 3-2-1 mengurangi risiko satu kegagalan menghancurkan semua salinan.",
    "recommendedLessonId": "l-mengenali-malware",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_malware_ransomware_defense_3",
    "quizId": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "questionText": "Mengapa restore perlu diuji?",
    "options": [
      {
        "id": "a",
        "text": "Agar file lebih besar"
      },
      {
        "id": "b",
        "text": "Memastikan backup benar-benar dapat dipulihkan"
      },
      {
        "id": "c",
        "text": "Agar internet cepat"
      },
      {
        "id": "d",
        "text": "Untuk menonaktifkan log"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Backup yang tidak bisa dipulihkan tidak memberi perlindungan nyata.",
    "recommendedLessonId": "l-mengenali-malware",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_malware_ransomware_defense_4",
    "quizId": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "questionText": "File mencurigakan sebaiknya dianalisis di?",
    "options": [
      {
        "id": "a",
        "text": "Laptop utama"
      },
      {
        "id": "b",
        "text": "Lingkungan sandbox terisolasi"
      },
      {
        "id": "c",
        "text": "Ponsel keluarga"
      },
      {
        "id": "d",
        "text": "Komputer kasir"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Sandbox membatasi dampak perilaku berbahaya.",
    "recommendedLessonId": "l-ransomware-backup",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_malware_ransomware_defense_5",
    "quizId": "malware-ransomware-defense",
    "courseId": "malware-ransomware-defense",
    "questionText": "Apakah membayar tebusan menjamin data kembali?",
    "options": [
      {
        "id": "a",
        "text": "Ya selalu"
      },
      {
        "id": "b",
        "text": "Tidak"
      },
      {
        "id": "c",
        "text": "Hanya akhir pekan"
      },
      {
        "id": "d",
        "text": "Jika tanpa backup"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Pelaku tidak memberi jaminan pemulihan walaupun tebusan dibayar.",
    "recommendedLessonId": "l-ransomware-backup",
    "order": 5,
    "status": "published"
  },
  {
    "id": "q_owasp_risk_awareness_1",
    "quizId": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "questionText": "Apa yang harus diperiksa pada setiap akses objek?",
    "options": [
      {
        "id": "a",
        "text": "Warna tema"
      },
      {
        "id": "b",
        "text": "Role dan kepemilikan"
      },
      {
        "id": "c",
        "text": "Ukuran browser"
      },
      {
        "id": "d",
        "text": "Nama Wi-Fi"
      }
    ],
    "correctOptionId": "b",
    "explanation": "ID objek saja tidak membuktikan bahwa pengguna berhak mengaksesnya.",
    "recommendedLessonId": "l-owasp-access-input",
    "order": 1,
    "status": "published"
  },
  {
    "id": "q_owasp_risk_awareness_2",
    "quizId": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "questionText": "Pencegahan injection utama?",
    "options": [
      {
        "id": "a",
        "text": "Menyatukan input dan query"
      },
      {
        "id": "b",
        "text": "Query terparameterisasi"
      },
      {
        "id": "c",
        "text": "Menonaktifkan log"
      },
      {
        "id": "d",
        "text": "Memakai font khusus"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Parameterized query memisahkan data dari instruksi.",
    "recommendedLessonId": "l-owasp-access-input",
    "order": 2,
    "status": "published"
  },
  {
    "id": "q_owasp_risk_awareness_3",
    "quizId": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "questionText": "Threat modeling dimulai dari?",
    "options": [
      {
        "id": "a",
        "text": "Memilih animasi"
      },
      {
        "id": "b",
        "text": "Mengidentifikasi aset dan batas kepercayaan"
      },
      {
        "id": "c",
        "text": "Menghapus tes"
      },
      {
        "id": "d",
        "text": "Membuka semua port"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Aset, aktor, dan trust boundary membantu memetakan risiko.",
    "recommendedLessonId": "l-owasp-access-input",
    "order": 3,
    "status": "published"
  },
  {
    "id": "q_owasp_risk_awareness_4",
    "quizId": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "questionText": "Mengapa lockfile penting?",
    "options": [
      {
        "id": "a",
        "text": "Mengunci layar"
      },
      {
        "id": "b",
        "text": "Menjaga versi dependency konsisten"
      },
      {
        "id": "c",
        "text": "Menghapus lisensi"
      },
      {
        "id": "d",
        "text": "Membuat token"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Lockfile membuat instalasi lebih dapat diprediksi.",
    "recommendedLessonId": "l-secure-design-dependencies",
    "order": 4,
    "status": "published"
  },
  {
    "id": "q_owasp_risk_awareness_5",
    "quizId": "owasp-risk-awareness",
    "courseId": "owasp-risk-awareness",
    "questionText": "Default yang aman berarti?",
    "options": [
      {
        "id": "a",
        "text": "Akses terbuka"
      },
      {
        "id": "b",
        "text": "Fitur sensitif dibatasi sampai diizinkan"
      },
      {
        "id": "c",
        "text": "Semua role admin"
      },
      {
        "id": "d",
        "text": "Tidak ada validasi"
      }
    ],
    "correctOptionId": "b",
    "explanation": "Secure defaults mengurangi risiko salah konfigurasi.",
    "recommendedLessonId": "l-secure-design-dependencies",
    "order": 5,
    "status": "published"
  }
];
