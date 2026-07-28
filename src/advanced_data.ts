import { Course, Lesson, Question, Quiz } from "./types";

const PUBLISHED_AT = "2026-07-27T00:00:00Z";
const ADVANCED_PATH_ID = "advanced-path";

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
  warning?: string;
};

type QuestionBlueprint = {
  text: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  lessonId: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLessonContent(item: LessonBlueprint) {
  const concepts = item.topics
    .map((topic, index) => `${index + 1}. **${topic}** — pahami tujuan, bukti yang diperlukan, risiko, dan keputusan defensifnya.`)
    .join("\n");
  const checklist = item.tips.map((tip) => `- ${tip}`).join("\n");
  const warning = item.warning
    ? `\n**Batas Aman & Etika**\n${item.warning}\n`
    : "";

  return `**Estimasi Waktu**
Sekitar 20–30 menit.

**Tujuan Pembelajaran**
${item.objective}

**Pendahuluan**
Materi tingkat lanjut ini tetap berorientasi defensif. Kamu akan belajar mengambil keputusan berdasarkan scope, bukti, risiko, dan kebutuhan bisnis—bukan mencoba tindakan berbahaya pada sistem nyata.

**Konsep Utama**
${concepts}

**Contoh Sederhana**
${item.example}

**Studi Kasus**
Sebuah organisasi pendidikan mengalami indikasi gangguan pada layanan penting. Tentukan aset, bukti, pemilik keputusan, risiko operasional, serta kontrol yang paling aman sebelum bertindak.

**Kesalahan Umum**
${item.commonMistake}
${warning}
**Tips Keamanan**
${checklist}

**Ringkasan**
Keputusan keamanan tingkat lanjut harus dapat dijelaskan, dicatat, diuji, dan dipulihkan. Selalu utamakan izin, integritas bukti, least privilege, serta dampak terhadap pengguna.

**Mini Latihan**
${item.exercise}

Tuliskan keputusanmu, dua bukti pendukung, dan satu risiko apabila keputusan tersebut salah.`;
}

const courseBlueprints = [
  {
    id: "adv-pentest-legal",
    title: "Metodologi Penetration Testing yang Legal",
    description: "Memahami scope, izin, rules of engagement, validasi risiko, pelaporan, remediasi, dan retest secara etis.",
    category: "Security Assessment",
    minutes: 120,
    outcomes: ["Menyusun scope dan otorisasi", "Menilai temuan secara bertanggung jawab", "Membuat laporan dan retest yang dapat ditindaklanjuti"],
  },
  {
    id: "adv-web-security",
    title: "Advanced Web Security",
    description: "Menerapkan threat modeling, secure development lifecycle, API security, session hardening, dan logging.",
    category: "Application Security",
    minutes: 130,
    outcomes: ["Membuat threat model sederhana", "Memilih kontrol aplikasi berlapis", "Menjaga API, secret, dependency, dan log"],
  },
  {
    id: "adv-digital-forensics",
    title: "Digital Forensics Dasar",
    description: "Menjaga barang bukti digital, chain of custody, integrity, timeline, metadata, log, dan laporan.",
    category: "Digital Forensics",
    minutes: 120,
    outcomes: ["Menjaga integritas bukti", "Menyusun timeline berbasis artefak", "Mendokumentasikan temuan secara dapat diaudit"],
  },
  {
    id: "adv-malware-analysis",
    title: "Analisis Malware Dasar yang Aman",
    description: "Mengenali keluarga malware, analisis statis/dinamis, sandbox, IOC, perilaku, persistence, dan false positive.",
    category: "Malware Defense",
    minutes: 130,
    outcomes: ["Membedakan jenis malware", "Membaca laporan sandbox fiktif", "Menilai IOC tanpa menjalankan malware nyata"],
  },
  {
    id: "adv-threat-intelligence",
    title: "Threat Intelligence",
    description: "Mengolah IOC, TTP, sumber intelijen, enrichment, korelasi, confidence, dan sharing secara aman.",
    category: "Threat Intelligence",
    minutes: 115,
    outcomes: ["Menilai kualitas intelijen", "Mengorelasikan indikator dengan konteks", "Berbagi intelijen dengan aman"],
  },
  {
    id: "adv-siem-monitoring",
    title: "Security Monitoring dan SIEM",
    description: "Memahami log, event, alert, incident, correlation rule, baseline, anomaly, triage, dan dashboard.",
    category: "Security Operations",
    minutes: 125,
    outcomes: ["Membedakan event, alert, dan incident", "Melakukan triage alert", "Merancang monitoring yang dapat ditindaklanjuti"],
  },
  {
    id: "adv-incident-response",
    title: "Incident Response Lanjutan",
    description: "Mengelola klasifikasi, severity, containment, bukti, stakeholder, legal, continuity, dan root cause.",
    category: "Incident Response",
    minutes: 130,
    outcomes: ["Memprioritaskan insiden", "Memilih containment sesuai risiko", "Menghubungkan respons, continuity, dan perbaikan akar masalah"],
  },
  {
    id: "adv-zero-trust",
    title: "Secure Architecture dan Zero Trust",
    description: "Merancang defense in depth, Zero Trust, identity security, backup, resilience, secret, dan monitoring.",
    category: "Security Architecture",
    minutes: 140,
    outcomes: ["Menerapkan prinsip Zero Trust", "Merancang kontrol berlapis", "Menyeimbangkan confidentiality, integrity, dan availability"],
  },
] as const;

export const advancedCourses: Course[] = courseBlueprints.map((course, index) => ({
  id: course.id,
  learningPathId: ADVANCED_PATH_ID,
  title: course.title,
  slug: course.id,
  description: course.description,
  category: course.category,
  level: "advanced",
  order: index + 1,
  estimatedDuration: course.minutes,
  xpReward: [80, 95, 90, 100, 90, 105, 110, 130][index],
  learningOutcomes: [...course.outcomes],
  lessonCount: 0,
  status: "published",
}));

const lessonBlueprints: LessonBlueprint[] = [
  {
    id: "adv-pt-01", courseId: "adv-pentest-legal", title: "Modul 1 — Scope, Authorization, dan Etika",
    objective: "Menetapkan scope, otorisasi tertulis, etika, serta batas hukum sebelum assessment dimulai.",
    topics: ["Scope", "Authorization", "Rules of engagement", "Etika dan hukum"],
    example: "Izin menguji aplikasi A tidak otomatis memberi izin menguji penyedia pembayaran B yang terhubung.",
    commonMistake: "Menganggap niat belajar atau kepemilikan akun sebagai izin untuk menguji sistem.",
    tips: ["Pastikan izin tertulis", "Catat aset yang dilarang", "Tetapkan kontak darurat dan jam pengujian"],
    exercise: "Tandai bagian scope fiktif yang masih ambigu dan tuliskan pertanyaan klarifikasinya.",
    warning: "Jangan menguji target nyata tanpa izin eksplisit dari pemilik yang berwenang.",
  },
  {
    id: "adv-pt-02", courseId: "adv-pentest-legal", title: "Modul 2 — Asset Identification dan Assessment",
    objective: "Menginventarisasi aset, memahami reconnaissance secara konseptual, dan memprioritaskan vulnerability assessment.",
    topics: ["Asset identification", "Reconnaissance konseptual", "Vulnerability assessment", "Data minimization"],
    example: "Tim memulai dari inventaris aplikasi, pemilik, klasifikasi data, dan dependensi sebelum menilai risiko.",
    commonMistake: "Menjalankan pemindaian luas tanpa mengetahui dampak dan batas aset.",
    tips: ["Gunakan data minimum", "Hindari gangguan layanan", "Validasi kepemilikan setiap aset"],
    exercise: "Urutkan aset fiktif berdasarkan dampak dan jelaskan mana yang membutuhkan persetujuan tambahan.",
    warning: "Materi tidak memberikan langkah eksploitasi atau teknik pemindaian target nyata.",
  },
  {
    id: "adv-pt-03", courseId: "adv-pentest-legal", title: "Modul 3 — Risk Validation dan Reporting",
    objective: "Memvalidasi risiko secara aman dan menulis temuan yang memiliki bukti, dampak, serta rekomendasi.",
    topics: ["Risk validation", "Evidence", "Severity", "Reporting"],
    example: "Temuan menjelaskan kondisi, aset, bukti aman, dampak bisnis, tingkat keyakinan, dan rekomendasi.",
    commonMistake: "Memberi label kritis tanpa bukti atau konteks bisnis.",
    tips: ["Hilangkan data sensitif dari bukti", "Pisahkan fakta dan asumsi", "Gunakan bahasa yang dapat ditindaklanjuti"],
    exercise: "Perbaiki temuan fiktif yang hanya berbunyi 'sistem tidak aman'.",
  },
  {
    id: "adv-pt-04", courseId: "adv-pentest-legal", title: "Modul 4 — Remediation dan Retesting",
    objective: "Memprioritaskan remediasi, menerima risiko secara resmi, dan melakukan retest sesuai scope.",
    topics: ["Remediation", "Risk acceptance", "Retesting", "Closure"],
    example: "Retest memeriksa kontrol yang diperbaiki dan memastikan tidak ada regresi pada fungsi penting.",
    commonMistake: "Menutup temuan hanya karena tim pengembang mengatakan sudah diperbaiki.",
    tips: ["Tetapkan pemilik perbaikan", "Uji bukti penutupan", "Catat residual risk"],
    exercise: "Buat checklist penutupan untuk temuan akses admin yang salah.",
  },
  {
    id: "adv-web-01", courseId: "adv-web-security", title: "Modul 1 — Threat Modeling dan Secure SDLC",
    objective: "Mengidentifikasi aset, trust boundary, ancaman, dan kontrol sejak siklus pengembangan.",
    topics: ["Threat modeling", "Secure development lifecycle", "Asset", "Trust boundary"],
    example: "Tim menandai aliran data login, penyimpanan token, dan layanan eksternal sebelum implementasi.",
    commonMistake: "Menambahkan keamanan hanya setelah aplikasi masuk produksi.",
    tips: ["Review desain lebih awal", "Libatkan pemilik bisnis", "Perbarui threat model saat arsitektur berubah"],
    exercise: "Gambar aliran data konseptual aplikasi belajar dan tandai dua trust boundary.",
  },
  {
    id: "adv-web-02", courseId: "adv-web-security", title: "Modul 2 — Input, Access Control, dan Session",
    objective: "Menerapkan secure input handling, access control design, dan session hardening.",
    topics: ["Secure input handling", "Server-side validation", "Access control design", "Session hardening"],
    example: "Setiap endpoint memeriksa role di server dan session sensitif memiliki masa aktif terbatas.",
    commonMistake: "Mengandalkan tombol tersembunyi atau validasi browser sebagai kontrol keamanan.",
    tips: ["Validasi di server", "Tolak akses secara default", "Rotasi session setelah perubahan privilege"],
    exercise: "Audit skenario pengguna biasa yang mengirim request langsung ke endpoint admin.",
  },
  {
    id: "adv-web-03", courseId: "adv-web-security", title: "Modul 3 — API Security dan Rate Limiting",
    objective: "Melindungi API melalui authentication, authorization, schema validation, quota, dan rate limiting.",
    topics: ["API security", "Schema validation", "Rate limiting", "Abuse prevention"],
    example: "Endpoint reset dibatasi, diaudit, dan memvalidasi payload agar tidak dapat dipanggil tanpa batas.",
    commonMistake: "Mengira API aman karena tidak terlihat pada antarmuka.",
    tips: ["Validasi setiap request", "Gunakan batas per identitas dan risiko", "Pantau lonjakan kegagalan"],
    exercise: "Pilih batas defensif untuk login, pencarian katalog, dan reset progres.",
  },
  {
    id: "adv-web-04", courseId: "adv-web-security", title: "Modul 4 — Secret, Dependency, Header, dan Logging",
    objective: "Mengelola secret, dependency, security header, serta logging tanpa membocorkan data sensitif.",
    topics: ["Secrets management", "Dependency security", "Security headers", "Security logging"],
    example: "API key disimpan di secret manager; log mencatat request ID dan hasil, bukan password atau token.",
    commonMistake: "Menyimpan secret di repository atau menulis token lengkap ke log.",
    tips: ["Rotasi secret", "Inventaris dependency", "Redact data sensitif dari log"],
    exercise: "Tandai data yang boleh dan tidak boleh muncul pada contoh log autentikasi.",
  },
  {
    id: "adv-for-01", courseId: "adv-digital-forensics", title: "Modul 1 — Evidence dan Chain of Custody",
    objective: "Memahami digital evidence, preservation, chain of custody, dan kewenangan penanganan.",
    topics: ["Digital evidence", "Evidence preservation", "Chain of custody", "Authorization"],
    example: "Setiap perpindahan media dicatat: siapa, kapan, tujuan, kondisi, dan metode penyimpanan.",
    commonMistake: "Membuka bukti asli berulang kali tanpa dokumentasi.",
    tips: ["Batasi akses bukti", "Gunakan salinan kerja", "Catat setiap tindakan"],
    exercise: "Lengkapi formulir chain of custody yang kehilangan waktu dan nama penerima.",
  },
  {
    id: "adv-for-02", courseId: "adv-digital-forensics", title: "Modul 2 — Disk Image dan Hash Verification",
    objective: "Menjelaskan disk image secara konseptual, file integrity, dan hash verification.",
    topics: ["Disk image konseptual", "File integrity", "Hash verification", "Working copy"],
    example: "Hash dicatat sebelum dan sesudah pemindahan untuk menunjukkan bukti tidak berubah.",
    commonMistake: "Menganggap nama file sama berarti isi file pasti sama.",
    tips: ["Simpan hash dan waktu", "Pisahkan bukti asli", "Gunakan prosedur organisasi"],
    exercise: "Jelaskan mengapa hash berbeda harus menghentikan analisis dan memicu investigasi proses.",
  },
  {
    id: "adv-for-03", courseId: "adv-digital-forensics", title: "Modul 3 — Metadata, Timeline, dan Log Analysis",
    objective: "Mengorelasikan metadata, timeline, dan log tanpa menganggap satu artefak sebagai kebenaran tunggal.",
    topics: ["Metadata", "Timeline analysis", "Log analysis", "Time synchronization"],
    example: "Waktu login, perubahan file, dan alert jaringan dibandingkan setelah zona waktu dinormalisasi.",
    commonMistake: "Menggabungkan timestamp dengan zona waktu berbeda tanpa normalisasi.",
    tips: ["Catat sumber dan zona waktu", "Cari dukungan lintas artefak", "Tandai data yang hilang"],
    exercise: "Susun empat kejadian fiktif menjadi timeline dan jelaskan satu ketidakpastian.",
  },
  {
    id: "adv-for-04", courseId: "adv-digital-forensics", title: "Modul 4 — Dokumentasi dan Laporan",
    objective: "Menyusun laporan forensik yang membedakan fakta, interpretasi, keterbatasan, dan kesimpulan.",
    topics: ["Documentation", "Finding", "Limitation", "Reporting"],
    example: "Laporan menyebut artefak yang diperiksa, metode, hash, timeline, hasil, dan keterbatasan.",
    commonMistake: "Menyimpulkan identitas pelaku hanya dari satu alamat IP.",
    tips: ["Gunakan bahasa netral", "Sertakan provenance bukti", "Peer review kesimpulan penting"],
    exercise: "Ubah klaim absolut menjadi kesimpulan berbasis keyakinan dan bukti.",
  },
  {
    id: "adv-mal-01", courseId: "adv-malware-analysis", title: "Modul 1 — Jenis Malware dan Batas Aman",
    objective: "Membedakan virus, worm, trojan, ransomware, dan spyware secara konseptual.",
    topics: ["Malware", "Virus dan worm", "Trojan", "Ransomware dan spyware"],
    example: "Klasifikasi didasarkan pada perilaku dan penyebaran, bukan hanya nama file.",
    commonMistake: "Menjalankan sampel untuk 'melihat apa yang terjadi' pada perangkat utama.",
    tips: ["Jangan membuka sampel", "Gunakan laporan fiktif/terotorisasi", "Eskalasi ke analis berwenang"],
    exercise: "Cocokkan lima deskripsi perilaku fiktif dengan kategori malware.",
    warning: "Tidak ada malware nyata atau source code malware pada materi ini.",
  },
  {
    id: "adv-mal-02", courseId: "adv-malware-analysis", title: "Modul 2 — Static, Dynamic, dan Sandbox",
    objective: "Membedakan static analysis, dynamic analysis, dan sandbox terisolasi.",
    topics: ["Static analysis", "Dynamic analysis", "Sandbox", "Isolation"],
    example: "Laporan sandbox fiktif mencatat proses, file, registry konseptual, dan koneksi jaringan.",
    commonMistake: "Menganggap sandbox menjamin risiko nol.",
    tips: ["Gunakan lingkungan berwenang", "Pisahkan jaringan analisis", "Jangan membawa artefak ke perangkat utama"],
    exercise: "Pilih informasi yang berasal dari analisis statis dan dinamis pada laporan fiktif.",
    warning: "Analisis dinamis hanya dilakukan laboratorium terisolasi oleh pihak berwenang.",
  },
  {
    id: "adv-mal-03", courseId: "adv-malware-analysis", title: "Modul 3 — IOC dan Perilaku",
    objective: "Membaca IOC, process behavior, network behavior, dan persistence secara konseptual.",
    topics: ["Indicator of Compromise", "Process behavior", "Network behavior", "Persistence konseptual"],
    example: "Proses asing, koneksi domain baru, dan perubahan autorun bersama-sama meningkatkan keyakinan risiko.",
    commonMistake: "Memblokir seluruh organisasi hanya karena satu IOC tanpa konteks.",
    tips: ["Korelasikan beberapa indikator", "Catat confidence", "Periksa dampak sebelum blokir"],
    exercise: "Nilai laporan sandbox fiktif sebagai aman, mencurigakan, atau berbahaya beserta buktinya.",
  },
  {
    id: "adv-mal-04", courseId: "adv-malware-analysis", title: "Modul 4 — False Positive dan Verifikasi",
    objective: "Membedakan indikator kuat, false positive, dan kebutuhan verifikasi tambahan.",
    topics: ["False positive", "Confidence level", "Context", "Additional verification"],
    example: "Aplikasi resmi dan malware dapat sama-sama membuat proses anak; konteks signer dan perilaku lain membedakannya.",
    commonMistake: "Menganggap satu indikator generik selalu membuktikan malware.",
    tips: ["Cari pembanding bersih", "Gunakan banyak sumber", "Dokumentasikan ketidakpastian"],
    exercise: "Identifikasi indikator lemah dan kuat dari dua laporan fiktif.",
  },
  {
    id: "adv-ti-01", courseId: "adv-threat-intelligence", title: "Modul 1 — Actor, Campaign, IOC, dan TTP",
    objective: "Membedakan threat actor, campaign, IOC, serta tactics, techniques, and procedures.",
    topics: ["Threat actor", "Threat campaign", "IOC", "Tactics, Techniques, and Procedures"],
    example: "IOC dapat berubah cepat, sedangkan pola TTP membantu melihat perilaku yang lebih stabil.",
    commonMistake: "Mengatribusikan serangan kepada aktor hanya dari satu IOC.",
    tips: ["Pisahkan observasi dan atribusi", "Catat confidence", "Hindari klaim tanpa bukti"],
    exercise: "Kelompokkan potongan laporan fiktif menjadi actor, campaign, IOC, atau TTP.",
  },
  {
    id: "adv-ti-02", courseId: "adv-threat-intelligence", title: "Modul 2 — Sumber dan Enrichment",
    objective: "Menilai sumber threat intelligence dan memperkaya indikator dengan konteks yang relevan.",
    topics: ["Intelligence source", "Reliability", "Data enrichment", "Freshness"],
    example: "Domain dinilai bersama usia, konteks penggunaan, sumber laporan, dan waktu pengamatan.",
    commonMistake: "Memperlakukan daftar publik lama sebagai fakta terkini.",
    tips: ["Periksa tanggal", "Nilai reputasi sumber", "Simpan provenance"],
    exercise: "Bandingkan dua sumber fiktif dan pilih mana yang lebih dapat dipercaya.",
  },
  {
    id: "adv-ti-03", courseId: "adv-threat-intelligence", title: "Modul 3 — Korelasi dan Confidence",
    objective: "Mengorelasikan indikator dan memberi confidence level yang proporsional.",
    topics: ["Correlation", "Confidence level", "False positive", "Analytic judgment"],
    example: "IOC yang muncul pada endpoint, DNS, dan laporan kredibel memiliki keyakinan lebih kuat.",
    commonMistake: "Mengubah korelasi waktu menjadi hubungan sebab akibat tanpa bukti.",
    tips: ["Gunakan minimal dua sumber", "Tuliskan asumsi", "Perbarui penilaian saat bukti berubah"],
    exercise: "Beri confidence rendah/sedang/tinggi pada tiga laporan fiktif.",
  },
  {
    id: "adv-ti-04", courseId: "adv-threat-intelligence", title: "Modul 4 — Sharing Intelligence yang Aman",
    objective: "Berbagi intelijen secara aman dengan klasifikasi, redaksi, dan tujuan yang jelas.",
    topics: ["Information classification", "Need to know", "Redaction", "Safe sharing"],
    example: "Laporan dibagikan tanpa identitas korban dan hanya memuat indikator yang dibutuhkan penerima.",
    commonMistake: "Menyebarkan log mentah yang berisi data pribadi.",
    tips: ["Redact data sensitif", "Pilih penerima", "Tetapkan masa berlaku indikator"],
    exercise: "Redaksi laporan fiktif sebelum dibagikan ke komunitas tepercaya.",
  },
  {
    id: "adv-siem-01", courseId: "adv-siem-monitoring", title: "Modul 1 — Log, Event, Alert, dan Incident",
    objective: "Membedakan log, event, alert, dan incident dalam operasi keamanan.",
    topics: ["Log", "Event", "Alert", "Incident"],
    example: "Login gagal adalah event; lonjakan lintas akun dapat menjadi alert; bukti takeover menjadikannya incident.",
    commonMistake: "Menganggap semua alert sebagai insiden.",
    tips: ["Definisikan kriteria eskalasi", "Simpan konteks", "Ukur kualitas alert"],
    exercise: "Klasifikasikan enam catatan sebagai log, event, alert, atau incident.",
  },
  {
    id: "adv-siem-02", courseId: "adv-siem-monitoring", title: "Modul 2 — SIEM, Log Source, dan Correlation Rule",
    objective: "Memahami SIEM, sumber log, normalisasi, dan correlation rule.",
    topics: ["SIEM", "Log source", "Normalization", "Correlation rule"],
    example: "Rule menghubungkan login asing, perubahan role, dan unduhan besar dalam jendela waktu.",
    commonMistake: "Mengumpulkan semua log tanpa use case atau retensi yang jelas.",
    tips: ["Mulai dari risiko", "Sinkronkan waktu", "Uji rule dengan data aman"],
    exercise: "Pilih tiga sumber log untuk mendeteksi pengambilalihan akun.",
  },
  {
    id: "adv-siem-03", courseId: "adv-siem-monitoring", title: "Modul 3 — Baseline, Anomaly, dan False Positive",
    objective: "Membentuk baseline, mengenali anomaly, dan mengurangi false positive.",
    topics: ["Baseline", "Anomaly", "False positive", "Tuning"],
    example: "Unduhan besar normal bagi backup service, tetapi aneh bagi akun magang pada tengah malam.",
    commonMistake: "Menerapkan threshold sama untuk semua identitas.",
    tips: ["Gunakan konteks role", "Review perubahan pola", "Dokumentasikan tuning"],
    exercise: "Bedakan anomali valid dan aktivitas normal pada dataset fiktif.",
  },
  {
    id: "adv-siem-04", courseId: "adv-siem-monitoring", title: "Modul 4 — Alert Triage, Severity, dan Dashboard",
    objective: "Memprioritaskan alert berdasarkan dampak, confidence, aset, dan urgency.",
    topics: ["Alert triage", "Severity", "Priority", "Monitoring dashboard"],
    example: "Alert confidence sedang pada server pembayaran dapat diprioritaskan di atas alert tinggi pada aset uji.",
    commonMistake: "Mengurutkan alert hanya dari warna severity.",
    tips: ["Gabungkan likelihood dan impact", "Tetapkan SLA", "Tampilkan tren serta backlog"],
    exercise: "Urutkan lima alert fiktif dan jelaskan prioritas pertama.",
  },
  {
    id: "adv-ir-01", courseId: "adv-incident-response", title: "Modul 1 — Classification, Severity, dan Triage",
    objective: "Mengklasifikasikan insiden dan menentukan severity serta prioritas triage.",
    topics: ["Incident classification", "Severity", "Triage", "Escalation"],
    example: "Kebocoran data sensitif dengan dampak luas membutuhkan eskalasi berbeda dari malware yang sudah terisolasi.",
    commonMistake: "Menentukan severity tanpa melihat aset dan dampak bisnis.",
    tips: ["Gunakan matriks konsisten", "Validasi bukti awal", "Revisi severity saat fakta berubah"],
    exercise: "Nilai tiga insiden fiktif dan pilih urutan respons.",
  },
  {
    id: "adv-ir-02", courseId: "adv-incident-response", title: "Modul 2 — Containment dan Evidence Preservation",
    objective: "Memilih strategi containment sambil menjaga bukti dan kelangsungan layanan.",
    topics: ["Containment strategy", "Evidence preservation", "Short-term containment", "Long-term containment"],
    example: "Isolasi bertahap dipilih agar penyebaran berhenti tanpa menghentikan layanan kritis secara mendadak.",
    commonMistake: "Mematikan seluruh sistem tanpa mempertimbangkan bukti dan dampak keselamatan.",
    tips: ["Catat keputusan", "Jaga salinan bukti", "Siapkan rollback"],
    exercise: "Pilih containment untuk akun admin, endpoint staf, dan server kritis.",
  },
  {
    id: "adv-ir-03", courseId: "adv-incident-response", title: "Modul 3 — Stakeholder, Legal, dan Business Continuity",
    objective: "Mengelola komunikasi stakeholder, pertimbangan legal, business continuity, dan disaster recovery.",
    topics: ["Stakeholder communication", "Legal consideration", "Business continuity", "Disaster recovery"],
    example: "Tim teknis, pimpinan, legal, dan komunikasi menerima informasi sesuai peran melalui satu sumber resmi.",
    commonMistake: "Menyampaikan dugaan yang belum diverifikasi sebagai fakta publik.",
    tips: ["Tetapkan communication lead", "Jaga kerahasiaan", "Latih prosedur continuity"],
    exercise: "Buat matriks siapa perlu mengetahui apa pada insiden fiktif.",
  },
  {
    id: "adv-ir-04", courseId: "adv-incident-response", title: "Modul 4 — Post-Incident dan Root Cause",
    objective: "Melakukan post-incident review, root cause analysis, dan perbaikan terukur.",
    topics: ["Post-incident review", "Root cause analysis", "Lessons learned", "Corrective action"],
    example: "Akar masalah bukan hanya klik pengguna, tetapi juga kontrol email, MFA, pelatihan, dan monitoring yang lemah.",
    commonMistake: "Menyalahkan individu dan mengabaikan kegagalan sistem.",
    tips: ["Pisahkan trigger dan root cause", "Tetapkan action owner", "Uji efektivitas perbaikan"],
    exercise: "Buat five-whys defensif dari skenario account takeover.",
  },
  {
    id: "adv-zt-01", courseId: "adv-zero-trust", title: "Modul 1 — Defense in Depth dan Zero Trust",
    objective: "Menerapkan defense in depth dan prinsip never trust, always verify.",
    topics: ["Defense in depth", "Zero Trust", "Explicit verification", "Assume breach"],
    example: "Akses internal tetap memerlukan identitas kuat, device posture, konteks, dan policy.",
    commonMistake: "Menganggap Zero Trust berarti tidak mempercayai manusia atau membeli satu produk.",
    tips: ["Verifikasi setiap akses", "Gunakan sinyal kontekstual", "Evaluasi akses berkelanjutan"],
    exercise: "Ubah desain 'jaringan kantor selalu tepercaya' menjadi keputusan Zero Trust.",
  },
  {
    id: "adv-zt-02", courseId: "adv-zero-trust", title: "Modul 2 — Identity, Least Privilege, dan Segmentation",
    objective: "Menggabungkan identity security, least privilege, dan network segmentation.",
    topics: ["Identity security", "Least privilege", "Network segmentation", "Privileged access"],
    example: "Akun admin terpisah, digunakan sementara, diaudit, dan hanya mencapai segmen yang dibutuhkan.",
    commonMistake: "Memberi akses permanen untuk menghindari proses persetujuan.",
    tips: ["Gunakan just-in-time access", "Review privilege", "Pisahkan jalur administrasi"],
    exercise: "Rancang akses minimum bagi siswa, instruktur, admin konten, dan operator.",
  },
  {
    id: "adv-zt-03", courseId: "adv-zero-trust", title: "Modul 3 — Secure-by-Design, Secret, dan Monitoring",
    objective: "Mengintegrasikan secure-by-design, secrets management, dan monitoring architecture.",
    topics: ["Secure-by-design", "Secrets management", "Monitoring architecture", "Auditability"],
    example: "Layanan menggunakan service account khusus, secret manager, log terpusat, dan alert atas perubahan hak akses.",
    commonMistake: "Menggunakan satu kredensial untuk banyak layanan.",
    tips: ["Pisahkan identitas layanan", "Rotasi secret", "Pantau control-plane"],
    exercise: "Temukan single point of compromise pada arsitektur fiktif.",
  },
  {
    id: "adv-zt-04", courseId: "adv-zero-trust", title: "Modul 4 — Backup, Redundancy, Availability, dan Resilience",
    objective: "Merancang backup strategy, redundancy, availability, dan resilience yang dapat diuji.",
    topics: ["Backup strategy", "Redundancy", "Availability", "Resilience"],
    example: "Backup terenkripsi, terpisah, memiliki retensi, dan diuji restore secara berkala.",
    commonMistake: "Menganggap backup berhasil hanya karena job berstatus sukses.",
    tips: ["Uji restore", "Pisahkan failure domain", "Tetapkan RTO dan RPO"],
    exercise: "Pilih desain pemulihan untuk layanan belajar dengan target waktu yang berbeda.",
  },
];

const courseOrder = new Map(advancedCourses.map((course) => [course.id, course.order]));

export const advancedLessons: Lesson[] = lessonBlueprints.map((lesson) => {
  const siblings = lessonBlueprints.filter((item) => item.courseId === lesson.courseId);
  const order = siblings.findIndex((item) => item.id === lesson.id) + 1;
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    learningPathId: ADVANCED_PATH_ID,
    title: lesson.title,
    slug: slugify(lesson.title),
    order,
    objective: lesson.objective,
    content: buildLessonContent(lesson),
    exampleCase: { title: "Studi Kasus Defensif", description: lesson.example },
    securityTips: lesson.tips,
    keyTakeaways: [
      lesson.objective,
      `Mini latihan: ${lesson.exercise}`,
      `Modul ini merupakan bagian ke-${order} pada kelas urutan ${courseOrder.get(lesson.courseId)}.`,
    ],
    estimatedDuration: 25,
    xpReward: 15,
    status: "published",
  };
});

advancedCourses.forEach((course) => {
  course.lessonCount = advancedLessons.filter((lesson) => lesson.courseId === course.id).length;
});

function q(
  text: string,
  options: [string, string, string, string],
  correct: 0 | 1 | 2 | 3,
  explanation: string,
  lessonId: string
): QuestionBlueprint {
  return { text, options, correct, explanation, lessonId };
}

function createQuiz(courseId: string, title: string, description: string, count: number, xpReward: number, passingScore = 80): Quiz {
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
    quiz: createQuiz("adv-pentest-legal", "Quiz Penetration Testing Legal", "Uji etika, scope, pelaporan, remediasi, dan retest.", 5, 35),
    questions: [
      q("Izin hanya mencakup aplikasi A. Bolehkah menguji vendor pembayaran yang terhubung?", ["Boleh karena terhubung", "Tidak tanpa izin eksplisit vendor/pemilik", "Boleh pada malam hari", "Boleh jika tanpa laporan"], 1, "Scope tidak meluas otomatis ke aset pihak ketiga.", "adv-pt-01"),
      q("Langkah pertama sebelum assessment?", ["Memastikan otorisasi dan scope tertulis", "Menguji semua alamat", "Menghapus log", "Mempublikasikan target"], 0, "Izin dan batas kerja harus jelas sebelum tindakan teknis.", "adv-pt-01"),
      q("Temuan yang baik harus memuat?", ["Hanya judul menakutkan", "Bukti aman, dampak, confidence, dan rekomendasi", "Data pribadi lengkap", "Asumsi tanpa konteks"], 1, "Temuan harus dapat diverifikasi dan ditindaklanjuti.", "adv-pt-03"),
      q("Kapan temuan layak ditutup?", ["Saat developer berkata selesai", "Setelah remediasi divalidasi melalui retest sesuai scope", "Setelah satu hari", "Saat bukti dihapus"], 1, "Retest memberi bukti bahwa kontrol bekerja.", "adv-pt-04"),
      q("Reconnaissance pada materi ini dipahami sebagai?", ["Eksploitasi target nyata", "Pemahaman konseptual aset dalam scope berizin", "Pencurian data", "Penyebaran malware"], 1, "Pembelajaran dibatasi pada metodologi legal dan konseptual.", "adv-pt-02"),
    ],
  },
  {
    quiz: createQuiz("adv-web-security", "Quiz Advanced Web Security", "Uji desain kontrol aplikasi dan API secara defensif.", 5, 35),
    questions: [
      q("Kapan threat modeling paling berguna?", ["Sejak desain dan diperbarui saat arsitektur berubah", "Hanya setelah insiden", "Setelah aplikasi ditutup", "Tidak pernah"], 0, "Threat modeling dini mengurangi biaya perbaikan.", "adv-web-01"),
      q("Tombol admin disembunyikan tetapi endpoint tidak cek role. Perbaikan?", ["Ganti warna", "Authorization server-side", "Perpanjang URL", "Tambah animasi"], 1, "Kontrol akses wajib ditegakkan server.", "adv-web-02"),
      q("Endpoint reset sensitif memerlukan?", ["Payload bebas", "Validasi, authorization, rate limiting, dan audit", "Tanpa log", "Token di URL"], 1, "Kontrol berlapis mencegah penyalahgunaan.", "adv-web-03"),
      q("Tempat tepat menyimpan API key produksi?", ["Repository publik", "Secret manager dengan akses minimum", "Chat grup", "Bundle frontend"], 1, "Secret perlu dikelola terpisah dari kode.", "adv-web-04"),
      q("Apa yang tidak boleh ditulis ke log?", ["Request ID", "Status code", "Password atau token lengkap", "Waktu request"], 2, "Log tidak boleh menjadi sumber kebocoran kredensial.", "adv-web-04"),
    ],
  },
  {
    quiz: createQuiz("adv-digital-forensics", "Quiz Digital Forensics Dasar", "Uji integritas bukti, timeline, dan laporan.", 5, 35),
    questions: [
      q("Tujuan chain of custody?", ["Mencatat penguasaan dan perpindahan bukti", "Mempercepat internet", "Mengubah metadata", "Menghapus hash"], 0, "Chain of custody mendukung integritas dan akuntabilitas.", "adv-for-01"),
      q("Hash bukti berubah setelah transfer. Tindakan?", ["Abaikan", "Hentikan dan investigasi integritas proses", "Ubah hash lama", "Teruskan sebagai bukti identik"], 1, "Perubahan hash menunjukkan isi tidak identik atau proses bermasalah.", "adv-for-02"),
      q("Sebelum menggabungkan timestamp log?", ["Normalisasi zona waktu", "Hapus waktu", "Urutkan alfabet", "Ganti nama file"], 0, "Timeline memerlukan basis waktu konsisten.", "adv-for-03"),
      q("Kesimpulan forensik yang baik?", ["Pisahkan fakta, interpretasi, confidence, dan keterbatasan", "Tuduh pelaku dari satu IP", "Hilangkan sumber bukti", "Gunakan asumsi saja"], 0, "Laporan harus transparan dan dapat diaudit.", "adv-for-04"),
      q("Bukti asli sebaiknya?", ["Dipakai untuk semua eksperimen", "Dijaga; analisis dilakukan pada salinan kerja sesuai prosedur", "Dibagikan publik", "Diubah agar mudah dibaca"], 1, "Preservasi menjaga integritas bukti.", "adv-for-01"),
    ],
  },
  {
    quiz: createQuiz("adv-malware-analysis", "Quiz Analisis Malware Aman", "Uji pembacaan laporan sandbox tanpa malware nyata.", 5, 35),
    questions: [
      q("Bolehkah sampel mencurigakan dijalankan di laptop utama?", ["Boleh offline", "Tidak; gunakan lingkungan terisolasi oleh pihak berwenang", "Boleh sekali", "Boleh jika nama file PDF"], 1, "Analisis harus dilakukan secara aman dan terisolasi.", "adv-mal-02"),
      q("Tiga perilaku bersama: proses asing, domain baru, persistence. Penilaian?", ["Lebih kuat sebagai indikasi berbahaya", "Pasti aman", "Tidak perlu konteks", "Hanya masalah tampilan"], 0, "Korelasi beberapa perilaku meningkatkan confidence.", "adv-mal-03"),
      q("IOC adalah?", ["Indikator yang dapat membantu mendeteksi kompromi", "Bukti tunggal yang selalu final", "Source code malware", "Jenis password"], 0, "IOC perlu konteks dan verifikasi.", "adv-mal-03"),
      q("False positive berarti?", ["Aktivitas aman salah ditandai berbahaya", "Malware pasti aktif", "Hash selalu berubah", "Sandbox rusak"], 0, "Deteksi dapat salah dan perlu verifikasi.", "adv-mal-04"),
      q("Perbedaan static dan dynamic analysis?", ["Static memeriksa artefak tanpa menjalankan; dynamic mengamati perilaku terisolasi", "Keduanya menjalankan target nyata", "Static hanya jaringan", "Dynamic tanpa sandbox"], 0, "Keduanya memiliki sumber bukti dan risiko berbeda.", "adv-mal-02"),
    ],
  },
  {
    quiz: createQuiz("adv-threat-intelligence", "Quiz Threat Intelligence", "Uji IOC, TTP, sumber, confidence, dan sharing.", 5, 35),
    questions: [
      q("Mengapa TTP sering lebih stabil daripada IOC?", ["Perilaku aktor cenderung berubah lebih lambat daripada domain/hash", "TTP adalah password", "IOC tidak pernah berubah", "TTP tidak perlu bukti"], 0, "IOC dapat cepat berganti, sedangkan pola perilaku lebih bertahan.", "adv-ti-01"),
      q("Daftar IOC lama sebaiknya?", ["Dipakai tanpa cek", "Dinilai freshness, provenance, dan konteksnya", "Disebar sebagai fakta", "Menggantikan monitoring"], 1, "Kualitas intelijen bergantung pada sumber dan waktu.", "adv-ti-02"),
      q("Confidence tinggi sebaiknya didukung?", ["Beberapa sumber dan korelasi relevan", "Satu rumor", "Warna dashboard", "Asumsi analis"], 0, "Bukti lintas sumber memperkuat keyakinan.", "adv-ti-03"),
      q("Sebelum berbagi laporan?", ["Sertakan semua data korban", "Redact data sensitif dan batasi penerima", "Hilangkan provenance", "Buat publik otomatis"], 1, "Sharing harus mengikuti need-to-know dan klasifikasi.", "adv-ti-04"),
      q("Atribusi aktor dari satu IP adalah?", ["Kesimpulan kuat", "Terlalu lemah tanpa bukti tambahan", "Selalu benar", "Tidak perlu confidence"], 1, "Satu indikator tidak cukup untuk atribusi.", "adv-ti-01"),
    ],
  },
  {
    quiz: createQuiz("adv-siem-monitoring", "Quiz Security Monitoring dan SIEM", "Uji triage, baseline, correlation, dan prioritas.", 5, 35),
    questions: [
      q("Rangkaian event menjadi incident ketika?", ["Ada bukti dampak/kompromi yang memenuhi kriteria", "Warnanya merah", "Log banyak", "Terjadi siang hari"], 0, "Incident memerlukan konteks dan validasi.", "adv-siem-01"),
      q("Correlation rule yang baik dimulai dari?", ["Use case risiko dan sumber log relevan", "Semua log tanpa tujuan", "Satu warna", "Menghapus timestamp"], 0, "Monitoring harus menjawab risiko nyata.", "adv-siem-02"),
      q("Unduhan besar oleh backup service mungkin?", ["Selalu insiden", "Normal sesuai baseline dan konteks role", "Harus dihapus", "Tidak perlu dicatat"], 1, "Anomali harus dibandingkan dengan baseline kontekstual.", "adv-siem-03"),
      q("Prioritas alert dipengaruhi?", ["Impact, likelihood/confidence, dan nilai aset", "Warna saja", "Urutan masuk saja", "Nama analis"], 0, "Triage menggabungkan risiko dan konteks.", "adv-siem-04"),
      q("Mengapa waktu log perlu sinkron?", ["Agar korelasi timeline akurat", "Agar file lebih kecil", "Agar password aman", "Agar dashboard berwarna"], 0, "Waktu konsisten penting untuk hubungan antarkejadian.", "adv-siem-02"),
    ],
  },
  {
    quiz: createQuiz("adv-incident-response", "Quiz Incident Response Lanjutan", "Uji triage, containment, komunikasi, continuity, dan RCA.", 5, 35),
    questions: [
      q("Severity insiden ditentukan dari?", ["Aset, dampak, scope, dan bukti", "Panik tim", "Jumlah email", "Warna logo"], 0, "Severity harus konsisten dengan risiko bisnis.", "adv-ir-01"),
      q("Containment yang baik?", ["Membatasi dampak sambil menjaga bukti dan layanan", "Menghapus semua bukti", "Selalu mematikan seluruh organisasi", "Menunggu tanpa catatan"], 0, "Strategi harus proporsional dan dapat dipulihkan.", "adv-ir-02"),
      q("Informasi publik saat insiden harus?", ["Berisi dugaan", "Dikoordinasikan dan berbasis fakta terverifikasi", "Memuat semua log", "Dikirim setiap staf"], 1, "Komunikasi terkoordinasi mengurangi kesalahan dan kebocoran.", "adv-ir-03"),
      q("Root cause berbeda dari trigger karena?", ["Root cause menjelaskan kegagalan sistem mendasar", "Trigger selalu manusia", "Root cause adalah warna alert", "Tidak berbeda"], 0, "Trigger awal bukan selalu akar masalah.", "adv-ir-04"),
      q("Business continuity berfokus pada?", ["Menjaga fungsi kritis selama gangguan", "Menghapus backup", "Menutup semua layanan permanen", "Mengganti nama insiden"], 0, "Continuity mempertahankan operasi kritis.", "adv-ir-03"),
    ],
  },
];

const finalQuestions: QuestionBlueprint[] = [
  q("Assessment legal selalu dimulai dengan?", ["Scope dan authorization tertulis", "Eksploitasi", "Publikasi", "Penghapusan log"], 0, "Izin dan batas adalah fondasi assessment legal.", "adv-pt-01"),
  q("Temuan tanpa konteks bisnis sebaiknya?", ["Langsung kritis", "Dilengkapi dampak, bukti, dan confidence", "Disebar", "Ditutup"], 1, "Risiko perlu bukti dan konteks.", "adv-pt-03"),
  q("Tujuan retest?", ["Memvalidasi remediasi", "Membuka scope baru", "Menghapus bukti", "Mengganti pemilik"], 0, "Retest memeriksa efektivitas perbaikan.", "adv-pt-04"),
  q("Threat model diperbarui ketika?", ["Arsitektur atau risiko berubah", "Hanya tiap 10 tahun", "Tidak pernah", "Setelah log dihapus"], 0, "Threat model harus mengikuti sistem.", "adv-web-01"),
  q("Authorization endpoint ditegakkan di?", ["Server", "Warna tombol", "CSS", "Nama route"], 0, "Server adalah batas kepercayaan.", "adv-web-02"),
  q("Secret produksi sebaiknya?", ["Dikelola terpisah dengan least privilege", "Masuk bundle frontend", "Dikirim chat", "Ditulis log"], 0, "Secret manager mengurangi paparan.", "adv-web-04"),
  q("Chain of custody mencatat?", ["Perpindahan dan penguasaan bukti", "Warna file", "Kecepatan jaringan", "Skor kuis"], 0, "Riwayat bukti mendukung akuntabilitas.", "adv-for-01"),
  q("Hash membantu memverifikasi?", ["Integritas artefak", "Identitas pelaku secara otomatis", "Hak akses", "Warna dashboard"], 0, "Hash membandingkan isi artefak.", "adv-for-02"),
  q("Timeline perlu normalisasi?", ["Zona waktu", "Font", "Badge", "Ukuran tombol"], 0, "Zona waktu konsisten mencegah urutan keliru.", "adv-for-03"),
  q("Analisis malware aman menggunakan?", ["Laporan fiktif/lingkungan terisolasi berwenang", "Laptop utama", "File nyata dari chat", "Perangkat keluarga"], 0, "Materi dan praktik harus aman.", "adv-mal-02"),
  q("IOC tunggal harus?", ["Dikorelasikan dengan konteks dan bukti lain", "Selalu dianggap final", "Dipublikasikan dengan data korban", "Diabaikan"], 0, "IOC bukan vonis tunggal.", "adv-mal-03"),
  q("False positive membutuhkan?", ["Verifikasi tambahan", "Panik", "Penghapusan semua file", "Akses admin"], 0, "Validasi menghindari respons salah.", "adv-mal-04"),
  q("TTP adalah?", ["Pola taktik, teknik, dan prosedur", "Token password", "Nama firewall", "Sertifikat"], 0, "TTP menggambarkan perilaku ancaman.", "adv-ti-01"),
  q("Freshness intelijen penting karena?", ["Indikator dapat berubah", "Semua IOC abadi", "Log tidak punya waktu", "TTP adalah warna"], 0, "Intelijen lama dapat kehilangan relevansi.", "adv-ti-02"),
  q("Sharing aman memerlukan?", ["Redaction dan need-to-know", "Semua data mentah", "Tanpa klasifikasi", "Penerima publik"], 0, "Data sensitif harus dilindungi.", "adv-ti-04"),
  q("Perbedaan alert dan incident?", ["Incident sudah tervalidasi memenuhi kriteria dampak/kompromi", "Alert selalu lebih parah", "Tidak ada", "Incident hanya log"], 0, "Alert memerlukan triage sebelum menjadi incident.", "adv-siem-01"),
  q("Baseline berguna untuk?", ["Membandingkan perilaku normal dan anomali", "Menghapus log", "Membuat password", "Mengganti role"], 0, "Baseline memberi konteks perilaku.", "adv-siem-03"),
  q("Prioritas alert tertinggi ditentukan dari?", ["Risiko dan nilai aset", "Warna saja", "Urutan alfabet", "Panjang pesan"], 0, "Triage berbasis impact dan likelihood.", "adv-siem-04"),
  q("Containment harus mempertimbangkan?", ["Dampak, bukti, continuity, dan rollback", "Hanya kecepatan", "Hanya panik", "Warna severity"], 0, "Containment perlu seimbang.", "adv-ir-02"),
  q("Komunikasi insiden sebaiknya?", ["Satu sumber resmi dan berbasis fakta", "Banyak rumor", "Tanpa legal", "Memuat rahasia"], 0, "Koordinasi menjaga konsistensi.", "adv-ir-03"),
  q("RCA yang baik mencari?", ["Kegagalan sistem mendasar", "Kambing hitam", "Warna alert", "Nama file"], 0, "Root cause mengarah pada perbaikan sistemik.", "adv-ir-04"),
  q("Zero Trust berarti?", ["Verifikasi eksplisit setiap akses", "Percaya semua jaringan internal", "Tidak ada pengguna", "Satu produk"], 0, "Trust tidak diberikan hanya dari lokasi.", "adv-zt-01"),
  q("Least privilege untuk admin?", ["Akses minimum dan sementara sesuai tugas", "Akses permanen ke semua sistem", "Akun bersama", "Tanpa audit"], 0, "Privilege perlu dibatasi.", "adv-zt-02"),
  q("Backup dinyatakan siap jika?", ["Restore diuji dan target RTO/RPO dipenuhi", "Job berwarna hijau", "File ada satu", "Tidak terenkripsi"], 0, "Kemampuan pulih harus dibuktikan.", "adv-zt-04"),
  q("Defense in depth memberikan?", ["Beberapa lapisan kontrol agar kegagalan satu kontrol tidak langsung fatal", "Satu password", "Tanpa monitoring", "Akses bebas"], 0, "Lapisan mengurangi single point of failure.", "adv-zt-01"),
];

quizBlueprints.push({
  quiz: createQuiz("adv-zero-trust", "Final Quiz Advanced", "Ujian akhir 25 soal yang mencakup delapan kelas Advanced.", 25, 75, 80),
  questions: finalQuestions,
});

export const advancedQuizzes: Quiz[] = quizBlueprints.map((item) => item.quiz);

export const advancedQuestions: Question[] = quizBlueprints.flatMap(({ quiz, questions: items }) =>
  items.map((item, index) => ({
    id: `q-${quiz.id}-${String(index + 1).padStart(2, "0")}`,
    quizId: quiz.id,
    courseId: quiz.courseId,
    questionText: item.text,
    options: item.options.map((text, optionIndex) => ({ id: ["a", "b", "c", "d"][optionIndex], text })),
    correctOptionId: ["a", "b", "c", "d"][item.correct],
    explanation: item.explanation,
    recommendedLessonId: item.lessonId,
    order: index + 1,
    status: "published",
  }))
);
