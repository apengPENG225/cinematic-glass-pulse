import { Link } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";

export default function SiteNav() {
  return (
    <nav className="relative z-20 pl-6 pr-6 py-6">
      <div className="rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto liquid-glass">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
            <ScanLine size={24} />
            e-MuNsi
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/kamera"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Kamera Peka
            </Link>
            <Link
              to="/modul"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Modul
            </Link>
            <Link
              to="/"
              hash="tentang"
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Tentang
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/modul" className="text-white text-sm font-medium">
            Mula Belajar
          </Link>
          <Link
            to="/kamera"
            className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium"
          >
            Imbas
          </Link>
        </div>
      </div>
    </nav>
  );
}
