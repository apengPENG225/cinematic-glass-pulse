import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eraser,
  ExternalLink,
  Highlighter,
  MousePointer2,
  Trash2,
} from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { drivePreview, getModul, slidesOf } from "@/lib/modul-data";

export const Route = createFileRoute("/modul/$slug")({
  loader: ({ params }) => {
    const modul = getModul(params.slug);
    if (!modul) throw notFound();
    return { nama: modul.nama, ringkas: modul.ringkas };
  },
  head: ({ loaderData }) => {
    const nama = loaderData?.nama ?? "Modul";
    const desc = loaderData?.ringkas ?? "Modul kesalahan bahasa e-MuNsi.";
    return {
      meta: [
        { title: `Modul ${nama} | e-MuNsi` },
        { name: "description", content: desc },
        { property: "og:title", content: `Modul ${nama} | e-MuNsi` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ModulViewer,
});

type Tool = "none" | "pen" | "eraser";

function ModulViewer() {
  const { slug } = Route.useParams();
  const modul = getModul(slug)!;
  const slides = slidesOf(modul);

  const [index, setIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("none");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Keep canvas pixel size in sync with its box, and reset strokes per slide.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [index]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "none") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
      ctx.lineWidth = 18;
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 28;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawingRef.current = false;
  };

  const slide = slides[index];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative flex flex-col">
      <VideoBackground />
      <SiteNav />

      <main className="relative z-10 flex-1 px-6 pb-12 max-w-5xl mx-auto w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <Link to="/modul" className="text-white/60 hover:text-white text-xs">
              ← Semua modul
            </Link>
            <h1
              className="text-3xl md:text-4xl text-white mt-1"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {modul.emoji} Modul {modul.nama}
            </h1>
          </div>
          <p className="text-white/70 text-sm">
            {slide.label} · {index + 1} / {slides.length}
          </p>
        </div>

        {/* Toolbar */}
        <div className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2 flex-wrap mb-4 w-fit">
          <ToolButton
            active={tool === "pen"}
            label="Pen penyerlah"
            onClick={() => setTool(tool === "pen" ? "none" : "pen")}
          >
            <Highlighter size={18} />
          </ToolButton>
          <ToolButton
            active={tool === "eraser"}
            label="Pemadam"
            onClick={() => setTool(tool === "eraser" ? "none" : "eraser")}
          >
            <Eraser size={18} />
          </ToolButton>
          <ToolButton active={tool === "none"} label="Mod baca" onClick={() => setTool("none")}>
            <MousePointer2 size={18} />
          </ToolButton>
          <ToolButton active={false} label="Padam semua" onClick={clearCanvas}>
            <Trash2 size={18} />
          </ToolButton>
        </div>

        {/* Slide */}
        <div className="liquid-glass rounded-3xl p-2">
          <div className="relative rounded-2xl overflow-hidden bg-black/40 aspect-[4/3] w-full">
            <iframe
              key={slide.id}
              src={drivePreview(slide.id)}
              title={`${modul.nama} — ${slide.label}`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay"
            />
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className={`absolute inset-0 h-full w-full touch-none ${
                tool === "none" ? "pointer-events-none" : "pointer-events-auto cursor-crosshair"
              }`}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="liquid-glass rounded-full px-6 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <a
            href={`https://drive.google.com/file/d/${slide.id}/view`}
            target="_blank"
            rel="noreferrer"
            className="text-white/60 hover:text-white text-xs inline-flex items-center gap-1"
          >
            Buka di Drive <ExternalLink size={12} />
          </a>
          <button
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={index === slides.length - 1}
            className="liquid-glass rounded-full px-6 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
          >
            Seterusnya <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

function ToolButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-full p-3 transition-colors ${
        active ? "bg-white text-black" : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
