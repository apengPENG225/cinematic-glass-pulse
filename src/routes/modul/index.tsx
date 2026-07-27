import { createFileRoute, Link } from "@tanstack/react-router";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { moduls } from "@/lib/modul-data";
import { ArrowRight } from "lucide-react";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/modul/")({
  head: () => ({
    meta: [
      { title: "Modul Kesalahan Bahasa | e-MuNsi" },
      {
        name: "description",
        content:
          "Tiga modul e-MuNsi: Fonologi, Morfologi dan Sintaksis — contoh kesalahan bahasa daripada media cetak dan elektronik.",
      },
      { property: "og:title", content: "Modul Kesalahan Bahasa | e-MuNsi" },
      {
        property: "og:description",
        content: "Belajar Fonologi, Morfologi dan Sintaksis melalui contoh kesalahan bahasa sebenar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModulIndex,
});

function ModulIndex() {
  const { klik } = useAudioApp();
  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
        <h1
          className="text-4xl md:text-5xl text-white mb-3"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Tiga Modul e-MuNsi
        </h1>
        <p className="text-white/70 text-sm mb-8 max-w-xl">
          Setiap modul mengandungi contoh media cetak dan media elektronik, lengkap dengan pen
          penyerlah, pemadam serta butang seterusnya dan kembali.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {moduls.map((m) => (
            <Link
              key={m.slug}
              to="/modul/$slug"
              params={{ slug: m.slug }}
              onClick={klik}
              className="liquid-glass rounded-3xl p-6 hover:bg-white/5 transition-colors block"
            >
              <span className="text-2xl">{m.emoji}</span>
              <h2 className="text-white text-xl font-semibold mt-3">{m.nama}</h2>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">{m.ringkas}</p>
              <p className="text-white/50 text-xs mt-4">
                {m.cetak.length} cetak · {m.elektronik.length} elektronik
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-white text-sm font-medium">
                Mula <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
