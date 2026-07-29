import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { cariPermainan, permainan } from "@/lib/latihan-data";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/latihan/$slug")({
  loader: ({ params }) => {
    const p = cariPermainan(params.slug);
    if (!p) throw notFound();
    return { p };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Permainan tidak dijumpai | e-MuNsi" }, { name: "robots", content: "noindex" }],
      };
    }
    const { p } = loaderData;
    return {
      meta: [
        { title: `${p.nama} — Latihan Kendiri | e-MuNsi` },
        { name: "description", content: p.ringkas },
        { property: "og:title", content: `${p.nama} — Latihan Kendiri | e-MuNsi` },
        { property: "og:description", content: p.ringkas },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LatihanMain,
});

function LatihanMain() {
  const { p } = Route.useLoaderData();
  const { klik } = useAudioApp();

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1
              className="text-3xl md:text-4xl text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {p.emoji} {p.nama}
            </h1>
            <p className="text-white/60 text-sm mt-1">{p.ringkas}</p>
          </div>
          <Link
            to="/latihan"
            onClick={klik}
            className="liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Semua permainan
          </Link>
        </div>

        <div className="liquid-glass rounded-3xl p-2 overflow-hidden">
          <iframe
            src={p.url}
            title={p.nama}
            allow="fullscreen; autoplay"
            allowFullScreen
            className="w-full rounded-2xl border-0 bg-black"
            style={{ aspectRatio: "16 / 9", minHeight: "60vh" }}
          />
        </div>

        {permainan.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {permainan.map((g) => (
              <Link
                key={g.slug}
                to="/latihan/$slug"
                params={{ slug: g.slug }}
                onClick={klik}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  g.slug === p.slug
                    ? "bg-white text-black font-medium"
                    : "liquid-glass text-white/80 hover:text-white"
                }`}
              >
                {g.emoji} {g.nama}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
