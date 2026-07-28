export type SimulationDifficulty = "Pemula" | "Menengah" | "Lanjutan";

export interface SimulationChoice {
  id: string;
  label: string;
  detail: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  context: string;
  evidence: string[];
  choices: SimulationChoice[];
}

export interface SimulationDefinition {
  simulationId: string;
  title: string;
  shortDescription: string;
  difficulty: SimulationDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  color: string;
  icon: "mail" | "message" | "phone" | "terminal";
  objectives: string[];
  tutorial: Array<{ title: string; body: string }>;
  warning: string;
  scenarios: SimulationScenario[];
}

const phishingChoices: SimulationChoice[] = [
  { id: "safe", label: "Tandai sebagai Aman", detail: "Biarkan email berada di kotak masuk." },
  { id: "inspect", label: "Periksa Link", detail: "Periksa domain tujuan tanpa membuka tautan." },
  { id: "report", label: "Laporkan Email", detail: "Laporkan sebagai phishing lalu hapus." },
];

export const SIMULATION_CATALOG: SimulationDefinition[] = [
  {
    simulationId: "phishing-email",
    title: "Detektif Email Phishing",
    shortDescription: "Periksa email seperti detektif: pengirim, domain, isi, tautan, dan lampiran.",
    difficulty: "Pemula",
    estimatedMinutes: 7,
    xpReward: 25,
    color: "bg-pastel-peach",
    icon: "mail",
    objectives: [
      "Membedakan email asli dan phishing.",
      "Memeriksa domain, urgensi, tautan, dan lampiran.",
      "Memilih tindakan aman tanpa membuka konten berbahaya.",
    ],
    tutorial: [
      { title: "Cek pengirim", body: "Nama pengirim dapat dipalsukan. Cocokkan alamat dan domain dengan kanal resmi." },
      { title: "Jangan terpancing panik", body: "Ancaman akun diblokir dan batas waktu sangat singkat sering dipakai penipu." },
      { title: "Periksa tanpa membuka", body: "Lihat preview domain dan jenis lampiran. Jangan masukkan password, PIN, atau OTP." },
    ],
    warning: "Seluruh alamat, tautan, dan lampiran di sini adalah data fiktif untuk pembelajaran defensif.",
    scenarios: [
      {
        id: "phish-obvious",
        title: "Peringatan akun satu jam",
        context: "Email mengaku dari bank dan mengancam akun diblokir dalam satu jam.",
        evidence: [
          "Dari: Keamanan Bank <info@klik-aman-bca.example>",
          "Subjek: AKUN DIBLOKIR — VERIFIKASI 1 JAM!",
          "Tautan: hxxps://verifikasi-bank.example/login",
          "Meminta password dan OTP.",
        ],
        choices: phishingChoices,
      },
      {
        id: "phish-bank",
        title: "Email bank yang tampak rapi",
        context: "Desain email terlihat profesional, tetapi domain pengirim berbeda satu huruf.",
        evidence: [
          "Dari: Pusat Bantuan <security@banlk-resmi.example>",
          "Preview domain: secure-confirm.example",
          "Tidak menyebut nama nasabah.",
          "Tombol: Konfirmasi transaksi sekarang.",
        ],
        choices: phishingChoices,
      },
      {
        id: "phish-promo",
        title: "Promo hadiah palsu",
        context: "Pengguna disebut memenangkan hadiah meskipun tidak pernah mengikuti program.",
        evidence: [
          "Dari: Promo Nasional <claim@hadiah-cepat.example>",
          "Lampiran: Form-Hadiah.zip",
          "Diminta membayar biaya administrasi.",
          "Batas klaim hanya 30 menit.",
        ],
        choices: phishingChoices,
      },
      {
        id: "phish-reset",
        title: "Reset password tidak diminta",
        context: "Email reset password datang tiba-tiba dan mengarahkan ke halaman login lain.",
        evidence: [
          "Dari: Account Team <reset@accounts-support.example>",
          "Tautan: account-recovery.example",
          "Meminta password lama untuk verifikasi.",
          "Ada beberapa salah eja.",
        ],
        choices: phishingChoices,
      },
      {
        id: "email-safe",
        title: "Notifikasi aman sebagai pembanding",
        context: "Notifikasi transaksi sesuai aktivitas pengguna dan tidak meminta data rahasia.",
        evidence: [
          "Dikirim dari domain resmi yang sudah diverifikasi.",
          "Tidak ada lampiran atau tautan login.",
          "Menyarankan membuka aplikasi resmi.",
          "Tidak meminta PIN, password, atau OTP.",
        ],
        choices: phishingChoices,
      },
    ],
  },
  {
    simulationId: "whatsapp-scam",
    title: "WhatsApp Scam & Kurir Paket Palsu",
    shortDescription: "Hadapi chat kurir, keluarga, hadiah, dan paket palsu tanpa membuka file berbahaya.",
    difficulty: "Pemula",
    estimatedMinutes: 8,
    xpReward: 30,
    color: "bg-pastel-mint",
    icon: "message",
    objectives: [
      "Mengenali file APK, link pendek, dan identitas pengirim yang kabur.",
      "Memverifikasi pesan melalui aplikasi atau nomor yang sudah dikenal.",
      "Memblokir dan melaporkan akun mencurigakan.",
    ],
    tutorial: [
      { title: "APK bukan bukti paket", body: "Kurir resmi tidak meminta penerima memasang file APK dari chat pribadi." },
      { title: "Verifikasi lewat kanal lain", body: "Untuk keluarga atau kurir, hubungi nomor lama dan cek aplikasi resmi." },
      { title: "Rahasia tetap rahasia", body: "PIN, password, dan OTP tidak boleh diberikan kepada siapa pun." },
    ],
    warning: "Chat, nomor, file, dan tautan dalam simulasi ini sepenuhnya fiktif dan tidak dapat dijalankan.",
    scenarios: [
      {
        id: "wa-apk",
        title: "Foto paket berbentuk APK",
        context: "Nomor tidak dikenal mengaku kurir dan mengirim file Paket_Foto.apk.",
        evidence: ["Nomor baru tanpa identitas.", "File berakhiran .apk.", "Pesan mendesak: buka sekarang.", "Meminta izin akses SMS."],
        choices: [
          { id: "open", label: "Buka file", detail: "Pasang file agar dapat melihat foto paket." },
          { id: "reply", label: "Balas dan kirim data", detail: "Kirim alamat serta kode OTP untuk konfirmasi." },
          { id: "block-report", label: "Blokir & laporkan", detail: "Jangan buka file; cek paket lewat aplikasi resmi." },
        ],
      },
      {
        id: "wa-family",
        title: "Keluarga ganti nomor",
        context: "Nomor baru mengaku saudara dan meminta transfer darurat.",
        evidence: ["Tidak mau melakukan panggilan video.", "Meminta transfer segera.", "Menggunakan nama panggilan yang umum.", "Rekening atas nama orang lain."],
        choices: [
          { id: "transfer", label: "Transfer sekarang", detail: "Kirim uang agar urusan cepat selesai." },
          { id: "verify-known", label: "Verifikasi lewat nomor lama", detail: "Hubungi keluarga melalui kanal yang sudah dikenal." },
          { id: "ask-otp", label: "Minta OTP sebagai bukti", detail: "Minta kode rahasia untuk membuktikan identitas." },
        ],
      },
      {
        id: "wa-resi",
        title: "Resi paket dari link pendek",
        context: "Pesan meminta pengecekan ongkir tertunda melalui link pendek.",
        evidence: ["Link disamarkan.", "Domain tidak terlihat.", "Meminta nomor kartu.", "Tidak ada nomor resi yang valid."],
        choices: [
          { id: "short-link", label: "Buka link pendek", detail: "Masukkan data kartu untuk melanjutkan paket." },
          { id: "official-app", label: "Cek aplikasi resmi", detail: "Cari resi langsung dari aplikasi atau situs resmi." },
          { id: "forward", label: "Teruskan ke teman", detail: "Tanyakan apakah link pernah mereka gunakan." },
        ],
      },
      {
        id: "wa-prize",
        title: "Hadiah yang tidak pernah diikuti",
        context: "Akun baru mengumumkan hadiah dan meminta biaya pencairan.",
        evidence: ["Tidak pernah mengikuti undian.", "Ada biaya pencairan.", "Meminta foto identitas.", "Mengancam hadiah hangus."],
        choices: [
          { id: "pay", label: "Bayar biaya", detail: "Bayar sedikit agar hadiah dapat cair." },
          { id: "report", label: "Laporkan akun", detail: "Simpan bukti seperlunya, laporkan, lalu blokir." },
          { id: "send-id", label: "Kirim foto identitas", detail: "Berikan data agar nama pemenang diverifikasi." },
        ],
      },
      {
        id: "wa-legit",
        title: "Notifikasi paket yang wajar",
        context: "Aplikasi resmi mengirim notifikasi status paket tanpa meminta data sensitif.",
        evidence: ["Notifikasi berasal dari aplikasi terpasang.", "Nomor resi cocok.", "Tidak ada file APK.", "Tidak meminta PIN atau OTP."],
        choices: [
          { id: "official-check", label: "Buka aplikasi resmi", detail: "Periksa detail pengiriman di aplikasi." },
          { id: "install-other", label: "Pasang APK tambahan", detail: "Cari versi pelacak dari pesan lain." },
          { id: "share-otp", label: "Kirim OTP ke kurir", detail: "Berikan kode sebelum paket datang." },
        ],
      },
    ],
  },
  {
    simulationId: "vishing-call",
    title: "Vishing: Telepon CS Bank Gadungan",
    shortDescription: "Pilih respons aman saat penelepon menciptakan kepanikan dan meminta data rahasia.",
    difficulty: "Menengah",
    estimatedMinutes: 8,
    xpReward: 35,
    color: "bg-pastel-yellow",
    icon: "phone",
    objectives: [
      "Mengenali manipulasi rasa panik dalam telepon.",
      "Menolak permintaan OTP, PIN, dan remote access.",
      "Mengakhiri telepon dan menghubungi kanal resmi.",
    ],
    tutorial: [
      { title: "Caller ID dapat dipalsukan", body: "Nomor yang tampak resmi bukan bukti penelepon benar-benar dari bank." },
      { title: "Bank tidak meminta rahasia", body: "Petugas tidak meminta OTP, PIN, password, atau instalasi remote access." },
      { title: "Putus dan hubungi ulang", body: "Tutup telepon lalu gunakan nomor pada kartu, aplikasi, atau situs resmi." },
    ],
    warning: "Dialog ini hanya teks fiktif. Tidak ada audio, nomor telepon, atau transaksi nyata.",
    scenarios: [
      {
        id: "call-otp",
        title: "Transaksi mencurigakan",
        context: "Penelepon: “Agar transaksi dibatalkan, sebutkan OTP yang baru masuk.”",
        evidence: ["Menciptakan kepanikan.", "Meminta OTP.", "Mendesak menjawab sebelum telepon ditutup."],
        choices: [
          { id: "give-otp", label: "Sebutkan OTP", detail: "Berikan kode agar transaksi dibatalkan." },
          { id: "hangup-official", label: "Tutup & hubungi bank resmi", detail: "Jangan berikan data; gunakan kanal resmi." },
          { id: "give-partial", label: "Berikan sebagian kode", detail: "Sebutkan beberapa angka saja." },
        ],
      },
      {
        id: "call-id",
        title: "Nomor terlihat resmi",
        context: "Penelepon mengatakan nomor di layar membuktikan identitasnya.",
        evidence: ["Mengandalkan caller ID.", "Menolak memberikan nomor laporan.", "Tetap meminta data pribadi."],
        choices: [
          { id: "trust-id", label: "Percaya caller ID", detail: "Lanjutkan verifikasi di telepon." },
          { id: "independent-check", label: "Verifikasi mandiri", detail: "Tutup telepon dan panggil nomor resmi sendiri." },
          { id: "ask-name", label: "Cukup tanyakan nama", detail: "Percaya jika nama petugas terdengar meyakinkan." },
        ],
      },
      {
        id: "call-remote",
        title: "Aplikasi bantuan jarak jauh",
        context: "Penelepon meminta memasang aplikasi remote access untuk mengamankan rekening.",
        evidence: ["Meminta kendali layar.", "Mengirim link aplikasi.", "Meminta izin akses penuh."],
        choices: [
          { id: "install", label: "Pasang aplikasi", detail: "Ikuti arahan agar rekening diperbaiki." },
          { id: "refuse-remote", label: "Tolak & akhiri panggilan", detail: "Jangan pasang aplikasi; laporkan ke bank." },
          { id: "screen-only", label: "Bagikan layar saja", detail: "Izinkan melihat tanpa memberi PIN." },
        ],
      },
      {
        id: "call-card",
        title: "Kartu disebut terblokir",
        context: "Penelepon menawarkan pembukaan kartu dengan meminta PIN.",
        evidence: ["Meminta PIN.", "Memberi batas waktu.", "Mengancam saldo tertahan."],
        choices: [
          { id: "pin", label: "Sebutkan PIN", detail: "Berikan PIN agar kartu aktif kembali." },
          { id: "official-channel", label: "Gunakan kanal resmi", detail: "Tutup telepon dan cek aplikasi/nomor resmi." },
          { id: "birthdate", label: "Berikan tanggal lahir", detail: "Ganti PIN dengan data pribadi lain." },
        ],
      },
      {
        id: "call-legit-response",
        title: "Langkah penanganan akhir",
        context: "Kamu ragu apakah benar ada transaksi mencurigakan.",
        evidence: ["Belum ada verifikasi dari aplikasi.", "Penelepon terus mendesak.", "Kanal resmi tersedia."],
        choices: [
          { id: "stay-call", label: "Tetap di telepon", detail: "Ikuti semua instruksi sampai selesai." },
          { id: "close-verify", label: "Tutup, cek, dan laporkan", detail: "Periksa aplikasi resmi dan hubungi bank." },
          { id: "call-back-number", label: "Telepon balik nomor tadi", detail: "Gunakan nomor dari riwayat panggilan." },
        ],
      },
    ],
  },
  {
    simulationId: "malware-analysis",
    title: "Sandbox Analisis Malware Dasar",
    shortDescription: "Analisis laporan sandbox fiktif tanpa menjalankan malware di perangkat nyata.",
    difficulty: "Lanjutan",
    estimatedMinutes: 10,
    xpReward: 40,
    color: "bg-pastel-lavender",
    icon: "terminal",
    objectives: [
      "Membedakan file, laporan sandbox, dan indikator kompromi (IOC).",
      "Menilai proses, jaringan, persistence, dan perubahan sistem.",
      "Menghindari kesimpulan terburu-buru dan false positive.",
    ],
    tutorial: [
      { title: "Sandbox", body: "Lingkungan terisolasi untuk mengamati perilaku file secara aman oleh pihak berwenang." },
      { title: "IOC", body: "Indicator of Compromise adalah petunjuk seperti domain asing, proses aneh, atau persistence." },
      { title: "Verifikasi tambahan", body: "Satu indikator belum selalu cukup. Bandingkan sumber, tanda tangan, hash, dan perilaku." },
    ],
    warning: "Jangan pernah menjalankan file mencurigakan di perangkat utama. Simulasi ini tidak memuat file atau kode malware.",
    scenarios: [
      {
        id: "sandbox-safe",
        title: "Aplikasi bertanda tangan valid",
        context: "Laporan fiktif menunjukkan aplikasi resmi tanpa perilaku jaringan yang aneh.",
        evidence: ["Tanda tangan digital valid.", "Hash cocok dengan vendor.", "Tidak membuat persistence.", "Koneksi hanya ke domain vendor."],
        choices: [
          { id: "safe-verified", label: "Aman setelah verifikasi", detail: "Catat bukti dan izinkan sesuai kebijakan." },
          { id: "danger", label: "Berbahaya", detail: "Karantina hanya karena file executable." },
          { id: "run-main", label: "Jalankan di perangkat utama", detail: "Uji ulang tanpa isolasi." },
        ],
      },
      {
        id: "sandbox-suspicious",
        title: "Dokumen membuat proses asing",
        context: "Dokumen kantor memulai proses skrip dan menghubungi domain baru.",
        evidence: ["Parent process dokumen.", "Child process tidak lazim.", "Domain baru terdaftar.", "Mengunduh file tambahan."],
        choices: [
          { id: "ignore", label: "Aman karena dokumen", detail: "Abaikan perilakunya." },
          { id: "suspicious-isolate", label: "Mencurigakan, isolasi", detail: "Karantina dan minta analisis lanjutan." },
          { id: "upload-public", label: "Unggah ke publik", detail: "Sebarkan file agar orang lain menguji." },
        ],
      },
      {
        id: "sandbox-danger",
        title: "Persistence dan pencurian data",
        context: "File mengubah konfigurasi startup dan mengirim data ke domain asing.",
        evidence: ["Membuat auto-start.", "Mengakses penyimpanan kredensial.", "Koneksi terenkripsi ke domain asing.", "Menghapus jejak log."],
        choices: [
          { id: "danger-escalate", label: "Berbahaya, eskalasi", detail: "Isolasi, simpan bukti, dan ikuti incident response." },
          { id: "suspicious-only", label: "Cukup mencurigakan", detail: "Biarkan berjalan sambil menunggu." },
          { id: "allow", label: "Izinkan", detail: "Koneksi terenkripsi berarti aman." },
        ],
      },
      {
        id: "sandbox-fp",
        title: "Kemungkinan false positive",
        context: "Alat internal terdeteksi karena melakukan pembaruan konfigurasi yang sudah disetujui.",
        evidence: ["Hash cocok repositori internal.", "Perubahan sesuai change ticket.", "Domain milik organisasi.", "Tidak ada perilaku tambahan."],
        choices: [
          { id: "verify-context", label: "Verifikasi konteks", detail: "Cocokkan izin, hash, pemilik, dan change ticket." },
          { id: "delete-all", label: "Hapus langsung", detail: "Anggap setiap alert selalu malware." },
          { id: "ignore-all", label: "Abaikan semua alert", detail: "Whitelist tanpa dokumentasi." },
        ],
      },
      {
        id: "sandbox-final",
        title: "Kesimpulan analisis",
        context: "Beberapa IOC kuat ditemukan, tetapi file asli tidak boleh dijalankan lagi.",
        evidence: ["Ada persistence.", "Ada domain asing.", "Ada unduhan tambahan.", "Bukti tersedia dari laporan sandbox."],
        choices: [
          { id: "document-escalate", label: "Dokumentasikan & eskalasi", detail: "Simpan IOC, karantina, dan lanjutkan prosedur resmi." },
          { id: "rerun-main", label: "Uji di laptop utama", detail: "Jalankan untuk memastikan dampaknya." },
          { id: "share-file", label: "Bagikan file mentah", detail: "Kirim ke grup umum untuk pendapat." },
        ],
      },
    ],
  },
];

export const getSimulationDefinition = (simulationId: string) =>
  SIMULATION_CATALOG.find((item) => item.simulationId === simulationId);
