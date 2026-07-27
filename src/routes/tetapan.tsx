import { createFileRoute } from "@tanstack/react-router";
import { Check, Palette } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import VideoBackground from "@/components/VideoBackground";
import { useAudioApp } from "@/lib/audio";
import { TEMA_SENARAI, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/tetapan")({
  head: () => ({
    meta: [
      { title: "Tetapan — e-MuNsi" },
      {
        name: "description",
        content: "Tukar tema visual e-MuNsi mengikut citarasa anda.",
      },
      { property: "og:title", content: "Tetapan — e-MuNsi" },
      {
        property: "og:description",
        content: "Pilih tema visual untuk aplikasi e-MuNsi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tetapan,
});

function Tetapan() {
  const { tema, tetapTema } = useTheme();
  const { klik } = useAudioApp();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      <VideoBackground />
      <SiteNav />

      <main className="relative z-10 flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <header className="mb-8">
          <p className="mb-3 inline-flex items-center gap-2 liquid-glass rounded-full px-4 py-2 text-white/80 text-xs font-medium">
            <Palette size={14} /> Tetapan Tema
          </p>
          <h1
            className="text-4xl md:text-5xl text-white tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Pilih tema anda
          </h1>
          <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-xl">
            Tukar penampilan e-MuNsi tanpa mengubah kandungan atau ciri aplikasi. Pilihan anda akan
            disimpan pada peranti ini.
          </p>
        </header>

        <div className="grid gap-4">
          {TEMA_SENARAI.map((t) => {
            const aktif = tema === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  klik();
                  tetapTema(t.id);
                }}
                className={`liquid-glass rounded-3xl p-6 text-left transition-transform hover:scale-[1.01] ${
                  aktif ? "ring-2 ring-white/50" : ""
                }`}
                aria-pressed={aktif}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-white text-lg font-semibold">{t.nama}</h2>
                    <p className="mt-1 text-white/70 text-sm leading-relaxed">{t.keterangan}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full p-2 ${
                      aktif ? "bg-white text-black" : "bg-white/10 text-white/60"
                    }`}
                    aria-hidden="true"
                  >
                    <Check size={16} />
                  </span>
                </div>
                <p className="mt-4 text-xs uppercase tracking-widest text-white/50">
                  {aktif ? "Sedang digunakan" : "Ketuk untuk guna"}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-white/50 text-xs">
          Tema tambahan akan datang tidak lama lagi.
        </p>
      </main>
    </div>
  );
}
