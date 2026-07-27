import { Link } from "@tanstack/react-router";
import { Music, ScanLine, Settings, VolumeX } from "lucide-react";
import { useAudioApp } from "@/lib/audio";

export default function SiteNav() {
  const { main, toggle, klik, senyapSementara, waktu } = useAudioApp();

  return (
    <nav className="relative z-20 pl-6 pr-6 py-6">
      <div className="rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto liquid-glass">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={klik}
            className="flex items-center gap-2 text-white font-semibold text-lg"
          >
            <ScanLine size={24} />
            e-MuNsi
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/kamera"
              onClick={klik}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Kamera Peka
            </Link>
            <Link
              to="/modul"
              onClick={klik}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Modul
            </Link>
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
        <div className="flex items-center gap-3">
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
            to="/tetapan"
            onClick={klik}
            aria-label="Tetapan"
            title="Tetapan"
            className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings size={18} />
          </Link>
          <Link
            to="/kamera"
            onClick={klik}
            className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium"
          >
            Imbas
          </Link>
        </div>
      </div>
    </nav>
  );
}
