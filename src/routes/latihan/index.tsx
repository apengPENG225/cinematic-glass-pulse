import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { permainan } from "@/lib/latihan-data";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/latihan/")({
  head: () => ({
    meta: [
      { title: "Latihan Kendiri — Mini Game Bahasa | e-MuNsi" },
      {
        name: "description",
        content:
          "Latihan Kendiri e-MuNsi: koleksi mini game interaktif untuk menguji kefahaman kesalahan bahasa Melayu.",
      },
      { property: "og:title", content: "Latihan Kendiri — Mini Game Bahasa | e-MuNsi" },
      {
        property: "og:description",
        content: "Main mini game interaktif dan uji kemahiran bahasa Melayu anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LatihanIndex,
});

function LatihanIndex() {
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
          Latihan Kendiri
        </h1>
        <p className="text-white/70 text-sm mb-8 max-w-xl">
          Pilih mini game di bawah untuk berlatih. Setiap permainan dibuka terus di dalam laman
          e-MuNsi.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {permainan.map((p) => (
            <Link
              key={p.slug}
              to="/latihan/$slug"
              params={{ slug: p.slug }}
              onClick={klik}
              className="liquid-glass rounded-3xl p-6 hover:bg-white/5 transition-colors block"
            >
              <span className="text-2xl">{p.emoji}</span>
              <h2 className="text-white text-xl font-semibold mt-3">{p.nama}</h2>
              <p className="text-white/70 text-sm mt-2 leading-relaxed">{p.ringkas}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-white text-sm font-medium">
                Main <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
