import React from "react";
import { ArrowLeft } from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";

interface PlaceholderProps {
  pageName: "privacy" | "terms";
  onNavigate: (route: string) => void;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ pageName, onNavigate }) => {
  const goHome = () => {
    onNavigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  switch (pageName) {
    case "privacy":
      return (
        <div className="max-w-3xl mx-auto my-12 px-4 font-sans text-brand-text">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="md" className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Kebijakan Privasi</h1>
            <p className="text-xs font-mono font-bold text-brand-muted">Pembaruan Terakhir: 19 Juli 2026</p>

            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Selamat datang di Cyber Academy AI. Kami sangat menghargai privasi data belajar Anda. Kebijakan Privasi ini menjelaskan jenis data belajar yang kami peroleh dan bagaimana kami menjaganya.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">1. Informasi yang Kami Kumpulkan</h2>
              <p>
                Untuk keperluan progres belajar, kuis, dan simulasi, kami menyimpan nama tampilan, email, data skor XP, pencapaian badge, serta riwayat interaksi AI Tutor Anda di dalam sistem database cloud Firebase kami yang aman.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">2. Integrasi Kecerdasan Buatan (Vertex AI)</h2>
              <p>
                Setiap pertanyaan yang dikirimkan melalui AI Tutor diproses oleh backend Express sebelum diteruskan ke Vertex AI. Backend menerapkan validasi, pembatasan input, dan penyaringan data sensitif sebelum permintaan diproses oleh layanan AI.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">3. Pengelolaan Data Belajar</h2>
              <p>
                Pengguna dapat mengelola dan mereset progress belajar melalui menu Pengaturan dengan proses konfirmasi yang tersedia. Fitur tersebut tidak mengubah atau menghapus akun Firebase Authentication pengguna.
              </p>
            </div>
          </NeoCard>
        </div>
      );

    case "terms":
      return (
        <div className="max-w-3xl mx-auto my-12 px-4 font-sans text-brand-text">
          <NeoButton variant="secondary" size="sm" onClick={goHome} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </NeoButton>

          <NeoCard bgColor="bg-brand-surface" shadowSize="md" className="space-y-6">
            <h1 className="text-3xl font-heading font-bold">Syarat & Ketentuan</h1>
            <p className="text-xs font-mono font-bold text-brand-muted">Pembaruan Terakhir: 19 Juli 2026</p>

            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Harap membaca Syarat & Ketentuan ini dengan saksama sebelum menggunakan platform Cyber Academy AI.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">1. Penggunaan Platform</h2>
              <p>
                Cyber Academy AI adalah platform edukasi keamanan siber defensif. Pengguna dilarang keras menyalahgunakan informasi atau simulasi di platform ini untuk melakukan tindakan ilegal seperti peretasan tanpa izin, serangan siber, atau manipulasi phishing di luar platform edukasi kami.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">2. Pembatasan Penggunaan AI</h2>
              <p>
                Layanan AI Tutor kami disediakan sebagai asisten belajar pribadi. Pengguna dilarang memaksa AI (melalui jailbreak prompt) untuk membagikan kode eksploit, malware, atau membocorkan data sensitif pihak ketiga.
              </p>

              <h2 className="text-xl font-heading font-bold mt-4">3. Validitas Sertifikat</h2>
              <p>
                Sertifikat yang diterbitkan oleh Cyber Academy AI adalah sertifikat kelulusan belajar internal guna meningkatkan motivasi, bukan merupakan sertifikat profesi atau lisensi formal dari asosiasi kepatuhan siber.
              </p>
            </div>
          </NeoCard>
        </div>
      );
  }
};
