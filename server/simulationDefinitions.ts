export interface SimulationAnswerKey {
  correctActionId: string;
  explanation: string;
  risk: string;
  tip: string;
}

export interface ServerSimulationDefinition {
  simulationId: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  xpReward: number;
  passingScore: number;
  status: "published";
  answers: Record<string, SimulationAnswerKey>;
}

export const SERVER_SIMULATIONS: ServerSimulationDefinition[] = [
  {
    simulationId: "phishing-email",
    title: "Detektif Email Phishing",
    slug: "phishing-email",
    type: "phishing",
    description: "Latihan memeriksa pengirim, domain, tautan, lampiran, dan urgensi email.",
    xpReward: 25,
    passingScore: 75,
    status: "published",
    answers: {
      "phish-obvious": {
        correctActionId: "report",
        explanation: "Domain palsu, ancaman satu jam, dan permintaan OTP adalah indikator phishing yang kuat.",
        risk: "Membuka tautan atau mengirim OTP dapat memberi penipu akses ke akun.",
        tip: "Buka aplikasi bank secara langsung dan laporkan email tersebut.",
      },
      "phish-bank": {
        correctActionId: "report",
        explanation: "Typosquatting pada domain dan tujuan tautan yang berbeda menunjukkan peniruan identitas.",
        risk: "Halaman login tiruan dapat mencuri kredensial.",
        tip: "Periksa ejaan domain karakter demi karakter.",
      },
      "phish-promo": {
        correctActionId: "report",
        explanation: "Hadiah tak dikenal, biaya pencairan, lampiran ZIP, dan urgensi adalah pola penipuan.",
        risk: "Lampiran dapat membawa program berbahaya dan pembayaran sulit dipulihkan.",
        tip: "Jangan membuka lampiran atau membayar hadiah yang tidak pernah diikuti.",
      },
      "phish-reset": {
        correctActionId: "report",
        explanation: "Layanan resmi tidak meminta password lama melalui halaman reset yang tidak resmi.",
        risk: "Password yang diberikan dapat dipakai mengambil alih akun lain.",
        tip: "Lakukan reset hanya dari aplikasi atau alamat resmi yang diketik sendiri.",
      },
      "email-safe": {
        correctActionId: "safe",
        explanation: "Domain terverifikasi, aktivitas sesuai, dan tidak ada permintaan rahasia membuat notifikasi ini wajar.",
        risk: "Tetap waspada karena tampilan saja tidak cukup; pastikan domain selalu cocok.",
        tip: "Untuk detail transaksi, buka aplikasi resmi tanpa mengeklik link email.",
      },
    },
  },
  {
    simulationId: "whatsapp-scam",
    title: "WhatsApp Scam & Kurir Paket Palsu",
    slug: "whatsapp-scam",
    type: "social-engineering",
    description: "Latihan menghadapi file APK, kurir palsu, akun keluarga tiruan, dan hadiah palsu.",
    xpReward: 30,
    passingScore: 75,
    status: "published",
    answers: {
      "wa-apk": {
        correctActionId: "block-report",
        explanation: "File APK dari nomor tak dikenal bukan foto paket dan tidak perlu dipasang.",
        risk: "APK dapat meminta akses SMS, notifikasi, atau data rekening.",
        tip: "Blokir, laporkan, dan cek paket hanya lewat aplikasi resmi.",
      },
      "wa-family": {
        correctActionId: "verify-known",
        explanation: "Permintaan transfer dari nomor baru harus diverifikasi lewat kanal yang sudah dikenal.",
        risk: "Penipu memanfaatkan rasa panik dan informasi keluarga yang bocor.",
        tip: "Hubungi nomor lama atau anggota keluarga lain sebelum bertindak.",
      },
      "wa-resi": {
        correctActionId: "official-app",
        explanation: "Status paket dapat diperiksa aman dengan nomor resi pada aplikasi atau situs resmi.",
        risk: "Link pendek dapat menyembunyikan halaman pencuri data kartu.",
        tip: "Ketik alamat resmi sendiri dan jangan masukkan data pembayaran dari chat.",
      },
      "wa-prize": {
        correctActionId: "report",
        explanation: "Hadiah yang tidak diikuti dan meminta biaya pencairan adalah pola scam.",
        risk: "Data identitas dapat disalahgunakan dan pembayaran tidak menjamin hadiah.",
        tip: "Jangan berdebat panjang; simpan bukti, laporkan, lalu blokir.",
      },
      "wa-legit": {
        correctActionId: "official-check",
        explanation: "Pemeriksaan melalui aplikasi resmi tidak membutuhkan APK, PIN, atau OTP dari chat.",
        risk: "Berpindah ke kanal tidak resmi membuka peluang penipuan.",
        tip: "Tetap gunakan aplikasi resmi walau notifikasi tampak wajar.",
      },
    },
  },
  {
    simulationId: "vishing-call",
    title: "Vishing: Telepon CS Bank Gadungan",
    slug: "vishing-call",
    type: "vishing",
    description: "Latihan memilih respons saat penelepon palsu meminta OTP, PIN, atau remote access.",
    xpReward: 35,
    passingScore: 75,
    status: "published",
    answers: {
      "call-otp": {
        correctActionId: "hangup-official",
        explanation: "Bank tidak meminta OTP untuk membatalkan transaksi.",
        risk: "OTP dapat mengesahkan login atau transaksi penipu.",
        tip: "Tutup telepon dan hubungi nomor resmi dari aplikasi atau kartu.",
      },
      "call-id": {
        correctActionId: "independent-check",
        explanation: "Caller ID dapat dipalsukan sehingga verifikasi harus dilakukan secara mandiri.",
        risk: "Nomor yang tampak resmi dapat membuat korban lengah.",
        tip: "Jangan menelepon balik nomor dari riwayat panggilan mencurigakan.",
      },
      "call-remote": {
        correctActionId: "refuse-remote",
        explanation: "Petugas bank tidak perlu mengendalikan layar atau perangkat nasabah.",
        risk: "Remote access memberi penipu kendali atas aplikasi dan data.",
        tip: "Tolak instalasi, putuskan panggilan, dan laporkan kejadian.",
      },
      "call-card": {
        correctActionId: "official-channel",
        explanation: "PIN tidak pernah diperlukan oleh petugas untuk membuka kartu.",
        risk: "PIN dan data pribadi dapat dipakai untuk transaksi atau pemulihan akun.",
        tip: "Cek status kartu langsung di aplikasi atau cabang resmi.",
      },
      "call-legit-response": {
        correctActionId: "close-verify",
        explanation: "Mengakhiri panggilan memberi ruang untuk memeriksa fakta tanpa tekanan.",
        risk: "Tetap berada di telepon membuat manipulasi dan pengumpulan data berlanjut.",
        tip: "Cek notifikasi aplikasi, ganti kredensial bila perlu, dan hubungi bank resmi.",
      },
    },
  },
  {
    simulationId: "malware-analysis",
    title: "Sandbox Analisis Malware Dasar",
    slug: "malware-analysis",
    type: "malware-analysis",
    description: "Latihan membaca laporan sandbox fiktif tanpa file atau kode malware nyata.",
    xpReward: 40,
    passingScore: 75,
    status: "published",
    answers: {
      "sandbox-safe": {
        correctActionId: "safe-verified",
        explanation: "Tanda tangan, hash, sumber, dan perilaku yang konsisten mendukung klasifikasi aman.",
        risk: "Menjalankan ulang file di perangkat utama tetap tidak diperlukan.",
        tip: "Dokumentasikan bukti verifikasi sebelum mengizinkan file.",
      },
      "sandbox-suspicious": {
        correctActionId: "suspicious-isolate",
        explanation: "Proses anak tak lazim, domain baru, dan unduhan tambahan memerlukan isolasi.",
        risk: "File dapat menjalankan tahap lanjutan sebelum analisis selesai.",
        tip: "Karantina dan eskalasi laporan kepada pihak berwenang.",
      },
      "sandbox-danger": {
        correctActionId: "danger-escalate",
        explanation: "Persistence, akses kredensial, koneksi asing, dan penghapusan log adalah IOC kuat.",
        risk: "Data dapat dicuri dan akses bertahan setelah perangkat dimulai ulang.",
        tip: "Isolasi sistem, simpan bukti, dan jalankan incident response.",
      },
      "sandbox-fp": {
        correctActionId: "verify-context",
        explanation: "Hash internal dan change ticket dapat menjelaskan alert, tetapi tetap harus diverifikasi.",
        risk: "Menghapus langsung mengganggu operasi; mengabaikan langsung juga berbahaya.",
        tip: "Nilai alert bersama konteks, pemilik aset, dan perubahan yang disetujui.",
      },
      "sandbox-final": {
        correctActionId: "document-escalate",
        explanation: "IOC harus didokumentasikan, dikarantina, dan dieskalasikan tanpa menjalankan file lagi.",
        risk: "Menjalankan atau membagikan file mentah memperluas paparan.",
        tip: "Bagikan hanya indikator dan laporan melalui kanal resmi yang aman.",
      },
    },
  },
];

export function getServerSimulation(simulationId: string) {
  return SERVER_SIMULATIONS.find((item) => item.simulationId === simulationId);
}
