import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Music, ScanLine, VolumeX, X } from "lucide-react";
import { useAudioApp } from "@/lib/audio";
import TemaPilih from "@/components/TemaPilih";

const pautan = [
  { to: "/kamera", label: "Kamera Peka" },
  { to: "/modul", label: "Modul" },
  { to: "/latihan", label: "Latihan Kendiri" },
] as const;

export default function SiteNav() {
  const { main, toggle, klik, senyapSementara, waktu } = useAudioApp();
  const [buka, setBuka] = useState(false);

  const tutup = () => setBuka(false);

  return (
    <nav className="relative z-30 px-4 sm:px-6 py-4 sm:py-6">
      <div className="rounded-3xl sm:rounded-full px-4 sm:px-6 py-3 max-w-5xl mx-auto liquid-glass">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:flex lg:justify-between">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              to="/"
              onClick={() => {
                klik();
                tutup();
              }}
              className="flex min-w-0 items-center gap-2 text-white font-semibold text-base sm:text-lg"
            >
              <ScanLine size={22} className="shrink-0" />
              <span className="truncate">e-MuNsi</span>
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              {pautan.map((p) => (
                <Link
                  key={p.to}
                  to={p.to}
                  onClick={klik}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {p.label}
                </Link>
              ))}
              <Link
                to="/"
                hash="tentang"
                onClick={klik}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Tentang
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <TemaPilih />
            <button
              type="button"
              onClick={() => {
                klik();
                toggle();
              }}
              aria-pressed={main}
              aria-label={main ? "Matikan muzik latar" : "Hidupkan muzik latar"}
              title={
                senyapSementara
                  ? "Muzik dijeda dalam kuiz"
                  : `Muzik ${waktu} — ${main ? "hidup" : "mati"}`
              }
              className={`rounded-full p-2 transition-colors ${
                main ? "bg-white text-black" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {main ? <Music size={18} /> : <VolumeX size={18} />}
            </button>
            <Link
              to="/kamera"
              onClick={() => {
                klik();
                tutup();
              }}
              className="liquid-glass rounded-full px-4 sm:px-6 py-2 text-white text-sm font-medium whitespace-nowrap"
            >
              Imbas
            </Link>
            <button
              type="button"
              onClick={() => {
                klik();
                setBuka((v) => !v);
              }}
              aria-expanded={buka}
              aria-label={buka ? "Tutup menu" : "Buka menu"}
              className="lg:hidden rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {buka ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {buka && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
            {pautan.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                onClick={() => {
                  klik();
                  tutup();
                }}
                className="rounded-2xl px-3 py-3 text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
              >
                {p.label}
              </Link>
            ))}
            <Link
              to="/"
              hash="tentang"
              onClick={() => {
                klik();
                tutup();
              }}
              className="rounded-2xl px-3 py-3 text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Tentang
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
