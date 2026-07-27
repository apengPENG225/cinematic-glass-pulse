import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Camera, Sparkles } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-MuNsi — Kamera Peka & Modul Kesalahan Bahasa" },
      {
        name: "description",
        content:
          "e-MuNsi: imbas gambar dengan Kamera Peka AI untuk kesan kesalahan bahasa, dan belajar melalui modul Fonologi, Morfologi dan Sintaksis.",
      },
      { property: "og:title", content: "e-MuNsi — Kamera Peka & Modul Kesalahan Bahasa" },
      {
        property: "og:description",
        content:
          "Imbas kesalahan bahasa daripada gambar dengan AI dan kuasai tiga modul bahasa Melayu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      <VideoBackground />
      <SiteNav />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="mb-5 inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 text-white/80 text-xs font-medium">
          <Sparkles size={14} /> Kamera Peka berkuasa AI
        </p>
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          e-MuNsi
        </h1>
        <p className="max-w-xl text-white text-sm leading-relaxed px-4 mb-8">
          Muat naik gambar papan tanda, iklan atau petikan akhbar — AI akan mengimbas dan mengenal
          pasti kesalahan bahasa. Lengkap dengan tiga modul pembelajaran: Fonologi, Morfologi dan
          Sintaksis.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/kamera"
            className="bg-white rounded-full pl-6 pr-2 py-2 flex items-center gap-3 text-black text-sm font-medium"
          >
            Buka Kamera Peka
            <span className="bg-black rounded-full p-3 text-white">
              <ArrowRight size={20} />
            </span>
          </Link>
          <Link
            to="/modul"
            className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Terokai Modul
          </Link>
        </div>

        <div
          id="tentang"
          className="mt-14 grid gap-4 sm:grid-cols-2 max-w-3xl w-full text-left scroll-mt-24"
        >
          <div className="liquid-glass rounded-3xl p-6">
            <Camera size={20} className="text-white mb-3" />
            <h2 className="text-white text-base font-semibold mb-1">Kamera Peka</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Chatbot yang membaca gambar anda, memetik teks, dan menerangkan setiap kesalahan
              bahasa beserta pembetulan.
            </p>
          </div>
          <div className="liquid-glass rounded-3xl p-6">
            <BookOpen size={20} className="text-white mb-3" />
            <h2 className="text-white text-base font-semibold mb-1">Tiga Modul</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Koleksi contoh kesalahan media cetak dan elektronik, dengan pen penyerlah, pemadam
              serta navigasi seterusnya dan kembali.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
