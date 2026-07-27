import { BookOpen, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import type { AnalisisBahasa, JenisKesalahan } from "@/lib/kamera.functions";

const warnaJenis: Record<JenisKesalahan, string> = {
  Fonologi: "bg-sky-400/15 text-sky-200 border-sky-300/30",
  Morfologi: "bg-amber-400/15 text-amber-200 border-amber-300/30",
  Sintaksis: "bg-violet-400/15 text-violet-200 border-violet-300/30",
  "Lain-lain": "bg-white/10 text-white/70 border-white/20",
};

const pautanPrpm = (kata: string) =>
  `https://prpm.dbp.gov.my/Cari1?keyword=${encodeURIComponent(kata.trim())}`;

export default function AnalisisKad({ data }: { data: AnalisisBahasa }) {
  if (data.mentah) {
    return (
      <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{data.mentah}</p>
    );
  }

  return (
    <div className="space-y-5">
      {data.teksDikesan && (
        <section>
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-1.5">
            Teks dikesan
          </h3>
          <p className="text-white/85 text-sm italic leading-relaxed">“{data.teksDikesan}”</p>
        </section>
      )}

      <section>
        <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-2">
          Kesalahan &amp; pembetulan
        </h3>

        {data.kesalahan.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3">
            <CheckCircle2 size={16} className="text-emerald-300" />
            <span className="text-emerald-100 text-sm font-semibold">
              Tiada kesalahan bahasa dikesan.
            </span>
          </div>
        ) : (
          <ol className="space-y-3">
            {data.kesalahan.map((k, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/40 text-xs font-medium">#{i + 1}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${warnaJenis[k.jenis]}`}
                  >
                    {k.jenis}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <XCircle size={15} className="text-rose-300 shrink-0" />
                  <span className="font-bold text-rose-300 line-through decoration-rose-400/60">
                    {k.salah}
                  </span>
                  <span className="text-white/30">→</span>
                  <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                  <span className="font-bold text-emerald-300">{k.betul}</span>
                </div>

                {k.sebab && (
                  <p className="text-white/70 text-sm leading-relaxed">{k.sebab}</p>
                )}

                {(k.kataKunci || k.betul) && (
                  <a
                    href={pautanPrpm(k.kataKunci || k.betul)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                  >
                    <BookOpen size={13} />
                    Rujukan PRPM: {k.kataKunci || k.betul}
                    <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.rumusan && (
        <section>
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-1.5">Rumusan</h3>
          <p className="text-white/85 text-sm leading-relaxed">{data.rumusan}</p>
        </section>
      )}

      <p className="text-white/40 text-[11px] leading-relaxed">
        Sumber sahih:{" "}
        <a
          href="https://prpm.dbp.gov.my/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
        >
          Pusat Rujukan Persuratan Melayu (PRPM), DBP
        </a>
        .
      </p>
    </div>
  );
}
