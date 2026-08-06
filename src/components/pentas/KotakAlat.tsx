import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";
import { ralatMesra } from "@/lib/bicara";

const TOPIK = ["Umum", "Fonologi", "Morfologi", "Sintaksis", "Ejaan", "Peribahasa"] as const;

type SetKad = { id: string; user_id: string; tajuk: string; topik: string };
type Kad = { id: string; set_id: string; soalan: string; jawapan: string };
type Undian = { id: string; user_id: string; soalan: string };
type Pilihan = { id: string; undian_id: string; teks: string; urutan: number };
type Undi = { undian_id: string; pilihan_id: string; user_id: string };

export default function KotakAlat() {
  const [alat, setAlat] = useState<"kad" | "undian">("kad");
  const { klik } = useAudioApp();

  return (
    <div>
      <div className="liquid-glass mb-4 grid grid-cols-2 gap-1 rounded-full p-1">
        {(
          [
            { k: "kad", label: "Kad Imbas", icon: Layers },
            { k: "undian", label: "Undian Pantas", icon: BarChart3 },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => {
              klik();
              setAlat(t.k);
            }}
            className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              alat === t.k ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {alat === "kad" ? <KadImbas /> : <UndianPantas />}
    </div>
  );
}

/* ---------------------------------- KAD IMBAS --------------------------------- */

function KadImbas() {
  const { pengguna } = useAuth();
  const { klik } = useAudioApp();
  const [set, setSet] = useState<SetKad[]>([]);
  const [kad, setKad] = useState<Kad[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [buka, setBuka] = useState<string | null>(null);
  const [borang, setBorang] = useState(false);
  const [tajuk, setTajuk] = useState("");
  const [topik, setTopik] = useState<string>("Umum");
  const [baris, setBaris] = useState<{ soalan: string; jawapan: string }[]>([
    { soalan: "", jawapan: "" },
  ]);
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const [s, k] = await Promise.all([
      supabase.from("set_kad").select("id, user_id, tajuk, topik").order("created_at", { ascending: false }),
      supabase.from("kad").select("id, set_id, soalan, jawapan").order("urutan"),
    ]);
    setSet((s.data as SetKad[]) ?? []);
    setKad((k.data as Kad[]) ?? []);
    setMemuat(false);
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const simpan = async () => {
    if (!pengguna || !tajuk.trim()) return;
    const sah = baris.filter((b) => b.soalan.trim() && b.jawapan.trim());
    if (sah.length === 0) {
      setRalat("Tambah sekurang-kurangnya satu kad lengkap (soalan + jawapan).");
      return;
    }
    setSibuk(true);
    setRalat(null);
    const { data, error } = await supabase
      .from("set_kad")
      .insert({ user_id: pengguna.id, tajuk: tajuk.trim(), topik })
      .select("id")
      .single();
    if (error || !data) {
      setSibuk(false);
      setRalat(ralatMesra(error?.message ?? "Gagal menyimpan set kad."));
      return;
    }
    const { error: e2 } = await supabase.from("kad").insert(
      sah.map((b, i) => ({
        set_id: data.id,
        user_id: pengguna.id,
        soalan: b.soalan.trim(),
        jawapan: b.jawapan.trim(),
        urutan: i,
      })),
    );
    setSibuk(false);
    if (e2) {
      setRalat(ralatMesra(e2.message));
      return;
    }
    setTajuk("");
    setTopik("Umum");
    setBaris([{ soalan: "", jawapan: "" }]);
    setBorang(false);
    void muat();
  };

  const padam = async (id: string) => {
    await supabase.from("set_kad").delete().eq("id", id);
    if (buka === id) setBuka(null);
    void muat();
  };

  if (memuat)
    return (
      <div className="liquid-glass flex items-center justify-center gap-2 rounded-3xl p-8 text-white/60">
        <Loader2 className="animate-spin" size={18} /> Memuatkan kad imbas…
      </div>
    );

  return (
    <div className="space-y-4">
      {!borang ? (
        <button
          onClick={() => {
            klik();
            setBorang(true);
          }}
          className="liquid-glass flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-4 text-sm font-medium text-white hover:bg-white/10"
        >
          <Plus size={18} /> Cipta set kad imbas baharu
        </button>
      ) : (
        <div className="liquid-glass space-y-3 rounded-3xl p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-white">Set kad imbas baharu</h2>
            <button
              aria-label="Tutup borang"
              onClick={() => setBorang(false)}
              className="shrink-0 rounded-full p-2 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <input
            value={tajuk}
            onChange={(e) => setTajuk(e.target.value)}
            placeholder="Tajuk set (cth. Imbuhan meN-)"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
          />
          <div className="flex flex-wrap gap-2">
            {TOPIK.map((t) => (
              <button
                key={t}
                onClick={() => setTopik(t)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  topik === t ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {baris.map((b, i) => (
              <div key={i} className="grid gap-2 rounded-2xl bg-white/5 p-3 sm:grid-cols-2">
                <input
                  value={b.soalan}
                  onChange={(e) =>
                    setBaris((r) => r.map((x, j) => (j === i ? { ...x, soalan: e.target.value } : x)))
                  }
                  placeholder={`Soalan ${i + 1}`}
                  className="min-w-0 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                />
                <input
                  value={b.jawapan}
                  onChange={(e) =>
                    setBaris((r) => r.map((x, j) => (j === i ? { ...x, jawapan: e.target.value } : x)))
                  }
                  placeholder="Jawapan"
                  className="min-w-0 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setBaris((r) => [...r, { soalan: "", jawapan: "" }])}
            className="w-full rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white"
          >
            + Tambah kad
          </button>
          {ralat && <p className="text-sm text-red-300">{ralat}</p>}
          <button
            onClick={() => {
              klik();
              void simpan();
            }}
            disabled={sibuk || !tajuk.trim()}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            {sibuk ? "Menyimpan…" : "Simpan set kad"}
          </button>
        </div>
      )}

      {set.length === 0 && (
        <div className="liquid-glass rounded-3xl p-8 text-center text-sm text-white/60">
          Belum ada set kad imbas. Jadilah yang pertama berkongsi!
        </div>
      )}

      {set.map((s) => {
        const isi = kad.filter((k) => k.set_id === s.id);
        return (
          <div key={s.id} className="liquid-glass rounded-3xl p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{s.tajuk}</p>
                <p className="text-xs text-white/55">
                  {s.topik} · {isi.length} kad
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {pengguna?.id === s.user_id && (
                  <button
                    aria-label="Padam set kad"
                    onClick={() => void padam(s.id)}
                    className="rounded-full p-2 text-white/40 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    klik();
                    setBuka(buka === s.id ? null : s.id);
                  }}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  {buka === s.id ? "Tutup" : "Mula belajar"}
                </button>
              </div>
            </div>
            {buka === s.id && isi.length > 0 && <SesiKad kad={isi} />}
          </div>
        );
      })}
    </div>
  );
}

function SesiKad({ kad }: { kad: Kad[] }) {
  const { klik } = useAudioApp();
  const [urutan, setUrutan] = useState<number[]>(() => kad.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [terbalik, setTerbalik] = useState(false);

  useEffect(() => {
    setUrutan(kad.map((_, i) => i));
    setIdx(0);
    setTerbalik(false);
  }, [kad]);

  const semasa = kad[urutan[idx] ?? 0];
  if (!semasa) return null;

  const kocok = () => {
    const baru = [...urutan];
    for (let i = baru.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baru[i], baru[j]] = [baru[j]!, baru[i]!];
    }
    setUrutan(baru);
    setIdx(0);
    setTerbalik(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={() => {
          klik();
          setTerbalik((v) => !v);
        }}
        className={`flex min-h-40 w-full items-center justify-center rounded-3xl p-6 text-center transition-colors ${
          terbalik ? "bg-emerald-400/15 ring-1 ring-emerald-300/40" : "bg-white/10"
        }`}
      >
        <span className="text-lg leading-relaxed text-white">
          {terbalik ? semasa.jawapan : semasa.soalan}
        </span>
      </button>
      <p className="text-center text-xs text-white/45">
        {terbalik ? "Jawapan" : "Ketik kad untuk lihat jawapan"} · {idx + 1}/{kad.length}
      </p>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
        <button
          onClick={() => {
            setIdx((i) => (i - 1 + kad.length) % kad.length);
            setTerbalik(false);
          }}
          className="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white"
        >
          Sebelum
        </button>
        <button
          onClick={kocok}
          className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white"
        >
          <Shuffle size={15} /> Kocok
        </button>
        <button
          onClick={() => {
            setIdx((i) => (i + 1) % kad.length);
            setTerbalik(false);
          }}
          className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          Seterusnya
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- UNDIAN PANTAS ------------------------------- */

function UndianPantas() {
  const { pengguna } = useAuth();
  const { klik } = useAudioApp();
  const [undian, setUndian] = useState<Undian[]>([]);
  const [pilihan, setPilihan] = useState<Pilihan[]>([]);
  const [undi, setUndi] = useState<Undi[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [borang, setBorang] = useState(false);
  const [soalan, setSoalan] = useState("");
  const [teks, setTeks] = useState<string[]>(["", ""]);
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const [u, p, v] = await Promise.all([
      supabase.from("undian").select("id, user_id, soalan").order("created_at", { ascending: false }),
      supabase.from("undian_pilihan").select("id, undian_id, teks, urutan").order("urutan"),
      supabase.from("undian_undi").select("undian_id, pilihan_id, user_id"),
    ]);
    setUndian((u.data as Undian[]) ?? []);
    setPilihan((p.data as Pilihan[]) ?? []);
    setUndi((v.data as Undi[]) ?? []);
    setMemuat(false);
  }, []);

  useEffect(() => {
    void muat();
    const ch = supabase
      .channel("undian-langsung")
      .on("postgres_changes", { event: "*", schema: "public", table: "undian_undi" }, () => void muat())
      .on("postgres_changes", { event: "*", schema: "public", table: "undian" }, () => void muat())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [muat]);

  const cipta = async () => {
    if (!pengguna || !soalan.trim()) return;
    const sah = teks.map((t) => t.trim()).filter(Boolean);
    if (sah.length < 2) {
      setRalat("Undian perlu sekurang-kurangnya dua pilihan.");
      return;
    }
    setSibuk(true);
    setRalat(null);
    const { data, error } = await supabase
      .from("undian")
      .insert({ user_id: pengguna.id, soalan: soalan.trim() })
      .select("id")
      .single();
    if (error || !data) {
      setSibuk(false);
      setRalat(ralatMesra(error?.message ?? "Gagal mencipta undian."));
      return;
    }
    await supabase.from("undian_pilihan").insert(
      sah.map((t, i) => ({ undian_id: data.id, user_id: pengguna.id, teks: t, urutan: i })),
    );
    setSibuk(false);
    setSoalan("");
    setTeks(["", ""]);
    setBorang(false);
    void muat();
  };

  const undiSaya = async (undianId: string, pilihanId: string) => {
    if (!pengguna) return;
    await supabase
      .from("undian_undi")
      .upsert(
        { undian_id: undianId, pilihan_id: pilihanId, user_id: pengguna.id },
        { onConflict: "undian_id,user_id" },
      );
    void muat();
  };

  const padam = async (id: string) => {
    await supabase.from("undian").delete().eq("id", id);
    void muat();
  };

  const kiraan = useMemo(() => {
    const m = new Map<string, number>();
    undi.forEach((v) => m.set(v.pilihan_id, (m.get(v.pilihan_id) ?? 0) + 1));
    return m;
  }, [undi]);

  if (memuat)
    return (
      <div className="liquid-glass flex items-center justify-center gap-2 rounded-3xl p-8 text-white/60">
        <Loader2 className="animate-spin" size={18} /> Memuatkan undian…
      </div>
    );

  return (
    <div className="space-y-4">
      {!borang ? (
        <button
          onClick={() => {
            klik();
            setBorang(true);
          }}
          className="liquid-glass flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-4 text-sm font-medium text-white hover:bg-white/10"
        >
          <Plus size={18} /> Cipta undian pantas
        </button>
      ) : (
        <div className="liquid-glass space-y-3 rounded-3xl p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-white">Undian pantas baharu</h2>
            <button
              aria-label="Tutup borang"
              onClick={() => setBorang(false)}
              className="shrink-0 rounded-full p-2 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <input
            value={soalan}
            onChange={(e) => setSoalan(e.target.value)}
            placeholder="Soalan (cth. Yang manakah ejaan betul?)"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
          />
          {teks.map((t, i) => (
            <input
              key={i}
              value={t}
              onChange={(e) => setTeks((r) => r.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`Pilihan ${i + 1}`}
              className="w-full rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
            />
          ))}
          {teks.length < 5 && (
            <button
              onClick={() => setTeks((r) => [...r, ""])}
              className="w-full rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white"
            >
              + Tambah pilihan
            </button>
          )}
          {ralat && <p className="text-sm text-red-300">{ralat}</p>}
          <button
            onClick={() => {
              klik();
              void cipta();
            }}
            disabled={sibuk || !soalan.trim()}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            {sibuk ? "Menyimpan…" : "Terbitkan undian"}
          </button>
        </div>
      )}

      {undian.length === 0 && (
        <div className="liquid-glass rounded-3xl p-8 text-center text-sm text-white/60">
          Belum ada undian. Mulakan satu soalan tatabahasa untuk komuniti!
        </div>
      )}

      {undian.map((u) => {
        const opsyen = pilihan.filter((p) => p.undian_id === u.id);
        const jumlah = opsyen.reduce((a, o) => a + (kiraan.get(o.id) ?? 0), 0);
        const sayaUndi = undi.find((v) => v.undian_id === u.id && v.user_id === pengguna?.id);
        return (
          <div key={u.id} className="liquid-glass space-y-3 rounded-3xl p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <p className="min-w-0 font-medium text-white">{u.soalan}</p>
              {pengguna?.id === u.user_id && (
                <button
                  aria-label="Padam undian"
                  onClick={() => void padam(u.id)}
                  className="shrink-0 rounded-full p-2 text-white/40 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {opsyen.map((o) => {
                const n = kiraan.get(o.id) ?? 0;
                const pct = jumlah ? Math.round((n / jumlah) * 100) : 0;
                const dipilih = sayaUndi?.pilihan_id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => {
                      klik();
                      void undiSaya(u.id, o.id);
                    }}
                    className={`relative w-full overflow-hidden rounded-2xl px-4 py-3 text-left text-sm text-white ${
                      dipilih ? "ring-1 ring-emerald-300/60" : ""
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                        dipilih ? "bg-emerald-400/30" : "bg-white/15"
                      }`}
                      style={{ width: sayaUndi ? `${pct}%` : "0%" }}
                    />
                    <span className="absolute inset-0 bg-white/5" style={{ zIndex: -1 }} />
                    <span className="relative flex items-center gap-2">
                      {dipilih && <Check size={14} className="shrink-0 text-emerald-300" />}
                      <span className="min-w-0 flex-1 truncate">{o.teks}</span>
                      {sayaUndi && <span className="shrink-0 text-xs text-white/70">{pct}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 text-xs text-white/45">
              <RotateCcw size={12} /> {jumlah} undi · keputusan dikemas kini masa nyata
              {!sayaUndi && " · undi dahulu untuk lihat keputusan"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
