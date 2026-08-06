import { Loader2, Mic, MicOff, PhoneOff, Radio, Volume2 } from "lucide-react";
import { useSuara } from "@/lib/suara";
import { useAudioApp } from "@/lib/audio";

type Props = {
  bilikId: string | null;
  userId: string | null;
  nama: string;
};

/** Bar suara langsung untuk bilik diskusi — audio sahaja, mesra data telefon. */
export default function BarSuara({ bilikId, userId, nama }: Props) {
  const { klik } = useAudioApp();
  const { aktif, menyambung, bisu, peserta, ralat, sertai, keluar, togolBisu } = useSuara(
    bilikId,
    userId,
    nama,
  );

  return (
    <div className="liquid-glass mb-4 rounded-3xl p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
              aktif ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-white/70"
            }`}
          >
            <Radio size={18} className={aktif ? "animate-pulse" : ""} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Bar Suara Langsung</p>
            <p className="truncate text-xs text-white/55">
              {aktif
                ? `${peserta.length} sedang bersuara · ${bisu ? "mikrofon dibisukan" : "mikrofon terbuka"}`
                : "Berbual suara terus dengan ahli bilik ini"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {aktif && (
            <button
              onClick={() => {
                klik();
                togolBisu();
              }}
              aria-label={bisu ? "Buka mikrofon" : "Bisukan mikrofon"}
              className={`rounded-full p-3 transition-colors ${
                bisu ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {bisu ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <button
            onClick={() => {
              klik();
              if (aktif) keluar();
              else void sertai();
            }}
            disabled={menyambung || !bilikId}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
              aktif ? "bg-red-500 text-white" : "bg-white text-black"
            }`}
          >
            {menyambung ? (
              <Loader2 size={16} className="animate-spin" />
            ) : aktif ? (
              <PhoneOff size={16} />
            ) : (
              <Volume2 size={16} />
            )}
            <span className="hidden sm:inline">{aktif ? "Keluar" : "Sertai suara"}</span>
          </button>
        </div>
      </div>

      {aktif && peserta.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {peserta.map((p) => (
            <span
              key={p.user_id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                p.bercakap
                  ? "bg-emerald-400/25 text-emerald-100 ring-2 ring-emerald-300/60"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {p.bisu ? <MicOff size={12} /> : <Mic size={12} />}
              <span className="max-w-[9rem] truncate">
                {p.nama}
                {p.saya ? " (anda)" : ""}
              </span>
            </span>
          ))}
        </div>
      )}

      {ralat && <p className="mt-3 text-xs text-amber-300">{ralat}</p>}
    </div>
  );
}
