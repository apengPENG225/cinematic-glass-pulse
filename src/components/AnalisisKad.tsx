import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  XCircle,
  Sparkles,
  Info,
} from "lucide-react";
import type { AnalisisBahasa, JenisKesalahan } from "@/lib/kamera.functions";

const warnaJenis: Record<JenisKesalahan, string> = {
  Fonologi: "bg-sky-400/20 text-sky-200 border-sky-300/40 shadow-sky-500/10",
  Morfologi: "bg-amber-400/20 text-amber-200 border-amber-300/40 shadow-amber-500/10",
  Sintaksis: "bg-violet-400/20 text-violet-200 border-violet-300/40 shadow-violet-500/10",
  "Lain-lain": "bg-white/15 text-white/80 border-white/25",
};

const pautanPrpm = (kata: string) =>
  `https://prpm.dbp.gov.my/Cari1?keyword=${encodeURIComponent(kata.trim())}`;

export default function AnalisisKad({ data }: { data: AnalisisBahasa }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    const formattedText = `[Analisis Bahasa e-MuNsi]\nTeks Dikesan: "${data.teksDikesan || ''}"\n\nKesalahan & Pembetulan:\n${data.kesalahan
      ?.map(
        (k, i) =>
          `${i + 1}. [${k.jenis}] ${k.salah} → ${k.betul}\n   Sebab: ${k.sebab || '-'}`
      )
      .join('\n')}\n\nRumusan: ${data.rumusan || '-'}\nSumber: PRPM DBP`;

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data.mentah) {
    return (
      <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
        {data.mentah}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-medium">
          <Sparkles size={14} className="animate-pulse" />
          <span>Analisis Tatabahasa AI e-MuNsi</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 transition-all hover:bg-white/20 hover:border-white/30 active:scale-95"
          title="Salin hasil analisis"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-300">Disalin!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Salin Teks</span>
            </>
          )}
        </button>
      </div>

      {data.teksDikesan ? (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-1.5 font-semibold flex items-center gap-1.5">
            <Info size={13} className="text-cyan-300" />
            Teks dikesan
          </h3>
          <p className="text-white/90 text-sm italic leading-relaxed font-serif">
            “{data.teksDikesan}”
          </p>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Kesalahan &amp; pembetulan
          </h3>
          {data.kesalahan && data.kesalahan.length > 0 ? (
            <span className="text-[11px] text-cyan-300/80 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full font-mono">
              {data.kesalahan.length} Ditemui
            </span>
          ) : null}
        </div>

        {!data.kesalahan || data.kesalahan.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3.5 shadow-lg shadow-emerald-950/30">
            <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
            <span className="text-emerald-100 text-sm font-semibold">
              Tahniah! Tiada kesalahan bahasa dikesan pada teks ini.
            </span>
          </div>
        ) : (
          <ol className="space-y-3.5">
            {data.kesalahan.map((k, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 space-y-3 backdrop-blur-md shadow-md transition-all hover:bg-white/[0.09] hover:border-white/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/40 text-xs font-mono font-medium">
                    #{i + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-sm ${
                      warnaJenis[k.jenis] || warnaJenis["Lain-lain"]
                    }`}
                  >
                    {k.jenis}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm bg-black/25 p-2.5 rounded-xl border border-white/5">
                  <XCircle size={16} className="text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-300 line-through decoration-rose-400/80">
                    {k.salah}
                  </span>
                  <span className="text-white/40 font-bold px-1">→</span>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {k.betul}
                  </span>
                </div>

                {k.sebab ? (
                  <p className="text-white/80 text-sm leading-relaxed pl-1 border-l-2 border-cyan-400/40">
                    {k.sebab}
                  </p>
                ) : null}

                {k.kataKunci || k.betul ? (
                  <div className="pt-1">
                    <a
                      href={pautanPrpm(k.kataKunci || k.betul)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-400/30 hover:border-cyan-300 hover:shadow-cyan-500/20 hover:shadow-sm"
                    >
                      <BookOpen size={13} />
                      Rujukan PRPM DBP: {k.kataKunci || k.betul}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.rumusan ? (
        <section className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4 space-y-1.5">
          <h3 className="text-cyan-300/70 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Rumusan Keseluruhan
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">{data.rumusan}</p>
        </section>
      ) : null}

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <span>
          Sumber sahih:{" "}
          <a
            href="https://prpm.dbp.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
          >
            PRPM, Dewan Bahasa dan Pustaka (DBP)
          </a>
        </span>
      </div>
    </div>
  );
}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data.mentah) {
    return (
      <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
        {data.mentah}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Tindakan Cepat */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-medium">
          <Sparkles size={14} className="animate-pulse" />
          <span>Analisis Tatabahasa AI e-MuNsi</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 transition-all hover:bg-white/20 hover:border-white/30 active:scale-95"
          title="Salin hasil analisis"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-300">Disalin!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Salin Teks</span>
            </>
          )}
        </button>
      </div>

      {data.teksDikesan ? (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-1.5 font-semibold flex items-center gap-1.5">
            <Info size={13} className="text-cyan-300" />
            Teks dikesan
          </h3>
          <p className="text-white/90 text-sm italic leading-relaxed font-serif">
            “{data.teksDikesan}”
          </p>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Kesalahan &amp; pembetulan
          </h3>
          {data.kesalahan && data.kesalahan.length > 0 ? (
            <span className="text-[11px] text-cyan-300/80 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full font-mono">
              {data.kesalahan.length} Ditemui
            </span>
          ) : null}
        </div>

        {!data.kesalahan || data.kesalahan.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3.5 shadow-lg shadow-emerald-950/30">
            <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
            <span className="text-emerald-100 text-sm font-semibold">
              Tahniah! Tiada kesalahan bahasa dikesan pada teks ini.
            </span>
          </div>
        ) : (
          <ol className="space-y-3.5">
            {data.kesalahan.map((k, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 space-y-3 backdrop-blur-md shadow-md transition-all hover:bg-white/[0.09] hover:border-white/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/40 text-xs font-mono font-medium">
                    #{i + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-sm ${
                      warnaJenis[k.jenis] || warnaJenis["Lain-lain"]
                    }`}
                  >
                    {k.jenis}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm bg-black/25 p-2.5 rounded-xl border border-white/5">
                  <XCircle size={16} className="text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-300 line-through decoration-rose-400/80">
                    {k.salah}
                  </span>
                  <span className="text-white/40 font-bold px-1">→</span>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {k.betul}
                  </span>
                </div>

                {k.sebab ? (
                  <p className="text-white/80 text-sm leading-relaxed pl-1 border-l-2 border-cyan-400/40">
                    {k.sebab}
                  </p>
                ) : null}

                {k.kataKunci || k.betul ? (
                  <div className="pt-1">
                    <a
                      href={pautanPrpm(k.kataKunci || k.betul)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-400/30 hover:border-cyan-300 hover:shadow-cyan-500/20 hover:shadow-sm"
                    >
                      <BookOpen size={13} />
                      Rujukan PRPM DBP: {k.kataKunci || k.betul}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.rumusan ? (
        <section className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4 space-y-1.5">
          <h3 className="text-cyan-300/70 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Rumusan Keseluruhan
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">{data.rumusan}</p>
        </section>
      ) : null}

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <span>
          Sumber sahih:{" "}
          <a
            href="https://prpm.dbp.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
          >
            PRPM, Dewan Bahasa dan Pustaka (DBP)
          </a>
        </span>
      </div>
    </div>
  );
}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data.mentah) {
    return (
      <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{data.mentah}</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Tindakan Cepat */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-medium">
          <Sparkles size={14} className="animate-pulse" />
          <span>Analisis Tatabahasa AI e-MuNsi</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 transition-all hover:bg-white/20 hover:border-white/30 active:scale-95"
          title="Salin hasil analisis"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-300">Disalin!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Salin Teks</span>
            </>
          )}
        </button>
      </div>

      {data.teksDikesan && (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] mb-1.5 font-semibold flex items-center gap-1.5">
            <Info size={13} className="text-cyan-300" />
            Teks dikesan
          </h3>
          <p className="text-white/90 text-sm italic leading-relaxed font-serif">
            “{data.teksDikesan}”
          </p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-white/50 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Kesalahan &amp; pembetulan
          </h3>
          {data.kesalahan.length > 0 && (
            <span className="text-[11px] text-cyan-300/80 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full font-mono">
              {data.kesalahan.length} Ditemui
            </span>
          )}
        </div>

        {data.kesalahan.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3.5 shadow-lg shadow-emerald-950/30">
            <CheckCircle2 size={18} className="text-emerald-300 shrink-0" />
            <span className="text-emerald-100 text-sm font-semibold">
              Tahniah! Tiada kesalahan bahasa dikesan pada teks ini.
            </span>
          </div>
        ) : (
          <ol className="space-y-3.5">
            {data.kesalahan.map((k, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 space-y-3 backdrop-blur-md shadow-md transition-all hover:bg-white/[0.09] hover:border-white/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/40 text-xs font-mono font-medium">
                    #{i + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-sm ${
                      warnaJenis[k.jenis] || warnaJenis["Lain-lain"]
                    }`}
                  >
                    {k.jenis}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm bg-black/25 p-2.5 rounded-xl border border-white/5">
                  <XCircle size={16} className="text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-300 line-through decoration-rose-400/80">
                    {k.salah}
                  </span>
                  <span className="text-white/40 font-bold px-1">→</span>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {k.betul}
                  </span>
                </div>

                {k.sebab && (
                  <p className="text-white/80 text-sm leading-relaxed pl-1 border-l-2 border-cyan-400/40">
                    {k.sebab}
                  </p>
                )}

                {(k.kataKunci || k.betul) && (
                  <div className="pt-1">
                    <a
                      href={pautanPrpm(k.kataKunci || k.betul)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:bg-cyan-400/30 hover:border-cyan-300 hover:shadow-cyan-500/20 hover:shadow-sm"
                    >
                      <BookOpen size={13} />
                      Rujukan PRPM DBP: {k.kataKunci || k.betul}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.rumusan && (
        <section className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4 space-y-1.5">
          <h3 className="text-cyan-300/70 text-[11px] uppercase tracking-[0.18em] font-semibold">
            Rumusan Keseluruhan
          </h3>
          <p className="text-white/90 text-sm leading-relaxed">{data.rumusan}</p>
        </section>
      )}

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
        <span>
          Sumber sahih:{" "}
          <a
            href="https://prpm.dbp.gov.my/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
          >
            PRPM, Dewan Bahasa dan Pustaka (DBP)
          </a>
        </span>
      </div>
    </div>
  );
}
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
