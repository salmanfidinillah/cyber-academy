import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  createMyCertificate,
  CertificateEligibility,
  fetchCertificateEligibility,
  fetchMyCertificates,
} from "../services/achievementService";
import { fetchCatalogLearningPaths } from "../services/catalogService";
import { Certificate, LearningPath, User } from "../types";
import { 
  Award, FileDown, CheckCircle2, ShieldCheck, XCircle, ArrowRight, 
  Loader2, QrCode, Copy, Check, ExternalLink, Calendar, RefreshCw 
} from "lucide-react";
import QRCode from "qrcode";

interface CertificatePreviewProps {
  currentUser: User;
  onNavigate: (route: string) => void;
}

export function CertificatePreview({ currentUser, onNavigate }: CertificatePreviewProps) {
  const [selectedPathId, setSelectedPathId] = useState("beginner-path");
  const [availablePaths, setAvailablePaths] = useState<LearningPath[]>([]);
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);

  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const checkEligibilityAndCerts = async () => {
    const [eligibilityResult, certificates, paths] = await Promise.all([
      fetchCertificateEligibility(selectedPathId),
      fetchMyCertificates(),
      fetchCatalogLearningPaths(),
    ]);
    setEligibility(eligibilityResult);
    setAvailablePaths(paths);
    setActiveCert(certificates.find((certificate) => certificate.learningPathId === selectedPathId) || null);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchCertificateEligibility(selectedPathId),
      fetchMyCertificates(),
      fetchCatalogLearningPaths(),
    ])
      .then(([eligibilityResult, certificates, paths]) => {
        if (!active) return;
        setEligibility(eligibilityResult);
        setAvailablePaths(paths);
        setActiveCert(certificates.find((certificate) => certificate.learningPathId === selectedPathId) || null);
      })
      .catch((error) => {
        if (active) setErrorMsg(error.message || "Gagal memuat data sertifikat.");
      });
    if (currentUser?.displayName) {
      setRecipientName(currentUser.displayName);
    } else {
      setRecipientName("");
    }
    return () => {
      active = false;
    };
  }, [currentUser, selectedPathId]);

  // Generate QR code for certificate
  useEffect(() => {
    if (activeCert) {
      const vUrl = `${window.location.origin}/verify/certificate/${activeCert.certificateCode}`;
      QRCode.toDataURL(vUrl, { margin: 1, width: 120 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("Error generating QR preview:", err));
    }
  }, [activeCert]);

  const handleGenerate = async (selectedName?: string) => {
    setIsGenerating(true);
    setErrorMsg("");
    setGenStep(1);

    // Stagger fake step descriptions for high-fidelity interactive feel
    const timer1 = setTimeout(() => setGenStep(2), 1200);
    const timer2 = setTimeout(() => setGenStep(3), 2400);

    try {
      // API call to server (evaluates authentic database records)
      const certificate = await createMyCertificate(selectedPathId, selectedName?.trim());
      
      // Delay slightly for full animation effect
      setTimeout(() => {
        setIsGenerating(false);
        setActiveCert(certificate);
      }, 3500);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGenerating(false);
      setErrorMsg(err.message || "Gagal menerbitkan sertifikat. Harap ulangi sesaat lagi.");
    }
  };

  const handleCopyLink = () => {
    if (!activeCert) return;
    const vUrl = `${window.location.origin}/verify/certificate/${activeCert.certificateCode}`;
    navigator.clipboard.writeText(vUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!activeCert) return;
    setIsDownloading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/certificates/download/${activeCert.certificateCode}`);
      if (!response.ok) {
        throw new Error("Gagal mengunduh berkas PDF dari server.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sertifikat_CyberAcademy_${activeCert.certificateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      setErrorMsg("Gagal mengunduh PDF: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  const selectedPath = availablePaths.find((path) => path.id === selectedPathId);
  const requiredPassingScore = selectedPath?.level === "Advanced" ? 80 : selectedPath?.level === "Intermediate" ? 75 : 70;

  return (
    <div id="certificate-preview-container" className="mx-auto w-full min-w-0 max-w-5xl px-0 py-4 sm:px-4 sm:py-8">
      {/* Banner / Header */}
      <div className="relative mb-8 overflow-hidden rounded-xl border-3 border-black bg-[#D6C8FF] p-4 shadow-[4px_4px_0px_0px_#000000] sm:p-6 md:p-8">
        <div className="relative z-10">
          <span className="bg-black text-[#D6C8FF] font-mono text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">
            Sertifikasi Akademik
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mt-3 mb-2">
            Sertifikat Kelulusan
          </h1>
          <p className="text-black font-medium max-w-2xl leading-relaxed text-sm md:text-base">
            Klaim sertifikat kompetensi resmi Anda sebagai bukti keahlian pertahanan siber defensif yang terintegrasi secara kriptografis dan dapat diverifikasi secara publik menggunakan kode QR.
          </p>
        </div>
        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-black" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Pilih jalur sertifikat">
        {availablePaths.filter((path) => (path.courseCount ?? 0) > 0).map((path) => {
          const selected = path.id === selectedPathId;
          return (
            <button
              key={path.id}
              type="button"
              onClick={() => setSelectedPathId(path.id)}
              aria-pressed={selected}
              className={`min-w-0 rounded-xl border-3 border-black px-4 py-3 text-left font-black transition-all focus:outline-none focus:ring-4 focus:ring-pastel-blue ${
                selected
                  ? "bg-pastel-yellow shadow-none translate-x-1 translate-y-1"
                  : `${path.bgColor || "bg-white"} shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5`
              }`}
            >
              <span className="block text-xs uppercase">{path.level}</span>
              <span className="block break-words text-sm [overflow-wrap:anywhere]">{path.title.replace(`${path.level}: `, "")}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="mb-6 flex min-w-0 items-start gap-3 rounded-xl border-2 border-red-500 bg-red-100 p-4 font-bold text-red-700 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)] animate-shake">
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{errorMsg}</span>
        </div>
      )}

      {isGenerating ? (
        /* Dynamic Animated Loading State */
        <div className="mx-auto my-8 max-w-lg rounded-2xl border-3 border-black bg-white p-6 text-center shadow-[4px_4px_0px_0px_#000000] sm:p-12">
          <Loader2 className="w-16 h-16 text-pastel-lavender animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-black text-black mb-4">Menerbitkan Sertifikat Anda</h2>
          
          <div className="space-y-4 max-w-xs mx-auto text-left">
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${genStep >= 1 ? "bg-[#B4F0D2] border-black" : "bg-gray-100 border-gray-300"}`}>
                {genStep > 1 ? "✓" : "1"}
              </span>
              <span className={`text-sm font-bold ${genStep >= 1 ? "text-black" : "text-gray-400"}`}>
                Mengevaluasi kelulusan siber...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${genStep >= 2 ? "bg-[#B4F0D2] border-black" : "bg-gray-100 border-gray-300"}`}>
                {genStep > 2 ? "✓" : "2"}
              </span>
              <span className={`text-sm font-bold ${genStep >= 2 ? "text-black" : "text-gray-400"}`}>
                Menghasilkan kode hash verifikasi...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${genStep >= 3 ? "bg-[#B4F0D2] border-black" : "bg-gray-100 border-gray-300"}`}>
                {genStep > 3 ? "✓" : "3"}
              </span>
              <span className={`text-sm font-bold ${genStep >= 3 ? "text-black" : "text-gray-400"}`}>
                Memformat layout sertifikat PDF...
              </span>
            </div>
          </div>
        </div>
      ) : activeCert ? (
        /* High-fidelity Live Landscape Preview */
        <div className="space-y-8">
          <div className="bg-white border-3 border-black rounded-xl p-4 md:p-6 shadow-[6px_6px_0px_0px_#000000]">
            <div className="mb-4 flex min-w-0 flex-col items-start gap-3 border-b-2 border-black pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-pastel-mint" />
                <span className="font-black text-sm uppercase tracking-wide">Sertifikat Kelulusan Valid</span>
              </div>
              <div className="max-w-full break-all rounded border-2 border-black bg-[#FFE696] px-3 py-1 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000000]">
                {activeCert.certificateCode}
              </div>
            </div>

            {/* Interactive Certificate Paper Frame */}
            <div className="-mx-1 overflow-x-auto p-1 pb-3" aria-label="Preview sertifikat dapat digulir horizontal pada layar kecil">
            <div className="relative mx-auto flex aspect-[1.414/1] w-full min-w-[40rem] max-w-4xl flex-col justify-between overflow-hidden rounded-lg border-3 border-black bg-[#FFFDF8] p-6 shadow-inner md:min-w-0 md:p-10">
              {/* Outer decorative line */}
              <div className="absolute inset-2 border border-black/20 pointer-events-none rounded"></div>
              
              {/* Top Brand Block */}
              <div className="text-center relative z-10">
                <h3 className="font-extrabold text-lg md:text-2xl tracking-tighter text-black">
                  CYBER ACADEMY AI
                </h3>
                <span className="text-[9px] md:text-xs font-mono font-medium text-gray-500 uppercase tracking-widest mt-1 block">
                  Sertifikasi Akademik Siber Defensif Otomatis
                </span>
                <div className="w-1/3 h-0.5 bg-black/10 mx-auto mt-3"></div>
              </div>

              {/* Central text block */}
              <div className="text-center my-6 md:my-10 relative z-10">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest block mb-1">
                  Menyatakan Bahwa
                </span>
                <h4 className="font-extrabold text-2xl md:text-4xl text-black uppercase tracking-tight py-1 inline-block border-b-2 border-black/10">
                  {activeCert.recipientName}
                </h4>
                <p className="text-xs md:text-sm font-medium text-gray-600 mt-4 leading-relaxed max-w-xl mx-auto">
                  telah berhasil menyelesaikan seluruh materi kurikulum digital, evaluasi kuis kelulusan, dan latihan deteksi ancaman taktis pada jalur pembelajaran:
                </p>
                <h5 className="font-extrabold text-base md:text-xl text-black uppercase tracking-wide mt-2">
                  {activeCert.learningPathTitle}
                </h5>
              </div>

              {/* Footer row containing QR and Signatures */}
              <div className="flex justify-between items-end relative z-10 mt-auto border-t border-black/5 pt-4">
                {/* QR block */}
                <div className="flex items-center gap-3">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Verification QR" 
                      className="w-16 h-16 md:w-20 md:h-20 border-2 border-black rounded p-1 bg-white shadow-[2px_2px_0px_0px_#000000]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 border-2 border-black animate-pulse"></div>
                  )}
                  <div className="hidden sm:block text-left">
                    <span className="text-[10px] font-bold text-black uppercase tracking-tight block">Verifikasi Keaslian</span>
                    <span className="text-[8px] font-mono text-gray-500 block">Pindai kode QR atau salin link</span>
                  </div>
                </div>

                {/* Date & Info */}
                <div className="text-center hidden md:block">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Tanggal Terbit</span>
                  <span className="text-xs font-bold text-black">{formatDate(activeCert.issuedAt)}</span>
                  <span className="text-[9px] font-mono text-gray-500 block mt-1">ID: {activeCert.certificateId}</span>
                </div>

                {/* Signature block */}
                <div className="text-center">
                  <div className="font-mono text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Tim Penguji</div>
                  <span className="font-black text-xs md:text-sm text-black block italic font-serif">Cyber Academy AI</span>
                  <div className="w-24 h-0.5 bg-black mx-auto my-1"></div>
                  <span className="text-[9px] font-mono text-gray-500 block">Sertifikasi Sistem AI</span>
                </div>
              </div>

              {/* Pastel decorative blocks in corners (Friendly Pastel Neo-Brutalist design system) */}
              <div className="absolute top-4 left-4 w-4 h-4 bg-[#B4F0D2] border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]"></div>
              <div className="absolute top-4 right-4 w-4 h-4 bg-[#FFC8C8] border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]"></div>
            </div>
            </div>
          </div>

          {/* Download & Share Actions Card */}
          <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border-3 border-black bg-[#FFFDF8] p-4 shadow-[4px_4px_0px_0px_#000000] sm:p-6 md:flex-row md:items-center">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg mb-1">Unduh & Bagikan Sertifikat Anda</h3>
              <p className="text-gray-500 text-xs">Simpan salinan cetak landscape PDF atau kirim link verifikasi ke jejaring sosial Anda.</p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap md:w-auto">
              {/* Salin link */}
              <button
                onClick={handleCopyLink}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded border-2 border-black bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer sm:w-auto"
              >
                {copiedLink ? <Check className="w-4 h-4 text-pastel-mint" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Link Disalin!" : "Salin Link Verifikasi"}
              </button>

              {/* Verifikasi route */}
              <button
                onClick={() => onNavigate(`/verify/certificate/${activeCert.certificateCode}`)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded border-2 border-black bg-white px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer sm:w-auto"
              >
                <ExternalLink className="w-4 h-4" />
                Uji Halaman Verifikasi
              </button>

              {/* Direct Server Download PDF! */}
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded border-2 border-black bg-[#D6C8FF] px-4 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-[#c3b4fa] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <FileDown className="w-4 h-4" />
                {isDownloading ? "Mengunduh PDF..." : "Unduh PDF Sertifikat"}
              </button>
            </div>
          </div>
        </div>
      ) : eligibility?.isEligible ? (
        /* Unclaimed eligible state */
        <div className="mx-auto my-8 max-w-xl rounded-2xl border-3 border-black bg-white p-5 text-left shadow-[4px_4px_0px_0px_#000000] sm:p-8 md:p-12">
          <div className="text-center mb-6">
            <Award className="w-20 h-20 text-[#FFE696] animate-bounce mx-auto mb-4" />
            <h2 className="mb-2 text-2xl font-black text-black sm:text-3xl">Selamat, Anda Lulus!</h2>
            <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed">
              Anda telah berhasil menyelesaikan seluruh materi dan lulus evaluasi kelulusan pada <b>{eligibility.learningPathTitle}</b>.
            </p>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 pt-5 mb-6">
            <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">
              Nama Lengkap Penerima Sertifikat:
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ketik nama lengkap Anda..."
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-3 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.08)] mb-2"
            />
            <p className="text-[11px] text-brand-muted font-medium">
              *Harap masukkan nama lengkap Anda dengan benar. Nama ini akan dicetak secara permanen pada sertifikat fisik kelulusan Anda.
            </p>
          </div>

          <button
            onClick={() => handleGenerate(recipientName)}
            disabled={!recipientName.trim()}
            className="w-full bg-[#B4F0D2] hover:bg-[#9fe4c0] text-black font-black border-3 border-black py-3 rounded-xl shadow-[4px_4px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            Menerbitkan Sertifikat Resmi <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Ineligible state: show elegant checklist */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_#000000]">
              <h2 className="text-xl font-bold mb-4">Lacak Syarat Kelayakan Sertifikasi</h2>
              
              <div className="space-y-4">
                {/* 1. Lessons progress */}
                <div className="flex items-start gap-4">
                  <div className="p-1 rounded-full mt-0.5 shrink-0">
                    {eligibility && eligibility.lessonsCompleted >= eligibility.totalLessons ? (
                      <CheckCircle2 className="w-6 h-6 text-pastel-mint" />
                    ) : (
                      <XCircle className="w-6 h-6 text-pastel-peach" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-black">Materi Belajar Diselesaikan</h4>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {eligibility?.lessonsCompleted} / {eligibility?.totalLessons}
                      </span>
                    </div>
                    <div className="w-full h-3 border-2 border-black bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pastel-blue" 
                        style={{ width: `${eligibility?.totalLessons ? Math.min((eligibility.lessonsCompleted / eligibility.totalLessons) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 2. Quizzes progress */}
                <div className="flex items-start gap-4">
                  <div className="p-1 rounded-full mt-0.5 shrink-0">
                    {eligibility && eligibility.quizzesPassed >= eligibility.totalQuizzes ? (
                      <CheckCircle2 className="w-6 h-6 text-pastel-mint" />
                    ) : (
                      <XCircle className="w-6 h-6 text-pastel-peach" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-black">Evaluasi Ujian Kuis Lulus</h4>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {eligibility?.quizzesPassed} / {eligibility?.totalQuizzes} (Skor &gt;= {requiredPassingScore})
                      </span>
                    </div>
                    <div className="w-full h-3 border-2 border-black bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pastel-yellow" 
                        style={{ width: `${eligibility?.totalQuizzes ? Math.min((eligibility.quizzesPassed / eligibility.totalQuizzes) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 3. Courses progress */}
                <div className="flex items-start gap-4">
                  <div className="p-1 rounded-full mt-0.5 shrink-0">
                    {eligibility && eligibility.coursesCompleted >= eligibility.totalCourses ? (
                      <CheckCircle2 className="w-6 h-6 text-pastel-mint" />
                    ) : (
                      <XCircle className="w-6 h-6 text-pastel-peach" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-black">Status Selesai Seluruh Kelas</h4>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {eligibility?.coursesCompleted} / {eligibility?.totalCourses} Kelas
                      </span>
                    </div>
                    <div className="w-full h-3 border-2 border-black bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#D6C8FF]" 
                        style={{ width: `${eligibility?.totalCourses ? Math.min((eligibility.coursesCompleted / eligibility.totalCourses) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-[#FFE696] border-3 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_#000000] text-sm flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-black" />
              <div className="font-medium text-black">
                <b>Info:</b> Selesaikan {eligibility?.totalLessons ?? 0} materi, lulus {eligibility?.totalQuizzes ?? 0} evaluasi kelas, dan tuntaskan seluruh kelas pada {eligibility?.learningPathTitle ?? selectedPath?.title ?? "jalur ini"}. Simulasi tidak menjadi syarat sertifikat jalur.
              </div>
            </div>
          </div>

          {/* Guide Card to resume study */}
          <div className="bg-[#B4F0D2] border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between text-left">
            <div>
              <Award className="w-12 h-12 text-black mb-4" />
              <h3 className="font-bold text-lg mb-2">Yuk Selesaikan Jalur Belajar!</h3>
              <p className="text-gray-700 text-xs leading-relaxed mb-4">
                Ada sedikit langkah lagi sebelum Anda meraih sertifikasi resmi. Ayo beralih ke menu Kurikulum untuk melanjutkan pelajaran atau mengulangi kuis kualifikasi.
              </p>
            </div>
            
            <button
              onClick={() => onNavigate("/learn/paths")}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold border-2 border-black py-2.5 px-4 rounded shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
            >
              Kembali Belajar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
