import React from "react";
import { Shield } from "lucide-react";

interface FooterProps {
  onNavigate: (route: string) => void;
}

const footerLinkClassName =
  "inline-flex min-h-11 items-center rounded-lg px-2 -mx-2 text-sm font-semibold text-brand-text transition-colors hover:bg-white hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2";

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const navigateToRoute = (
    event: React.MouseEvent<HTMLAnchorElement>,
    route: string,
  ) => {
    event.preventDefault();
    onNavigate(route);
  };

  const navigateToLandingSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    event.preventDefault();
    onNavigate("/");

    window.setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <footer className="mt-16 border-t-4 border-brand-border bg-brand-surface px-4 py-10 text-brand-text sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] lg:gap-10">
        <div className="min-w-0 space-y-4 sm:col-span-2 lg:col-span-1">
          <a
            href="/"
            onClick={(event) => {
              navigateToRoute(event, "/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex max-w-full items-center gap-2.5 rounded-xl border-2 border-brand-border bg-pastel-mint px-4 py-2.5 shadow-[4px_4px_0_#111111] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pastel-yellow focus-visible:ring-offset-2"
            aria-label="Cyber Academy — kembali ke beranda"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-brand-border bg-white">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 break-words font-heading text-base font-bold tracking-tight sm:text-lg">
              Cyber Academy
            </span>
          </a>

          <p className="max-w-md text-sm font-semibold leading-relaxed text-brand-muted">
            Platform pembelajaran keamanan siber interaktif untuk pelajar,
            mahasiswa, dan masyarakat Indonesia.
          </p>
        </div>

        <nav aria-label="Navigasi cepat footer" className="min-w-0">
          <h2 className="mb-3 font-heading text-base font-bold">
            Navigasi Cepat
          </h2>
          <ul className="space-y-0.5">
            <li>
              <a
                href="/#paths-sec"
                onClick={(event) =>
                  navigateToLandingSection(event, "paths-sec")
                }
                className={footerLinkClassName}
              >
                Jalur Belajar
              </a>
            </li>
            <li>
              <a
                href="/simulations"
                onClick={(event) =>
                  navigateToRoute(event, "/simulations")
                }
                className={footerLinkClassName}
              >
                Simulasi
              </a>
            </li>
            <li>
              <a
                href="/ai-tutor"
                onClick={(event) => navigateToRoute(event, "/ai-tutor")}
                className={footerLinkClassName}
              >
                AI Tutor
              </a>
            </li>
            <li>
              <a
                href="/#faq-sec"
                onClick={(event) =>
                  navigateToLandingSection(event, "faq-sec")
                }
                className={footerLinkClassName}
              >
                FAQ
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Informasi footer" className="min-w-0">
          <h2 className="mb-3 font-heading text-base font-bold">Informasi</h2>
          <ul className="space-y-0.5">
            <li>
              <a
                href="/privacy"
                onClick={(event) => navigateToRoute(event, "/privacy")}
                className={footerLinkClassName}
              >
                Kebijakan Privasi
              </a>
            </li>
            <li>
              <a
                href="/terms"
                onClick={(event) => navigateToRoute(event, "/terms")}
                className={footerLinkClassName}
              >
                Syarat &amp; Ketentuan
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-2 border-t-2 border-brand-border pt-5 text-xs font-semibold leading-relaxed text-brand-muted md:flex-row md:items-start md:justify-between md:gap-8">
        <p className="shrink-0">© 2026 Cyber Academy.</p>
        <p className="max-w-2xl break-words md:text-right">
          Dikembangkan oleh Salman Fidinillah untuk FTI Festival 2026 — Web
          Development.
        </p>
      </div>
    </footer>
  );
};
