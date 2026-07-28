import { Course, Lesson, Question, Quiz } from "./types";

const PUBLISHED_AT = "2026-07-27T00:00:00Z";
const INTERMEDIATE_PATH_ID = "intermediate-path";

type LessonBlueprint = {
  id: string;
  courseId: string;
  title: string;
  objective: string;
  topics: string[];
  example: string;
  commonMistake: string;
  tips: string[];
  exercise: string;
  minutes?: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLessonContent(blueprint: LessonBlueprint) {
  const concepts = blueprint.topics
    .map((topic, index) => `${index + 1}. **${topic}** — pahami fungsi, risiko, dan cara penggunaan defensifnya.`)
    .join("\n");
  const checklist = blueprint.tips.map((tip) => `- ${tip}`).join("\n");

  return `**Tujuan Pembelajaran**
${blueprint.objective}

**Pendahuluan**
Materi ini membawa konsep keamanan siber dari situasi sehari-hari menuju keputusan defensif yang dapat kamu terapkan. Istilah teknis dijelaskan melalui fungsi dan risikonya, bukan melalui langkah menyerang sistem.

**Konsep Utama**
${concepts}

**Contoh Sederhana**
${blueprint.example}

**Studi Kasus**
Bayangkan kamu bertanggung jawab menjaga layanan kecil milik sekolah atau organisasi. Identifikasi aset yang perlu dilindungi, risiko yang paling mungkin terjadi, lalu pilih kontrol paling sederhana yang mengurangi risiko tanpa mengganggu pengguna.

**Kesalahan Umum**
${blueprint.commonMistake}

**Checklist Keamanan**
${checklist}

**Ringkasan**
Keamanan yang baik lahir dari keputusan berlapis: memahami konteks, memverifikasi bukti, membatasi akses, mencatat kejadian, dan menyiapkan pemulihan.

**Mini Latihan**
${blueprint.exercise}

Tuliskan pilihanmu beserta satu alasan. Cocokkan kembali dengan checklist sebelum menandai materi selesai.`;
}

const courseBlueprints = [
  {
    id: "int-keamanan-jaringan-dasar",
    title: "Keamanan Jaringan Dasar",
    description: "Memahami komunikasi jaringan, protocol, port, dan perlindungan koneksi secara defensif.",
    category: "Network Defense",
    minutes: 105,
    outcomes: ["Mengenali komponen jaringan", "Menilai risiko protocol dan port", "Memilih perlindungan jaringan yang tepat"],
  },
  {
    id: "int-keamanan-aplikasi-web",
    title: "Dasar Keamanan Aplikasi Web",
    description: "Memahami alur browser-server, session, validasi input, dan ancaman web secara konseptual.",
    category: "Web Defense",
    minutes: 120,
    outcomes: ["Membaca alur request dan response", "Menjaga session dengan aman", "Menerapkan validasi berlapis"],
  },
  {
    id: "int-authentication-authorization",
    title: "Authentication dan Authorization",
    description: "Membedakan identitas dan hak akses serta merancang perlindungan akun yang lebih kuat.",
    category: "Identity Security",
    minutes: 90,
    outcomes: ["Membedakan authentication dan authorization", "Memilih kontrol akun yang aman", "Mencegah penyalahgunaan hak akses"],
  },
  {
    id: "int-owasp-top-10-pemula",
    title: "OWASP Top 10 untuk Pemula",
    description: "Mengenali sepuluh kategori risiko aplikasi web dan cara mitigasinya tanpa praktik eksploitasi.",
    category: "Application Security",
    minutes: 150,
    outcomes: ["Menjelaskan risiko OWASP dengan bahasa sederhana", "Mengenali indikator defensif", "Memilih mitigasi yang sesuai"],
  },
  {
    id: "int-social-engineering-scam",
    title: "Social Engineering dan Scam Digital",
    description: "Mengenali manipulasi psikologis pada phishing, smishing, vishing, APK palsu, dan transfer mendesak.",
    category: "Human Defense",
    minutes: 105,
    outcomes: ["Mengenali pola manipulasi", "Memverifikasi identitas lewat kanal resmi", "Merespons scam dengan aman"],
  },
  {
    id: "int-dasar-cryptography",
    title: "Dasar Cryptography",
    description: "Membedakan encoding, encryption, hashing, tanda tangan digital, certificate, dan HTTPS.",
    category: "Data Protection",
    minutes: 105,
    outcomes: ["Membedakan encoding, encryption, dan hashing", "Memahami kunci publik dan privat", "Menilai penyimpanan password yang aman"],
  },
  {
    id: "int-incident-response-dasar",
    title: "Incident Response Dasar",
    description: "Berlatih menyiapkan, mengidentifikasi, menahan, memulihkan, dan mempelajari insiden.",
    category: "Incident Response",
    minutes: 105,
    outcomes: ["Mengurutkan tahapan respons insiden", "Menjaga bukti dan dokumentasi", "Memilih komunikasi insiden yang tepat"],
  },
] as const;

export const intermediateCourses: Course[] = courseBlueprints.map((course, index) => ({
  id: course.id,
  learningPathId: INTERMEDIATE_PATH_ID,
  title: course.title,
  slug: course.id,
  description: course.description,
  category: course.category,
  level: "intermediate",
  order: index + 1,
  estimatedDuration: course.minutes,
  xpReward: [60, 70, 60, 80, 70, 70, 90][index],
  learningOutcomes: [...course.outcomes],
  lessonCount: 0,
  status: "published",
}));

const lessonBlueprints: LessonBlueprint[] = [
  {
    id: "int-net-01",
    courseId: "int-keamanan-jaringan-dasar",
    title: "Modul 1 — Dasar Komunikasi Jaringan",
    objective: "Menjelaskan jaringan komputer, LAN, WAN, internet, IP address, MAC address, DNS, router, gateway, dan hubungan antarkomponen.",
    topics: ["Jaringan komputer", "LAN, WAN, dan internet", "IP address", "MAC address", "DNS", "Router dan gateway"],
    example: "DNS bekerja seperti buku kontak: nama situs diterjemahkan menjadi alamat IP agar perangkat mengetahui tujuan koneksi.",
    commonMistake: "Menganggap alamat IP atau nama Wi-Fi saja sudah membuktikan bahwa sebuah jaringan tepercaya.",
    tips: ["Verifikasi nama jaringan sebelum tersambung", "Hindari membagikan konfigurasi jaringan sensitif", "Gunakan DNS dan router yang dikelola pihak tepercaya"],
    exercise: "Petakan perjalanan data ketika ponsel membuka situs sekolah: perangkat → router/gateway → DNS → server.",
  },
  {
    id: "int-net-02",
    courseId: "int-keamanan-jaringan-dasar",
    title: "Modul 2 — Protocol dan Port",
    objective: "Membedakan TCP, UDP, HTTP, HTTPS, FTP, SFTP, SMTP, SSH, serta memahami bahwa port terbuka memperluas permukaan risiko.",
    topics: ["TCP dan UDP", "HTTP dan HTTPS", "FTP dan SFTP", "SMTP", "SSH", "Port umum dan risikonya"],
    example: "HTTPS menambahkan perlindungan terenkripsi pada lalu lintas web, sedangkan HTTP biasa tidak memberikan perlindungan yang setara.",
    commonMistake: "Mengira port umum selalu aman atau setiap port terbuka pasti berbahaya tanpa melihat kebutuhan layanan.",
    tips: ["Buka hanya layanan yang dibutuhkan", "Gunakan protocol terenkripsi", "Catat dan pantau perubahan layanan jaringan"],
    exercise: "Pilih protocol paling aman untuk administrasi jarak jauh dan jelaskan mengapa FTP biasa bukan pilihan yang tepat.",
  },
  {
    id: "int-net-03",
    courseId: "int-keamanan-jaringan-dasar",
    title: "Modul 3 — Perlindungan Jaringan",
    objective: "Memilih firewall, segmentasi, VPN, keamanan Wi-Fi, dan least privilege sesuai risiko.",
    topics: ["Firewall", "Network segmentation", "VPN", "Wi-Fi security", "Public Wi-Fi", "Principle of least privilege"],
    example: "Jaringan tamu dipisahkan dari jaringan staf agar perangkat tamu tidak dapat langsung mengakses sistem internal.",
    commonMistake: "Menganggap VPN membuat semua aktivitas otomatis aman meski pengguna tetap membuka situs palsu.",
    tips: ["Pisahkan perangkat tamu dan penting", "Gunakan WPA2/WPA3 serta sandi kuat", "Hindari transaksi sensitif di Wi-Fi publik"],
    exercise: "Susun tiga kontrol untuk kafe yang menyediakan Wi-Fi tamu tetapi memiliki komputer kasir pada lokasi yang sama.",
  },
  {
    id: "int-web-01",
    courseId: "int-keamanan-aplikasi-web",
    title: "Modul 1 — Cara Kerja Aplikasi Web",
    objective: "Menjelaskan browser, server, request, response, header, status code, form, dan input pengguna.",
    topics: ["Browser dan server", "HTTP request", "HTTP response", "Header", "Status code", "Form dan input"],
    example: "Saat formulir login dikirim, browser membuat request; server memvalidasi data lalu mengirim response beserta status code.",
    commonMistake: "Menganggap data yang tidak terlihat di layar tidak dapat diubah oleh pengguna.",
    tips: ["Anggap semua input dari client tidak tepercaya", "Gunakan HTTPS", "Jangan bocorkan detail internal melalui pesan error"],
    exercise: "Identifikasi bagian request yang tetap harus divalidasi server walaupun form sudah memiliki validasi browser.",
  },
  {
    id: "int-web-02",
    courseId: "int-keamanan-aplikasi-web",
    title: "Modul 2 — Session dan Cookie",
    objective: "Memahami session, cookie, authentication token, expiration, dan logout yang aman.",
    topics: ["Session", "Cookie", "Authentication token", "Session expiration", "Logout yang aman"],
    example: "Token session seperti kartu akses sementara: harus sulit ditebak, punya masa berlaku, dan dicabut saat logout.",
    commonMistake: "Menyimpan token sensitif tanpa perlindungan atau membiarkan session aktif tanpa batas waktu.",
    tips: ["Gunakan cookie Secure dan HttpOnly bila sesuai", "Rotasi session setelah login", "Cabut session saat logout atau perubahan password"],
    exercise: "Tentukan apa yang seharusnya terjadi pada semua session ketika pengguna melaporkan perangkat hilang.",
  },
  {
    id: "int-web-03",
    courseId: "int-keamanan-aplikasi-web",
    title: "Modul 3 — Input dan Validasi",
    objective: "Membedakan validation, sanitization, validasi client, dan validasi server.",
    topics: ["Input validation", "Sanitization", "Server-side validation", "Client-side validation", "Risiko input berbahaya"],
    example: "Batas panjang nama di browser membantu UX, tetapi server tetap harus menolak data yang melewati aturan.",
    commonMistake: "Mengandalkan client-side validation sebagai kontrol keamanan utama.",
    tips: ["Gunakan allowlist bentuk data yang valid", "Validasi tipe, panjang, dan konteks", "Pisahkan validasi dari penyimpanan data"],
    exercise: "Buat checklist validasi defensif untuk kolom email, usia, dan unggahan foto profil.",
  },
  {
    id: "int-web-04",
    courseId: "int-keamanan-aplikasi-web",
    title: "Modul 4 — Ancaman Web Dasar",
    objective: "Mengenali injection, XSS, broken access control, dan security misconfiguration secara konseptual.",
    topics: ["Injection konseptual", "Cross-Site Scripting konseptual", "Broken access control", "Security misconfiguration"],
    example: "Jika server hanya menyembunyikan tombol admin tetapi tidak memeriksa role pada request, akses masih dapat disalahgunakan.",
    commonMistake: "Menganggap tampilan frontend adalah batas keamanan.",
    tips: ["Periksa otorisasi pada server", "Pisahkan data dan perintah", "Gunakan konfigurasi aman sebagai default"],
    exercise: "Nilai kasus pengguna biasa yang dapat membuka URL admin: kontrol apa yang hilang dan di lapisan mana harus diperbaiki?",
  },
  {
    id: "int-auth-01",
    courseId: "int-authentication-authorization",
    title: "Modul 1 — Identitas dan Hak Akses",
    objective: "Membedakan authentication, authorization, RBAC, dan least privilege.",
    topics: ["Authentication", "Authorization", "Role-Based Access Control", "Principle of least privilege"],
    example: "Login membuktikan siapa pengguna; pengecekan role menentukan apakah ia boleh mengubah konten admin.",
    commonMistake: "Memeriksa bahwa pengguna sudah login tetapi tidak memeriksa izin untuk tindakan tertentu.",
    tips: ["Validasi izin di setiap operasi sensitif", "Gunakan role yang jelas", "Tinjau akses secara berkala"],
    exercise: "Rancang hak minimum untuk role siswa, instruktur, dan admin konten.",
  },
  {
    id: "int-auth-02",
    courseId: "int-authentication-authorization",
    title: "Modul 2 — Perlindungan Kredensial dan Session",
    objective: "Memahami password hashing, salt, MFA, session security, expiration, dan proteksi brute force.",
    topics: ["Password hashing", "Salt", "Multi-Factor Authentication", "Session security", "Brute-force protection", "Rate limiting"],
    example: "Password disimpan sebagai hash dengan salt unik sehingga database tidak menyimpan password asli.",
    commonMistake: "Menganggap enkripsi reversible adalah cara yang tepat untuk menyimpan password.",
    tips: ["Gunakan algoritme hashing password yang sesuai", "Aktifkan MFA", "Batasi percobaan login dan pantau pola aneh"],
    exercise: "Pilih kontrol berlapis untuk akun yang mengalami ratusan percobaan login dalam satu menit.",
  },
  {
    id: "int-auth-03",
    courseId: "int-authentication-authorization",
    title: "Modul 3 — Pemulihan Akun yang Aman",
    objective: "Menilai account recovery, reset password, pencabutan session, dan permission yang salah.",
    topics: ["Account recovery", "Reset password", "Session revocation", "Permission review", "Audit akses"],
    example: "Tautan reset harus sekali pakai, berumur pendek, dan tidak mengungkap apakah alamat email terdaftar.",
    commonMistake: "Menggunakan pertanyaan keamanan yang jawabannya mudah ditemukan di media sosial.",
    tips: ["Gunakan token reset sekali pakai", "Kirim notifikasi perubahan akun", "Cabut session lama setelah pemulihan"],
    exercise: "Audit alur reset password fiktif dan tandai tiga kontrol yang wajib ada.",
  },
  {
    id: "int-owasp-01",
    courseId: "int-owasp-top-10-pemula",
    title: "Modul 1 — Access Control dan Cryptographic Failures",
    objective: "Mengenali Broken Access Control dan Cryptographic Failures melalui dampak, indikator, serta mitigasi defensif.",
    topics: ["Broken Access Control", "Cryptographic Failures", "Validasi hak akses", "Perlindungan data sensitif"],
    example: "Data rapor harus hanya dapat dibaca pemilik dan petugas berwenang, baik dari tombol maupun request API langsung.",
    commonMistake: "Mengandalkan URL tersembunyi atau nama file acak sebagai perlindungan akses.",
    tips: ["Deny by default", "Enkripsi data sensitif saat transit", "Uji matriks role dan permission"],
    exercise: "Pilih mitigasi untuk endpoint yang menampilkan dokumen pengguna hanya berdasarkan ID di URL.",
  },
  {
    id: "int-owasp-02",
    courseId: "int-owasp-top-10-pemula",
    title: "Modul 2 — Injection dan Insecure Design",
    objective: "Memahami Injection dan Insecure Design tanpa melakukan eksploitasi.",
    topics: ["Injection", "Insecure Design", "Pemisahan data dan perintah", "Threat modeling"],
    example: "Query terparameterisasi membantu memastikan input diperlakukan sebagai data, bukan instruksi.",
    commonMistake: "Menambahkan filter input seadanya tanpa memperbaiki desain alur sensitif.",
    tips: ["Gunakan API aman dan parameterized query", "Petakan misuse case", "Tambahkan kontrol sejak tahap desain"],
    exercise: "Jelaskan mengapa pemeriksaan saldo wajib dilakukan di server sebelum transaksi disetujui.",
  },
  {
    id: "int-owasp-03",
    courseId: "int-owasp-top-10-pemula",
    title: "Modul 3 — Misconfiguration dan Komponen Rentan",
    objective: "Mengenali Security Misconfiguration serta Vulnerable and Outdated Components.",
    topics: ["Security Misconfiguration", "Vulnerable Components", "Secure defaults", "Dependency inventory"],
    example: "Mode debug produksi dapat membocorkan stack trace dan detail konfigurasi kepada pengguna.",
    commonMistake: "Memperbarui library tanpa inventaris, pengujian, atau rencana rollback.",
    tips: ["Nonaktifkan fitur yang tidak dipakai", "Pantau advisory resmi", "Uji patch sebelum produksi"],
    exercise: "Prioritaskan tindakan untuk server dengan mode debug aktif dan library kritis yang sudah usang.",
  },
  {
    id: "int-owasp-04",
    courseId: "int-owasp-top-10-pemula",
    title: "Modul 4 — Authentication dan Data Integrity",
    objective: "Mengenali Identification and Authentication Failures serta Software and Data Integrity Failures.",
    topics: ["Authentication Failures", "Software Integrity", "Update verification", "Supply-chain awareness"],
    example: "Paket pembaruan harus berasal dari sumber tepercaya dan diverifikasi sebelum digunakan.",
    commonMistake: "Memercayai file pembaruan hanya karena namanya terlihat resmi.",
    tips: ["Gunakan MFA", "Verifikasi signature dan sumber paket", "Lindungi pipeline deployment"],
    exercise: "Pilih bukti yang perlu diverifikasi sebelum tim memasang dependency baru.",
  },
  {
    id: "int-owasp-05",
    courseId: "int-owasp-top-10-pemula",
    title: "Modul 5 — Logging, Monitoring, dan SSRF",
    objective: "Memahami kegagalan logging/monitoring dan SSRF secara konseptual serta defensif.",
    topics: ["Security Logging", "Monitoring Failures", "Alerting", "SSRF konseptual", "Pembatasan koneksi keluar"],
    example: "Aplikasi pengambil gambar URL harus membatasi tujuan agar tidak dapat meminta alamat internal sensitif.",
    commonMistake: "Mengumpulkan log tanpa pemilik alert, retensi, dan prosedur tindak lanjut.",
    tips: ["Catat aktivitas sensitif tanpa menyimpan rahasia", "Buat alert yang dapat ditindaklanjuti", "Allowlist tujuan koneksi server"],
    exercise: "Tentukan tiga event login yang layak menghasilkan alert keamanan.",
  },
  {
    id: "int-social-01",
    courseId: "int-social-engineering-scam",
    title: "Modul 1 — Pola Manipulasi Sosial",
    objective: "Membedakan phishing, smishing, vishing, pretexting, baiting, dan impersonation.",
    topics: ["Phishing", "Smishing", "Vishing", "Pretexting", "Baiting", "Impersonation"],
    example: "Penipu berpura-pura menjadi atasan dan menciptakan keadaan mendesak agar korban melewati prosedur verifikasi.",
    commonMistake: "Memercayai identitas hanya dari foto profil, nama tampilan, atau caller ID.",
    tips: ["Berhenti saat dibuat panik", "Verifikasi melalui kanal terpisah", "Jangan bagikan OTP, PIN, atau password"],
    exercise: "Kelompokkan lima pesan fiktif berdasarkan taktik manipulasi yang digunakan.",
  },
  {
    id: "int-social-02",
    courseId: "int-social-engineering-scam",
    title: "Modul 2 — Scam Kurir, APK, dan Hadiah",
    objective: "Mengenali kurir paket palsu, file APK palsu, hadiah palsu, dan link pendek.",
    topics: ["Kurir paket palsu", "File APK palsu", "Resi palsu", "Hadiah palsu", "Link pendek"],
    example: "Status paket seharusnya diperiksa dari aplikasi atau situs resmi, bukan file APK dari nomor asing.",
    commonMistake: "Membuka file untuk mengetahui isinya sebelum memverifikasi pengirim.",
    tips: ["Jangan instal APK dari chat asing", "Periksa paket lewat kanal resmi", "Laporkan dan blokir akun mencurigakan"],
    exercise: "Pilih respons teraman ketika nomor asing mengirim APK bernama foto_paket.apk.",
  },
  {
    id: "int-social-03",
    courseId: "int-social-engineering-scam",
    title: "Modul 3 — Investasi dan Transfer Mendesak",
    objective: "Menilai investasi palsu, perubahan nomor keluarga, dan permintaan transfer mendesak.",
    topics: ["Investasi palsu", "Janji keuntungan tidak wajar", "Perubahan nomor keluarga", "Transfer mendesak", "Verifikasi dua kanal"],
    example: "Hubungi nomor lama atau anggota keluarga lain sebelum merespons permintaan uang dari nomor baru.",
    commonMistake: "Mengirim dana kecil sebagai tes tanpa memverifikasi identitas.",
    tips: ["Waspadai jaminan untung", "Verifikasi identitas secara langsung", "Simpan bukti dan laporkan"],
    exercise: "Susun urutan verifikasi ketika seseorang mengaku keluarga dan meminta transfer karena keadaan darurat.",
  },
  {
    id: "int-social-04",
    courseId: "int-social-engineering-scam",
    title: "Modul 4 — Respons dan Pelaporan Scam",
    objective: "Menghubungkan materi dengan simulasi phishing, WhatsApp scam, dan vishing yang tersedia.",
    topics: ["Blokir dan laporkan", "Kanal resmi", "Pelestarian bukti", "Pemulihan akun", "Simulasi defensif"],
    example: "Screenshot, nomor pengirim, waktu, dan jenis permintaan dapat membantu laporan tanpa menyebarkan data korban.",
    commonMistake: "Menghapus semua bukti sebelum membuat laporan atau menyebarkannya ke publik.",
    tips: ["Simpan bukti minimum yang relevan", "Hubungi penyedia layanan resmi", "Ganti kredensial jika sempat dibagikan"],
    exercise: "Pilih salah satu simulasi Cyber Academy dan tuliskan indikator serta respons yang akan kamu latih.",
  },
  {
    id: "int-crypto-01",
    courseId: "int-dasar-cryptography",
    title: "Modul 1 — Encoding, Encryption, dan Hashing",
    objective: "Membedakan encoding, encryption, dan hashing berdasarkan tujuan dan sifat reversibilitas.",
    topics: ["Encoding", "Encryption", "Hashing", "Reversible dan one-way", "Use case"],
    example: "Encoding mengubah format, encryption menjaga kerahasiaan dengan kunci, hashing membuat sidik jari satu arah.",
    commonMistake: "Menganggap Base64 sebagai encryption.",
    tips: ["Pilih mekanisme berdasarkan tujuan", "Jangan simpan password dengan encoding", "Gunakan algoritme standar"],
    exercise: "Buat tabel tiga kolom: tujuan, dapat dibalik, dan contoh penggunaan untuk encoding/encryption/hashing.",
  },
  {
    id: "int-crypto-02",
    courseId: "int-dasar-cryptography",
    title: "Modul 2 — Symmetric dan Asymmetric Encryption",
    objective: "Memahami symmetric encryption, asymmetric encryption, public key, dan private key.",
    topics: ["Symmetric encryption", "Asymmetric encryption", "Public key", "Private key", "Key management"],
    example: "Kunci publik boleh dibagikan untuk fungsi tertentu; kunci privat harus dijaga oleh pemiliknya.",
    commonMistake: "Menyimpan kunci privat di repository atau chat.",
    tips: ["Pisahkan kunci dari kode", "Batasi akses kunci", "Rotasi kunci sesuai kebijakan"],
    exercise: "Pilih jenis encryption untuk data berukuran besar dan jelaskan peran asymmetric encryption dalam pertukaran kunci.",
  },
  {
    id: "int-crypto-03",
    courseId: "int-dasar-cryptography",
    title: "Modul 3 — Digital Signature, Certificate, dan HTTPS",
    objective: "Menjelaskan digital signature, certificate, dan HTTPS sebagai mekanisme keaslian serta perlindungan koneksi.",
    topics: ["Digital signature", "Certificate", "Certificate authority", "HTTPS", "Validasi identitas"],
    example: "Certificate membantu browser memverifikasi identitas situs dan membangun koneksi terenkripsi.",
    commonMistake: "Menganggap ikon gembok menjamin isi bisnis situs pasti jujur.",
    tips: ["Periksa domain selain HTTPS", "Jangan abaikan peringatan certificate", "Gunakan certificate yang valid"],
    exercise: "Jelaskan apa yang dilindungi HTTPS dan apa yang tetap harus dinilai oleh pengguna.",
  },
  {
    id: "int-crypto-04",
    courseId: "int-dasar-cryptography",
    title: "Modul 4 — Penyimpanan Password",
    objective: "Memilih hashing password, salt unik, dan pengelolaan kredensial yang tepat.",
    topics: ["Password hashing", "Salt unik", "Work factor", "Password manager", "Credential lifecycle"],
    example: "Dua pengguna dengan password sama tetap menghasilkan hash berbeda ketika menggunakan salt unik.",
    commonMistake: "Membuat algoritme kriptografi sendiri atau menyimpan password dalam teks biasa.",
    tips: ["Gunakan library teruji", "Jangan log password", "Dukung MFA dan reset aman"],
    exercise: "Audit desain penyimpanan password fiktif dan tandai bagian yang harus diperbaiki.",
  },
  {
    id: "int-ir-01",
    courseId: "int-incident-response-dasar",
    title: "Modul 1 — Preparation dan Identification",
    objective: "Menyiapkan peran, kontak, playbook, logging, serta mengidentifikasi apakah kejadian merupakan insiden.",
    topics: ["Preparation", "Asset inventory", "Playbook", "Identification", "Severity awal", "Pelaporan"],
    example: "Alert tunggal perlu dikonfirmasi dengan sumber log lain sebelum diklasifikasikan sebagai insiden.",
    commonMistake: "Menunggu insiden terjadi sebelum menentukan siapa yang mengambil keputusan.",
    tips: ["Tetapkan peran dan kontak", "Jaga sinkronisasi waktu log", "Catat keputusan sejak awal"],
    exercise: "Buat checklist lima hal yang harus tersedia sebelum terjadi insiden.",
  },
  {
    id: "int-ir-02",
    courseId: "int-incident-response-dasar",
    title: "Modul 2 — Containment, Eradication, dan Recovery",
    objective: "Membedakan penahanan, pembersihan akar masalah, dan pemulihan layanan yang tervalidasi.",
    topics: ["Containment", "Eradication", "Recovery", "Evidence preservation", "Validation", "Monitoring"],
    example: "Mengisolasi perangkat dapat membatasi dampak, tetapi bukti penting perlu dijaga sebelum tindakan destruktif.",
    commonMistake: "Menghapus file secepatnya tanpa mencatat bukti atau memahami akar masalah.",
    tips: ["Pilih containment sesuai dampak bisnis", "Jaga integritas bukti", "Pantau sistem setelah dipulihkan"],
    exercise: "Urutkan: isolasi perangkat, dokumentasi bukti, hapus penyebab, pulihkan backup bersih, pantau anomali.",
  },
  {
    id: "int-ir-03",
    courseId: "int-incident-response-dasar",
    title: "Modul 3 — Lessons Learned dan Komunikasi",
    objective: "Menyusun dokumentasi, komunikasi, lessons learned, dan perbaikan kontrol setelah insiden.",
    topics: ["Lessons learned", "Timeline", "Dokumentasi", "Komunikasi insiden", "Pelaporan", "Action items"],
    example: "Laporan pascainsiden fokus pada fakta, dampak, keputusan, akar masalah, dan tindakan perbaikan—bukan mencari kambing hitam.",
    commonMistake: "Menutup insiden setelah layanan hidup tanpa memastikan perbaikan benar-benar dilakukan.",
    tips: ["Gunakan satu sumber informasi resmi", "Batasi data sensitif dalam laporan", "Tetapkan pemilik dan tenggat perbaikan"],
    exercise: "Susun ringkasan pascainsiden singkat dari skenario akun staf yang diambil alih.",
  },
];

const courseOrder = new Map(intermediateCourses.map((course) => [course.id, course.order]));

export const intermediateLessons: Lesson[] = lessonBlueprints.map((lesson) => {
  const siblings = lessonBlueprints.filter((item) => item.courseId === lesson.courseId);
  const order = siblings.findIndex((item) => item.id === lesson.id) + 1;
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    learningPathId: INTERMEDIATE_PATH_ID,
    title: lesson.title,
    slug: slugify(lesson.title),
    order,
    objective: lesson.objective,
    content: buildLessonContent(lesson),
    exampleCase: {
      title: "Studi Kasus Defensif",
      description: lesson.example,
    },
    securityTips: lesson.tips,
    keyTakeaways: [
      lesson.objective,
      `Mini latihan: ${lesson.exercise}`,
      `Modul ini merupakan bagian ke-${order} pada kelas urutan ${courseOrder.get(lesson.courseId)}.`,
    ],
    estimatedDuration: lesson.minutes ?? 25,
    xpReward: 10,
    status: "published",
  };
});

intermediateCourses.forEach((course) => {
  course.lessonCount = intermediateLessons.filter((lesson) => lesson.courseId === course.id).length;
});

type QuestionBlueprint = {
  text: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  lessonId: string;
};

function createQuiz(courseId: string, title: string, description: string, count: number, passingScore = 75, xpReward = 30): Quiz {
  return {
    id: `quiz-${courseId}`,
    courseId,
    title,
    description,
    questionCount: count,
    passingScore,
    xpReward,
    status: "published",
    createdAt: PUBLISHED_AT,
    updatedAt: PUBLISHED_AT,
  };
}

const quizBlueprints: Array<{ quiz: Quiz; questions: QuestionBlueprint[] }> = [
  {
    quiz: createQuiz("int-keamanan-jaringan-dasar", "Quiz Keamanan Jaringan Dasar", "Evaluasi berbasis skenario tentang komunikasi dan perlindungan jaringan.", 5),
    questions: [
      { text: "Jaringan tamu dan komputer keuangan berada pada jaringan yang sama. Kontrol awal terbaik?", options: ["Menambah kecepatan internet", "Memisahkan jaringan dengan segmentasi", "Mengganti nama Wi-Fi", "Mematikan DNS"], correct: 1, explanation: "Segmentasi membatasi pergerakan perangkat tamu menuju aset internal.", lessonId: "int-net-03" },
      { text: "Protocol mana yang lebih tepat untuk administrasi jarak jauh terenkripsi?", options: ["FTP", "HTTP", "SSH", "SMTP"], correct: 2, explanation: "SSH dirancang untuk akses jarak jauh terenkripsi.", lessonId: "int-net-02" },
      { text: "Apa fungsi DNS dalam contoh sederhana?", options: ["Menerjemahkan nama domain menjadi alamat IP", "Membuat password", "Mengenkripsi semua file", "Menghapus malware"], correct: 0, explanation: "DNS membantu perangkat menemukan alamat IP tujuan dari nama domain.", lessonId: "int-net-01" },
      { text: "Mengapa VPN bukan jaminan penuh saat memakai Wi-Fi publik?", options: ["VPN selalu mematikan internet", "Situs palsu dan keputusan pengguna tetap dapat menimbulkan risiko", "VPN membuka semua port", "VPN menghapus MFA"], correct: 1, explanation: "VPN melindungi jalur koneksi, bukan keaslian semua situs atau keputusan pengguna.", lessonId: "int-net-03" },
      { text: "Prinsip paling aman untuk port layanan?", options: ["Buka semua agar mudah", "Buka hanya yang dibutuhkan dan pantau", "Gunakan port acak tanpa dokumentasi", "Jangan gunakan firewall"], correct: 1, explanation: "Mengurangi layanan terbuka memperkecil permukaan serangan.", lessonId: "int-net-02" },
    ],
  },
  {
    quiz: createQuiz("int-keamanan-aplikasi-web", "Quiz Keamanan Aplikasi Web", "Evaluasi defensif mengenai request, session, input, dan akses.", 5),
    questions: [
      { text: "Form sudah memvalidasi email di browser. Apa yang tetap wajib?", options: ["Tidak perlu validasi lagi", "Validasi ulang di server", "Simpan semua input", "Sembunyikan tombol kirim"], correct: 1, explanation: "Client dapat dimodifikasi, sehingga server harus menjadi batas validasi.", lessonId: "int-web-03" },
      { text: "Pengguna biasa membuka URL admin langsung. Masalah utamanya?", options: ["Status code", "Broken access control", "DNS lambat", "Warna tombol"], correct: 1, explanation: "Server gagal memeriksa hak akses pada operasi sensitif.", lessonId: "int-web-04" },
      { text: "Apa tindakan aman saat logout?", options: ["Biarkan token aktif", "Cabut atau invalidasi session", "Simpan token di URL", "Bagikan cookie"], correct: 1, explanation: "Session harus tidak lagi dapat dipakai setelah logout.", lessonId: "int-web-02" },
      { text: "Status code dan header berada pada bagian apa?", options: ["Response atau request HTTP sesuai konteks", "Password hash", "MAC address", "File backup"], correct: 0, explanation: "Header membawa metadata HTTP dan status code menjelaskan hasil response.", lessonId: "int-web-01" },
      { text: "Mitigasi konseptual injection yang paling tepat?", options: ["Mengganti font", "Memisahkan data dan perintah dengan API aman", "Menyembunyikan form", "Memperpanjang URL"], correct: 1, explanation: "Input harus tetap diperlakukan sebagai data melalui mekanisme aman seperti parameterized query.", lessonId: "int-web-04" },
    ],
  },
  {
    quiz: createQuiz("int-authentication-authorization", "Quiz Authentication dan Authorization", "Uji keputusan perlindungan identitas, session, dan hak akses.", 5),
    questions: [
      { text: "Login berhasil tetapi pengguna biasa dapat menghapus course. Kontrol yang gagal?", options: ["Authentication", "Authorization", "DNS", "Encoding"], correct: 1, explanation: "Identitas sudah terbukti, tetapi izin tindakan tidak diperiksa.", lessonId: "int-auth-01" },
      { text: "Cara tepat menyimpan password?", options: ["Teks biasa", "Base64", "Hash password dengan salt unik", "Dokumen publik"], correct: 2, explanation: "Password memerlukan algoritme hashing khusus dan salt unik.", lessonId: "int-auth-02" },
      { text: "Ratusan percobaan login per menit sebaiknya ditangani dengan?", options: ["Rate limiting dan monitoring", "Menonaktifkan HTTPS", "Membuka akses admin", "Menghapus audit log"], correct: 0, explanation: "Pembatasan laju dan monitoring mengurangi brute force dan memberi sinyal insiden.", lessonId: "int-auth-02" },
      { text: "Token reset password yang baik harus?", options: ["Berlaku selamanya", "Sekali pakai dan berumur pendek", "Sama untuk semua pengguna", "Dikirim ke publik"], correct: 1, explanation: "Token reset harus dibatasi waktu dan tidak dapat digunakan ulang.", lessonId: "int-auth-03" },
      { text: "Least privilege berarti?", options: ["Semua pengguna admin", "Akses minimum sesuai tugas", "Tidak ada audit", "Satu akun dipakai bersama"], correct: 1, explanation: "Hak minimum membatasi dampak kesalahan atau penyalahgunaan.", lessonId: "int-auth-01" },
    ],
  },
  {
    quiz: createQuiz("int-owasp-top-10-pemula", "Quiz OWASP Top 10 untuk Pemula", "Evaluasi pengenalan risiko dan mitigasi OWASP secara defensif.", 5),
    questions: [
      { text: "Endpoint hanya menyembunyikan tombol admin tanpa cek role server. Risiko?", options: ["Broken Access Control", "Availability", "Encoding", "Spam"], correct: 0, explanation: "Otorisasi harus diperiksa server untuk setiap operasi sensitif.", lessonId: "int-owasp-01" },
      { text: "Mode debug aktif di produksi termasuk?", options: ["Security Misconfiguration", "MFA", "Segmentasi", "Backup"], correct: 0, explanation: "Konfigurasi debug dapat membocorkan informasi internal.", lessonId: "int-owasp-03" },
      { text: "Dependency kritis usang harus ditangani dengan?", options: ["Diabaikan", "Inventaris, patch teruji, dan rollback plan", "Disembunyikan", "Dikirim lewat chat"], correct: 1, explanation: "Komponen harus dipantau dan diperbarui melalui proses terkontrol.", lessonId: "int-owasp-03" },
      { text: "Aplikasi server mengambil URL bebas dari pengguna. Kontrol SSRF defensif?", options: ["Allowlist tujuan dan blok alamat internal", "Membuka semua tujuan", "Menghapus logging", "Menambah animasi"], correct: 0, explanation: "Tujuan koneksi server harus dibatasi dan divalidasi.", lessonId: "int-owasp-05" },
      { text: "Mengapa logging saja belum cukup?", options: ["Log harus dipantau dan ditindaklanjuti", "Log selalu malware", "Log mengganti MFA", "Log membuka port"], correct: 0, explanation: "Tanpa alert, pemilik, dan respons, kejadian penting dapat terlewat.", lessonId: "int-owasp-05" },
    ],
  },
  {
    quiz: createQuiz("int-social-engineering-scam", "Quiz Social Engineering dan Scam", "Evaluasi respons aman pada manipulasi dan penipuan digital.", 5),
    questions: [
      { text: "Nomor asing mengirim foto_paket.apk. Respons terbaik?", options: ["Instal untuk memeriksa", "Teruskan ke teman", "Jangan buka; cek paket lewat kanal resmi", "Berikan OTP"], correct: 2, explanation: "APK dari nomor asing berisiko dan status paket harus diverifikasi melalui kanal resmi.", lessonId: "int-social-02" },
      { text: "Caller ID menampilkan nama bank. Apakah identitas pasti valid?", options: ["Ya selalu", "Tidak, caller ID dapat dipalsukan", "Ya jika penelepon mendesak", "Ya jika meminta OTP"], correct: 1, explanation: "Nama atau nomor tampilan bukan bukti identitas.", lessonId: "int-social-01" },
      { text: "Nomor baru mengaku keluarga meminta transfer. Langkah awal?", options: ["Transfer kecil", "Verifikasi lewat nomor lama atau keluarga lain", "Kirim PIN", "Klik link"], correct: 1, explanation: "Verifikasi kanal terpisah memutus manipulasi identitas.", lessonId: "int-social-03" },
      { text: "Data apa yang tidak pernah boleh diberikan kepada CS?", options: ["Nama bank", "OTP, PIN, dan password", "Jam operasional", "Alamat kantor cabang"], correct: 1, explanation: "Rahasia autentikasi tidak boleh dibagikan kepada siapa pun.", lessonId: "int-social-01" },
      { text: "Setelah scam terdeteksi, tindakan yang tepat?", options: ["Hapus semua bukti", "Simpan bukti relevan, blokir, dan laporkan", "Sebarkan data korban", "Balas dengan ancaman"], correct: 1, explanation: "Bukti membantu pelaporan; pemblokiran mengurangi kontak lanjutan.", lessonId: "int-social-04" },
    ],
  },
  {
    quiz: createQuiz("int-dasar-cryptography", "Quiz Dasar Cryptography", "Uji perbedaan mekanisme perlindungan data dan kredensial.", 5),
    questions: [
      { text: "Base64 termasuk?", options: ["Encoding", "Encryption kuat", "Hash password", "Digital signature"], correct: 0, explanation: "Base64 mengubah representasi data dan mudah dibalik; bukan encryption.", lessonId: "int-crypto-01" },
      { text: "Fungsi hashing yang tepat?", options: ["Sidik jari satu arah", "Membuka port", "Menerjemahkan DNS", "Mengganti role"], correct: 0, explanation: "Hash menghasilkan representasi satu arah yang berguna untuk integritas dan password.", lessonId: "int-crypto-01" },
      { text: "Kunci mana yang harus dijaga rahasia oleh pemilik?", options: ["Public key", "Private key", "Nama domain", "Certificate publik"], correct: 1, explanation: "Private key tidak boleh dibagikan.", lessonId: "int-crypto-02" },
      { text: "HTTPS membantu melindungi?", options: ["Koneksi browser-server dan verifikasi certificate", "Kejujuran semua isi situs", "Semua file lokal", "PIN pengguna"], correct: 0, explanation: "HTTPS melindungi koneksi; pengguna tetap harus memeriksa domain dan konteks.", lessonId: "int-crypto-03" },
      { text: "Mengapa salt unik penting pada password hash?", options: ["Agar password terlihat", "Agar hash password sama tidak identik", "Agar login tanpa password", "Agar session abadi"], correct: 1, explanation: "Salt unik mencegah hash identik dan memperkuat perlindungan terhadap tabel prahitung.", lessonId: "int-crypto-04" },
    ],
  },
];

const finalQuestions: QuestionBlueprint[] = [
  { text: "DNS berfungsi utama untuk?", options: ["Menerjemahkan domain ke IP", "Menghash password", "Menentukan role", "Membuat backup"], correct: 0, explanation: "DNS menerjemahkan nama domain menjadi alamat IP.", lessonId: "int-net-01" },
  { text: "Wi-Fi tamu sebaiknya?", options: ["Digabung dengan server internal", "Disegmentasi dari aset penting", "Tanpa password", "Membuka semua port"], correct: 1, explanation: "Segmentasi membatasi dampak perangkat tamu.", lessonId: "int-net-03" },
  { text: "Protocol administrasi terenkripsi?", options: ["HTTP", "FTP", "SSH", "SMTP"], correct: 2, explanation: "SSH digunakan untuk administrasi jarak jauh terenkripsi.", lessonId: "int-net-02" },
  { text: "Validasi client-side harus dilengkapi dengan?", options: ["Validasi server-side", "Warna tombol", "URL lebih panjang", "Cookie publik"], correct: 0, explanation: "Server harus memvalidasi semua input yang menentukan keamanan.", lessonId: "int-web-03" },
  { text: "Session setelah logout seharusnya?", options: ["Tetap aktif", "Diinvalidasi", "Dibagikan", "Dimasukkan URL"], correct: 1, explanation: "Logout harus mencabut session.", lessonId: "int-web-02" },
  { text: "Pengguna login tetapi tak berhak mengubah data. Ini berkaitan dengan?", options: ["Authorization", "Encoding", "DNS", "Compression"], correct: 0, explanation: "Authorization menentukan tindakan yang diizinkan.", lessonId: "int-auth-01" },
  { text: "Kontrol tepat untuk brute force?", options: ["Rate limiting, MFA, monitoring", "Matikan logging", "Password bersama", "Session abadi"], correct: 0, explanation: "Kontrol berlapis mengurangi dan mendeteksi percobaan berulang.", lessonId: "int-auth-02" },
  { text: "Reset password aman memakai token?", options: ["Sekali pakai dan singkat", "Publik dan abadi", "Sama untuk semua", "Berisi password asli"], correct: 0, explanation: "Token reset harus terbatas waktu dan penggunaan.", lessonId: "int-auth-03" },
  { text: "Broken Access Control dimitigasi dengan?", options: ["Cek izin server pada tiap tindakan", "Sembunyikan tombol saja", "Ganti ikon", "Tambah port"], correct: 0, explanation: "Server adalah batas otorisasi.", lessonId: "int-owasp-01" },
  { text: "Risiko komponen usang ditangani melalui?", options: ["Inventaris dan patch teruji", "Abaikan advisory", "Mode debug", "Matikan backup"], correct: 0, explanation: "Komponen harus dicatat, dipantau, dan diperbarui aman.", lessonId: "int-owasp-03" },
  { text: "SSRF konseptual dikurangi dengan?", options: ["Membatasi tujuan koneksi server", "Menerima semua URL", "Menghapus alert", "Membuka metadata internal"], correct: 0, explanation: "Koneksi keluar server harus divalidasi dan dibatasi.", lessonId: "int-owasp-05" },
  { text: "Tanda manipulasi sosial yang umum?", options: ["Desakan dan ancaman", "Dokumentasi resmi", "MFA", "Segmentasi"], correct: 0, explanation: "Penipu mengeksploitasi panik dan urgensi.", lessonId: "int-social-01" },
  { text: "APK dari nomor kurir asing sebaiknya?", options: ["Tidak dibuka dan cek kanal resmi", "Instal cepat", "Berikan OTP", "Teruskan"], correct: 0, explanation: "Jangan menjalankan file dari sumber tidak dikenal.", lessonId: "int-social-02" },
  { text: "Permintaan transfer dari nomor keluarga baru perlu?", options: ["Verifikasi kanal terpisah", "Dipenuhi segera", "Diberi PIN", "Dibalas OTP"], correct: 0, explanation: "Verifikasi identitas mencegah impersonation.", lessonId: "int-social-03" },
  { text: "Encoding berbeda dari encryption karena?", options: ["Encoding bukan perlindungan kerahasiaan", "Encoding selalu memakai private key", "Encoding tidak dapat dibalik", "Encryption hanya untuk gambar"], correct: 0, explanation: "Encoding mengubah format, bukan menjaga rahasia.", lessonId: "int-crypto-01" },
  { text: "Password idealnya disimpan sebagai?", options: ["Hash dengan salt unik", "Teks biasa", "Base64", "Catatan publik"], correct: 0, explanation: "Hash password teruji dengan salt unik adalah pola aman.", lessonId: "int-crypto-04" },
  { text: "Tahap setelah identifikasi untuk membatasi dampak?", options: ["Containment", "Marketing", "Encoding", "Archiving"], correct: 0, explanation: "Containment menahan penyebaran dan dampak.", lessonId: "int-ir-02" },
  { text: "Mengapa bukti dijaga sebelum tindakan destruktif?", options: ["Untuk analisis dan akuntabilitas", "Agar malware menyebar", "Untuk menghapus log", "Agar session abadi"], correct: 0, explanation: "Integritas bukti membantu memahami kejadian dan membuat keputusan.", lessonId: "int-ir-02" },
  { text: "Lessons learned yang baik menghasilkan?", options: ["Action item dengan pemilik dan tenggat", "Kambing hitam", "Penghapusan semua catatan", "Akses lebih luas"], correct: 0, explanation: "Perbaikan harus terukur dan ditindaklanjuti.", lessonId: "int-ir-03" },
  { text: "Urutan respons yang paling tepat?", options: ["Preparation, Identification, Containment, Eradication, Recovery, Lessons learned", "Recovery lalu Identification", "Eradication tanpa bukti", "Lessons learned sebelum kejadian"], correct: 0, explanation: "Urutan ini menjaga kesiapan, pembatasan dampak, pemulihan, dan perbaikan.", lessonId: "int-ir-01" },
];

quizBlueprints.push({
  quiz: createQuiz("int-incident-response-dasar", "Final Quiz Intermediate", "Ujian akhir 20 soal yang mencakup tujuh kelas Intermediate.", 20, 75, 60),
  questions: finalQuestions,
});

export const intermediateQuizzes: Quiz[] = quizBlueprints.map((item) => item.quiz);

export const intermediateQuestions: Question[] = quizBlueprints.flatMap(({ quiz, questions: items }) =>
  items.map((item, index) => ({
    id: `q-${quiz.id}-${String(index + 1).padStart(2, "0")}`,
    quizId: quiz.id,
    courseId: quiz.courseId,
    questionText: item.text,
    options: item.options.map((text, optionIndex) => ({
      id: ["a", "b", "c", "d"][optionIndex],
      text,
    })),
    correctOptionId: ["a", "b", "c", "d"][item.correct],
    explanation: item.explanation,
    recommendedLessonId: item.lessonId,
    order: index + 1,
    status: "published",
  }))
);
