import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowRight, Camera, ImagePlus, Loader2, X } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { scanKesalahanBahasa, type AnalisisBahasa } from "@/lib/kamera.functions";
import AnalisisKad from "@/components/AnalisisKad";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/kamera")({
  head: () => ({
    meta: [
      { title: "Kamera Peka — Imbas Kesalahan Bahasa | e-MuNsi" },
      {
        name: "description",
        content:
          "Muat naik gambar dan biarkan AI Kamera Peka e-MuNsi mengesan kesalahan fonologi, morfologi dan sintaksis.",
      },
      { property: "og:title", content: "Kamera Peka — Imbas Kesalahan Bahasa | e-MuNsi" },
      {
        property: "og:description",
        content: "Chatbot AI yang mengimbas gambar anda untuk kesalahan bahasa Melayu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kamera,
});

type Mesej =
  | { peranan: "pengguna"; teks: string; imej?: string }
  | { peranan: "ai"; analisis: AnalisisBahasa };

function Kamera() {
  const scan = useServerFn(scanKesalahanBahasa);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { klik } = useAudioApp();
  const [imej, setImej] = useState<string | null>(null);
  const [soalan, setSoalan] = useState("");
  const [mesej, setMesej] = useState<Mesej[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const pilihFail = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImej(String(reader.result));
    reader.readAsDataURL(file);
  };

  const hantar = async () => {
    if (!imej || memuat) return;
    setRalat(null);
    setMemuat(true);
    const soalanIni = soalan;
    setMesej((m) => [
      ...m,
      { peranan: "pengguna", teks: soalanIni || "Imbas kesalahan bahasa dalam gambar ini.", imej },
    ]);
    setSoalan("");
    try {
      const res = await scan({ data: { image: imej, soalan: soalanIni } });
      setMesej((m) => [...m, { peranan: "ai", analisis: res }]);
      setImej(null);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    } catch (e) {
      setRalat(e instanceof Error ? e.message : "Ralat tidak dijangka.");
    } finally {
      setMemuat(false);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      <VideoBackground />
      <SiteNav />

      <main className="relative z-10 flex-1 px-6 pb-12 max-w-3xl mx-auto w-full">
        <h1
          className="text-4xl md:text-5xl text-white mb-2"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Kamera Peka
        </h1>
        <p className="text-white/70 text-sm mb-6">
          Muat naik gambar papan tanda, iklan atau petikan teks. AI akan mengimbas dan mengenal pasti
          kesalahan bahasa beserta pembetulan.
        </p>

        <div className="space-y-4 mb-6">
          {mesej.length === 0 && (
            <div className="liquid-glass rounded-3xl p-6 text-white/70 text-sm leading-relaxed">
              Belum ada perbualan. Muat naik gambar pertama anda di bawah untuk bermula.
            </div>
          )}
          {mesej.map((m, i) => (
            <div
              key={i}
              className={`liquid-glass rounded-3xl p-5 ${m.peranan === "pengguna" ? "ml-auto max-w-[85%]" : "mr-auto max-w-full"}`}
            >
              {m.peranan === "pengguna" ? (
                <>
                  {m.imej && (
                    <img
                      src={m.imej}
                      alt="Gambar dimuat naik untuk imbasan bahasa"
                      className="rounded-2xl mb-3 max-h-64 w-auto"
                    />
                  )}
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{m.teks}</p>
                </>
              ) : (
                <AnalisisKad data={m.analisis} />
              )}
            </div>
          ))}
          {memuat && (
            <div className="liquid-glass rounded-3xl p-5 flex items-center gap-2 text-white/80 text-sm">
              <Loader2 size={16} className="animate-spin" /> Sedang mengimbas gambar…
            </div>
          )}
          {ralat && (
            <div className="liquid-glass rounded-3xl p-5 text-white text-sm">⚠️ {ralat}</div>
          )}
        </div>

        {imej && (
          <div className="liquid-glass rounded-3xl p-3 mb-3 flex items-center gap-3">
            <img src={imej} alt="Pratonton gambar" className="h-16 w-16 rounded-xl object-cover" />
            <span className="text-white/70 text-sm flex-1">Gambar sedia untuk diimbas</span>
            <button
              aria-label="Buang gambar"
              onClick={() => {
                setImej(null);
                if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
              }}
              className="rounded-full p-2 text-white/70 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="liquid-glass rounded-full pl-2 pr-2 py-2 flex items-center gap-2">
          <button
            aria-label="Muat naik gambar dari galeri"
            title="Muat naik gambar dari galeri"
            onClick={() => {
              klik();
              fileRef.current?.click();
            }}
            className="rounded-full p-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ImagePlus size={20} />
          </button>
          <button
            aria-label="Ambil gambar dengan kamera"
            title="Ambil gambar dengan kamera"
            onClick={() => {
              klik();
              cameraRef.current?.click();
            }}
            className="rounded-full p-3 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Camera size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pilihFail(e.target.files?.[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pilihFail(e.target.files?.[0])}
          />

          <input
            value={soalan}
            onChange={(e) => setSoalan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hantar()}
            placeholder="Tanya sesuatu tentang gambar ini…"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-base"
          />
          <button
            aria-label="Hantar untuk imbasan"
            onClick={hantar}
            disabled={!imej || memuat}
            className="bg-white rounded-full p-3 text-black disabled:opacity-40"
          >
            {memuat ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
          </button>
        </div>
      </main>
    </div>
  );
}
