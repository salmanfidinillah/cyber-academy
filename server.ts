import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import rateLimit from "express-rate-limit";
import adminContentRoutes from "./server/routes/adminContentRoutes";
import catalogRoutes from "./server/routes/catalogRoutes";
import learningStateRoutes from "./server/routes/learningStateRoutes";
import quizRoutes from "./server/routes/quizRoutes";
import achievementRoutes from "./server/routes/achievementRoutes";
import simulationRoutes from "./server/routes/simulationRoutes";
import adminUserRoutes from "./server/routes/adminUserRoutes";
import aiHistoryRoutes from "./server/routes/aiHistoryRoutes";
import { createAiRouter } from "./server/routes/aiRoutes";
import { getAiHealthStatus, loadAiConfig } from "./server/config/aiConfig";
import { createAiProvider } from "./server/services/aiProvider";
import { findCertificateByCode } from "./server/services/achievementService";

dotenv.config();

const app = express();
export const aiConfigState = loadAiConfig();
const aiProvider = createAiProvider(aiConfigState);
app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "cyber-academy-ai",
    timestamp: new Date().toISOString(),
    ai: getAiHealthStatus(aiConfigState),
  });
});

// Mount modular API routes
app.use("/api/admin", adminContentRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/me", learningStateRoutes);
app.use("/api/me/ai", aiHistoryRoutes);
app.use("/api/ai", createAiRouter({ configState: aiConfigState, provider: aiProvider }));
app.use("/api", quizRoutes);
app.use("/api", achievementRoutes);
app.use("/api", simulationRoutes);

const rawPort = process.env.PORT;
let PORT = 3000;
if (rawPort) {
  const parsedPort = parseInt(rawPort, 10);
  if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
    PORT = parsedPort;
  } else {
    console.warn(`PORT '${rawPort}' tidak valid. Menggunakan port default 3000.`);
  }
}

// Rate limiters for public certificate endpoints
export const certVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan verifikasi. Silakan coba beberapa saat lagi." },
});

export const certDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 PDF downloads per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan unduhan sertifikat. Silakan coba beberapa saat lagi." },
});
const CERT_CODE_REGEX = /^CYBER-\d{4}-[A-Z0-9]{6}$/i;

// Endpoint to download certificate as high-quality PDF
app.get("/api/certificates/download/:certificateCode", certDownloadLimiter, async (req: Request, res: Response) => {
  const { certificateCode } = req.params;

  if (!certificateCode || !CERT_CODE_REGEX.test(certificateCode)) {
    res.status(400).send("Format kode sertifikat tidak valid.");
    return;
  }

  try {
    const cert = await findCertificateByCode(certificateCode);

    if (!cert) {
      res.status(404).send("Sertifikat tidak ditemukan.");
      return;
    }

    if (cert.status === "revoked") {
      res.status(400).send("Sertifikat telah dicabut dan tidak dapat diunduh.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [842, 595]
    });

    const width = 842;
    const height = 595;

    // Draw warm off-white background
    doc.setFillColor(255, 253, 248);
    doc.rect(0, 0, width, height, "F");

    // Draw thick black border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(5);
    doc.rect(20, 20, width - 40, height - 40, "S");

    // Draw double lines
    doc.setLineWidth(1.5);
    doc.rect(26, 26, width - 52, height - 52, "S");

    // Top Brand Logo
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CYBER ACADEMY AI", width / 2, 75, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("SERTIFIKASI AKADEMIK SIBER DEFENSIF OTOMATIS", width / 2, 92, { align: "center" });

    // Dividers
    doc.setLineWidth(1);
    doc.line(180, 105, width - 180, 105);

    // Certificate Heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("SERTIFIKAT KELULUSAN", width / 2, 155, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("MENYATAKAN BAHWA", width / 2, 195, { align: "center" });

    // Recipient
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text(cert.recipientName.toUpperCase(), width / 2, 240, { align: "center" });

    // Recipient underline
    doc.setLineWidth(2.5);
    const nWidth = doc.getTextWidth(cert.recipientName.toUpperCase());
    doc.line(width / 2 - nWidth / 2 - 15, 250, width / 2 + nWidth / 2 + 15, 250);

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(
      "telah berhasil menyelesaikan seluruh materi kurikulum digital, evaluasi kuis kelulusan,",
      width / 2,
      285,
      { align: "center" }
    );
    doc.text("dan latihan deteksi ancaman taktis pada jalur pembelajaran:", width / 2, 300, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(cert.learningPathTitle.toUpperCase(), width / 2, 330, { align: "center" });

    // Date & Code
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const fDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    doc.text(`Diterbitkan pada: ${fDate}`, width / 2, 365, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.text(`KODE VERIFIKASI: ${cert.certificateCode}`, width / 2, 385, { align: "center" });

    // QR Code
    const protocol = req.secure ? "https" : "http";
    const host = req.get("host");
    const verificationUrl = `${protocol}://${host}/verify/certificate/${cert.certificateCode}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });
    doc.addImage(qrDataUrl, "PNG", 55, height - 165, 95, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Pindai QR Code untuk", 102, height - 58, { align: "center" });
    doc.text("Verifikasi Keaslian", 102, height - 48, { align: "center" });

    // Signature
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Tim Penguji", width - 170, height - 120, { align: "center" });

    doc.setLineWidth(1.5);
    doc.line(width - 240, height - 70, width - 100, height - 70);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Cyber Academy AI", width - 170, height - 55, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Sertifikasi Sistem AI", width - 170, height - 44, { align: "center" });

    // Neo-brutalist Pastel Ornaments
    doc.setFillColor(180, 240, 210); // pastel mint
    doc.rect(40, 40, 15, 15, "FD");
    doc.rect(40, 40, 15, 15, "S");

    doc.setFillColor(255, 200, 200); // pastel peach
    doc.rect(width - 55, 40, 15, 15, "FD");
    doc.rect(width - 55, 40, 15, 15, "S");

    const pdfBinary = doc.output();
    const pdfBuffer = Buffer.from(pdfBinary, "binary");
    res.setHeader("Content-Disposition", `attachment; filename="Sertifikat_CyberAcademy_${certificateCode}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Gagal membuat PDF:", error);
    res.status(500).send("Terjadi kesalahan teknis saat menerbitkan sertifikat PDF.");
  }
});

// API requests must never fall through to the SPA index. Returning JSON here
// prevents clients from interpreting a successful HTML response as API data.
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint API tidak ditemukan." });
});

// Configure Vite and Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
