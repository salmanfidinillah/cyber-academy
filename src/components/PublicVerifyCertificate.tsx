import { useState, useEffect } from "react";
import { verifyCertificatePublicly } from "../lib/learningStore";
import { ShieldCheck, ArrowRight, CheckCircle2, XCircle, Search, Calendar, User, Award, RefreshCw } from "lucide-react";

interface PublicVerifyCertificateProps {
  initialCode?: string;
  onNavigate?: (route: string) => void;
}

export function PublicVerifyCertificate({ initialCode = "", onNavigate }: PublicVerifyCertificateProps) {
  const [certCode, setCertCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      setErrorMsg("Harap masukkan kode sertifikat terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setVerificationResult(null);

    try {
      const result = await verifyCertificatePublicly(codeToVerify.trim().toUpperCase());
      setVerificationResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Sertifikat tidak ditemukan atau kode tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div id="public-verification-container" className="max-w-xl mx-auto px-4 py-12 min-h-[500px] flex flex-col justify-center animate-fadeIn">
      {/* Brand logo to look extremely official as a public page */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black tracking-tight text-black flex items-center justify-center gap-2">
          <ShieldCheck className="w-8 h-8 text-pastel-mint" />
          <span>CYBER ACADEMY AI</span>
        </h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-wider mt-1">
          Sistem Verifikasi Sertifikat Kelulusan Resmi
        </p>
      </div>

      <div className="bg-[#FFFDF8] border-3 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_#000000]">
        {!verificationResult && !loading ? (
          /* Search / Verify Initial State */
          <div>
            <div className="text-center mb-6">
              <Award className="w-12 h-12 text-[#D6C8FF] mx-auto mb-3" />
              <h2 className="text-lg font-black text-black">Verifikasi Kode Sertifikat</h2>
              <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto">
                Masukkan kode verifikasi unik (contoh: <code>CYBER-2026-A7K9P2</code>) untuk memverifikasi keaslian pencapaian kelulusan peserta.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(certCode);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-gray-500 mb-1">
                  KODE VERIFIKASI SERTIFIKAT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={certCode}
                    onChange={(e) => setCertCode(e.target.value)}
                    placeholder="Contoh: CYBER-2026-A7K9P2"
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2.5 text-sm font-bold text-black uppercase placeholder:normal-case focus:outline-none shadow-[2px_2px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#000000] transition-all"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-100 border-2 border-red-500 p-3 rounded-lg font-bold text-red-700 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#B4F0D2] hover:bg-[#9fe4c0] text-black font-bold border-2 border-black py-2.5 rounded-lg shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 text-sm"
              >
                Verifikasi Sertifikat <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : loading ? (
          /* Loading verified details state */
          <div className="py-12 text-center">
            <RefreshCw className="w-10 h-10 text-pastel-lavender animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-sm text-black">Membaca Database Akademis...</h3>
            <p className="text-gray-400 text-xs mt-1">Harap tunggu sementara AI memproses kredensial.</p>
          </div>
        ) : (
          /* Verification Result Verified State */
          <div>
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <CheckCircle2 className="w-14 h-14 text-pastel-mint mx-auto mb-3 animate-bounce" />
              <div className="bg-[#B4F0D2] border-2 border-black px-3 py-1 rounded-full text-xs font-mono font-bold inline-block shadow-[2px_2px_0px_0px_#000000] text-black">
                {verificationResult.status.toUpperCase()}
              </div>
              <h2 className="text-xl font-black mt-3">Sertifikat Terverifikasi</h2>
              <p className="text-gray-500 text-xs font-mono mt-1">Kode: {verificationResult.certificateCode}</p>
            </div>

            {/* Minimum Authorized Public Info (Guarantees Data Privacy!) */}
            <div className="space-y-4 mb-6">
              <div className="bg-[#FFFDF8] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000000] flex items-center gap-3">
                <User className="w-5 h-5 text-pastel-blue" />
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase leading-none">Penerima Sertifikat</span>
                  <span className="font-bold text-black text-sm uppercase">{verificationResult.recipientName}</span>
                </div>
              </div>

              <div className="bg-[#FFFDF8] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000000] flex items-center gap-3">
                <Award className="w-5 h-5 text-[#FFE696]" />
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase leading-none">Jalur Pembelajaran</span>
                  <span className="font-bold text-black text-sm">{verificationResult.learningPathTitle}</span>
                </div>
              </div>

              <div className="bg-[#FFFDF8] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000000] flex items-center gap-3">
                <Calendar className="w-5 h-5 text-pastel-peach" />
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase leading-none">Tanggal Penerbitan</span>
                  <span className="font-bold text-black text-sm">{formatDate(verificationResult.issuedAt)}</span>
                </div>
              </div>

              <div className="bg-[#FFFDF8] border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000000] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-pastel-lavender" />
                <div className="text-left">
                  <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase leading-none">Otoritas Penerbit</span>
                  <span className="font-bold text-black text-sm">{verificationResult.issuer}</span>
                </div>
              </div>
            </div>

            {/* Back action */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setVerificationResult(null);
                  setCertCode("");
                }}
                className="flex-grow bg-white hover:bg-gray-100 text-black font-bold border-2 border-black py-2.5 rounded-lg shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-xs"
              >
                Cek Kode Lain
              </button>

              {onNavigate && (
                <button
                  onClick={() => onNavigate("/")}
                  className="bg-[#D6C8FF] hover:bg-[#c3b4fa] text-black font-bold border-2 border-black py-2.5 px-4 rounded-lg shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-xs flex items-center gap-1"
                >
                  Ke Landing Page
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Safety and Trust footer */}
      <div className="text-center mt-6 text-[10px] font-mono text-gray-400 max-w-xs mx-auto">
        Kredensial ini dilindungi secara kriptografis oleh server Cyber Academy AI. Data privasi pengguna aman dan tidak disebarluaskan.
      </div>
    </div>
  );
}
