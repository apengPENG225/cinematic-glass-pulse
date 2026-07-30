import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTema } from "@/lib/tema";
import { useAudioApp } from "@/lib/audio";

export default function TemaPilih() {
  const { tema, setTema, senarai } = useTema();
  const { klik } = useAudioApp();
  const [buka, setBuka] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setBuka(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [buka]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          klik();
          setBuka((v) => !v);
        }}
        aria-expanded={buka}
        aria-label="Pilih tema latar"
        title="Tema latar"
        className={`rounded-full p-2 transition-colors ${
          buka ? "bg-white text-black" : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        <Palette size={18} />
      </button>

      {buka && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[17rem] max-h-[70vh] overflow-y-auto rounded-3xl p-2 liquid-glass bg-black/70">
          <p className="px-3 py-2 text-[11px] uppercase tracking-widest text-white/50">Tema Latar</p>
          {senarai.map((t) => {
            const aktif = t.id === tema;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  klik();
                  setTema(t.id);
                  setBuka(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                  aktif ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]} 55%, ${t.swatch[2]})`,
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{t.nama}</span>
                  <span className="block truncate text-[11px] text-white/60">{t.huraian}</span>
                </span>
                {aktif && <Check size={16} className="shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
