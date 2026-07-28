import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Main application chunk remains ~580 kB raw / ~135 kB gzip; vendor-heavy
      // Firebase modules are already split below. Keep the release log actionable.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@firebase/auth") || id.includes("firebase/auth")) return "firebase-auth";
            if (id.includes("@firebase/firestore") || id.includes("firebase/firestore")) return "firebase-firestore";
            if (id.includes("@firebase/storage") || id.includes("firebase/storage")) return "firebase-storage";
            if (id.includes("@firebase/")) return "firebase-core";
            if (id.includes("@google/genai")) return "genai";
            if (id.includes("framer-motion") || id.includes("motion")) return "motion";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("jspdf") || id.includes("qrcode")) return "documents";
            if (id.includes("react") || id.includes("react-router")) return "react";
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching is disabled in the hosted editor to prevent flickering.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
