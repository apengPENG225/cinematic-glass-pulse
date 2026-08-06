import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  Flag,
  ImagePlus,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import BarSuara from "@/components/bicara/BarSuara";
import SiteNav from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { ImejChat, masaRingkas, muatNaikImej } from "@/lib/chat";
import {
  HAD,
  SEBAB_LAPOR,
  failImejSah,
  mesejRingkasSah,
  ralatMesra,
  useHadKadar,
  useKehadiran,
} from "@/lib/bicara";
import { useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/_authenticated/bicara/$kod")({
  head: () => ({
    meta: [
      { title: "Bilik Perbincangan — Ruang Bicara | e-MuNsi" },
      {
        name: "description",
        content:
          "Berbual masa nyata dalam bilik perbincangan bahasa Melayu e-MuNsi dengan penapisan kandungan automatik, indikator kehadiran dan status baca.",
      },
      { property: "og:title", content: "Bilik Perbincangan — Ruang Bicara | e-MuNsi" },
      {
        property: "og:description",
        content: "Chat masa nyata yang selamat untuk berbincang kesalahan bahasa dan tips.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BilikChat,
});

type Mesej = {
  id: string;
  user_id: string;
  kandungan: string;
  imej_url: string | null;
  ditapis: boolean;
  created_at: string;
};

function BilikChat() {
  const { kod } = useParams({ from: "/_authenticated/bicara/$kod" });
  const { pengguna } = useAuth();
  const navigate = useNavigate();
  const { klik } = useAudioApp();
  const failRef = useRef<HTMLInputElement>(null);
  const hujungRef = useRef<HTMLDivElement>(null);
  const had = useHadKadar();

  const [bilik, setBilik] = useState<{
    id: string;
    nama: string;
    tajuk: string | null;
    ada_kata_laluan: boolean;
  } | null>(null);
  const [mesej, setMesej] = useState<Mesej[]>([]);
  const [nama, setNama] = useState<Record<string, string>>({});
  const [teks, setTeks] = useState("");
  const [fail, setFail] = useState<File | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);
  const [salin, setSalin] = useState(false);
  const [kunci, setKunci] = useState(false);
  const [kataLaluan, setKataLaluan] = useState("");
  const [bacaan, setBacaan] = useState<Record<string, string>>({});
  const [lapor, setLapor] = useState<Mesej | null>(null);
  const [dilapor, setDilapor] = useState<Record<string, string>>({});

  const namaSaya = pengguna ? (nama[pengguna.id] ?? "Anda") : "Tetamu";
  const { hadir, menaip, hantarMenaip } = useKehadiran(bilik?.id ?? null, pengguna?.id ?? null, namaSaya);

  const muatNama = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await supabase.from("profil").select("id, nama_paparan").in("id", ids);
    if (data) {
      setNama((n) => {
        const baru = { ...n };
        for (const p of data) baru[p.id] = p.nama_paparan;
        return baru;
      });
    }
  }, []);

  const muatBilik = useCallback(
    async (kataMasuk: string) => {
      setRalat(null);
      const { error: ralatSertai } = await supabase.rpc("sertai_bilik", {
        _kod: kod,
        _kata_laluan: kataMasuk,
      });
      if (ralatSertai) {
        if (ralatSertai.message.includes("KATA_LALUAN_SALAH")) {
          setKunci(true);
          setMemuat(false);
          if (kataMasuk) setRalat("Kata laluan salah. Cuba lagi.");
          return;
        }
        setRalat("Kod bilik tidak sah atau bilik telah ditutup.");
        setMemuat(false);
        return;
      }
      setKunci(false);
      const { data: b } = await supabase
        .from("bilik")
        .select("id, nama, tajuk, ada_kata_laluan")
        .eq("kod", kod)
        .maybeSingle();
      if (!b) return;
      setBilik(b);
      const { data: m } = await supabase
        .from("mesej")
        .select("id, user_id, kandungan, imej_url, ditapis, created_at")
        .eq("bilik_id", b.id)
        .order("created_at", { ascending: true });
      setMesej((m as Mesej[]) ?? []);
      await muatNama([...new Set((m ?? []).map((x) => x.user_id))]);
      const { data: bc } = await supabase.from("bacaan").select("user_id, dibaca_pada").eq("bilik_id", b.id);
      if (bc) setBacaan(Object.fromEntries(bc.map((x) => [x.user_id, x.dibaca_pada])));
      const { data: lp } = await supabase.from("laporan").select("mesej_id, status").not("mesej_id", "is", null);
      if (lp) setDilapor(Object.fromEntries(lp.map((x) => [x.mesej_id as string, x.status])));
      setMemuat(false);
    },
    [kod, muatNama],
  );

  useEffect(() => {
    setMemuat(true);
    void muatBilik("");
  }, [muatBilik]);

  // Mesej masa nyata + status baca
  useEffect(() => {
    if (!bilik) return;
    const channel = supabase
      .channel(`bilik-${bilik.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mesej", filter: `bilik_id=eq.${bilik.id}` },
        (payload) => {
          const baru = payload.new as Mesej;
          setMesej((m) => (m.some((x) => x.id === baru.id) ? m : [...m, baru]));
          muatNama([baru.user_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bacaan", filter: `bilik_id=eq.${bilik.id}` },
        (payload) => {
          const b = payload.new as { user_id: string; dibaca_pada: string };
          if (b?.user_id) setBacaan((s) => ({ ...s, [b.user_id]: b.dibaca_pada }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bilik, muatNama]);

  // Tanda sudah baca
  useEffect(() => {
    if (!bilik || !pengguna) return;
    void supabase
      .from("bacaan")
      .upsert(
        { bilik_id: bilik.id, user_id: pengguna.id, dibaca_pada: new Date().toISOString() },
        { onConflict: "bilik_id,user_id" },
      );
  }, [bilik, pengguna, mesej.length]);

  useEffect(() => {
    hujungRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesej.length]);

  const idAkhirSaya = useMemo(() => {
    for (let i = mesej.length - 1; i >= 0; i--) {
      const m = mesej[i];
      if (m && m.user_id === pengguna?.id) return m.id;
    }
    return null;
  }, [mesej, pengguna]);

  const kiraDibaca = (m: Mesej) =>
    Object.entries(bacaan).filter(([uid, pada]) => uid !== m.user_id && pada >= m.created_at).length;

  const hantarMesej = async () => {
    if (!bilik || !pengguna || hantar) return;
    const salah = mesejRingkasSah(teks, Boolean(fail));
    if (salah) {
      setRalat(salah);
      return;
    }
    const hadRalat = had.semak();
    if (hadRalat) {
      setRalat(hadRalat);
      return;
    }
    setHantar(true);
    setRalat(null);
    try {
      let laluan: string | null = null;
      if (fail) laluan = await muatNaikImej(fail, pengguna.id);
      const { error } = await supabase.from("mesej").insert({
        bilik_id: bilik.id,
        user_id: pengguna.id,
        kandungan: teks.trim(),
        imej_url: laluan,
      });
      if (error) throw new Error(error.message);
      had.rekod();
      setTeks("");
      setFail(null);
      if (failRef.current) failRef.current.value = "";
    } catch (e) {
      setRalat(ralatMesra(e instanceof Error ? e.message : "Gagal menghantar mesej."));
    } finally {
      setHantar(false);
    }
  };

  const hantarLaporan = async (sebab: string) => {
    if (!lapor || !pengguna) return;
    const { error } = await supabase
      .from("laporan")
      .insert({ mesej_id: lapor.id, pelapor: pengguna.id, sebab });
    setDilapor((d) => ({ ...d, [lapor.id]: "baharu" }));
    setLapor(null);
    if (error && !/duplicate/i.test(error.message)) setRalat(ralatMesra(error.message));
  };

  if (kunci) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
        <VideoBackground />
        <SiteNav />
        <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center px-5">
          <div className="liquid-glass w-full space-y-4 rounded-3xl p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Lock size={22} className="text-emerald-300" />
            </div>
            <h1 className="text-2xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Bilik ini berkunci
            </h1>
            <p className="text-sm text-white/60">
              Masukkan kata laluan yang diberikan oleh hos bilik <span className="font-mono">{kod}</span>.
            </p>
            <input
              value={kataLaluan}
              onChange={(e) => setKataLaluan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && muatBilik(kataLaluan)}
              type="password"
              placeholder="Kata laluan bilik"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-center text-base text-white outline-none placeholder:text-white/40"
            />
            {ralat && <p className="text-sm text-red-300">{ralat}</p>}
            <button
              onClick={() => {
                klik();
                muatBilik(kataLaluan);
              }}
              disabled={!kataLaluan.trim()}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Masuk bilik
            </button>
            <button onClick={() => navigate({ to: "/pentas/bilik" })} className="text-xs text-white/50 underline">
              Kembali ke senarai bilik
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 sm:px-6">
        <div className="liquid-glass mb-4 flex items-center gap-3 rounded-3xl p-4">
          <button
            onClick={() => {
              klik();
              navigate({ to: "/pentas/bilik" });
            }}
            aria-label="Kembali ke senarai bilik"
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate font-medium text-white">
              {bilik?.ada_kata_laluan && <Lock size={13} className="shrink-0 text-emerald-300" />}
              {bilik?.nama ?? "Bilik"}
            </p>
            <p className="flex items-center gap-1.5 truncate text-xs text-white/60">
              <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
              {hadir.length} dalam talian
              <span className="text-white/30">·</span>
              <span className="truncate">{bilik?.tajuk || "Perbincangan bahasa"}</span>
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(kod);
              setSalin(true);
              setTimeout(() => setSalin(false), 1500);
            }}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-mono text-xs text-white/80 hover:text-white"
          >
            <Copy size={14} /> {salin ? "Disalin!" : kod}
          </button>
        </div>

        <BarSuara
          bilikId={bilik?.id ?? null}
          userId={pengguna?.id ?? null}
          nama={(pengguna && nama[pengguna.id]) || "Pengguna"}
        />



        {hadir.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {hadir.slice(0, 8).map((h) => (
              <span
                key={h.user_id}
                className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-xs text-white/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {h.user_id === pengguna?.id ? "Anda" : (nama[h.user_id] ?? h.nama)}
              </span>
            ))}
          </div>
        )}

        <div className="mb-3 flex-1 space-y-3 overflow-y-auto">
          {memuat && (
            <div className="liquid-glass flex items-center gap-2 rounded-3xl p-5 text-sm text-white/70">
              <Loader2 size={16} className="animate-spin" /> Memuatkan bilik…
            </div>
          )}
          {!memuat && mesej.length === 0 && !ralat && (
            <div className="liquid-glass rounded-3xl p-5 text-sm text-white/70">
              Belum ada mesej. Mulakan perbincangan anda — kongsi contoh kesalahan bahasa atau tips.
            </div>
          )}
          {mesej.map((m) => {
            const saya = m.user_id === pengguna?.id;
            const jumlahBaca = kiraDibaca(m);
            return (
              <div
                key={m.id}
                className={`group liquid-glass max-w-[86%] rounded-3xl p-4 ${saya ? "ml-auto" : "mr-auto"}`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <p className="flex-1 truncate text-xs text-white/50">
                    {saya ? "Anda" : (nama[m.user_id] ?? "Pengguna")} · {masaRingkas(m.created_at)}
                  </p>
                  {!saya &&
                    (dilapor[m.id] ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-200">
                        <Flag size={10} /> Dilaporkan
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          klik();
                          setLapor(m);
                        }}
                        aria-label="Laporkan mesej ini"
                        className="shrink-0 rounded-full p-1.5 text-white/35 hover:bg-white/10 hover:text-amber-300"
                      >
                        <Flag size={13} />
                      </button>
                    ))}
                </div>
                {m.imej_url && (
                  <div className="mb-2">
                    <ImejChat laluan={m.imej_url} alt="Gambar dikongsi dalam bilik" />
                  </div>
                )}
                {m.kandungan && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{m.kandungan}</p>
                )}
                {m.ditapis && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                    <ShieldCheck size={12} /> Sebahagian kandungan ditapis automatik
                  </p>
                )}
                {dilapor[m.id] && (
                  <p className="mt-2 text-[11px] text-amber-200/80">
                    Status laporan: {dilapor[m.id] === "baharu" ? "dalam semakan" : dilapor[m.id]}
                  </p>
                )}
                {saya && m.id === idAkhirSaya && (
                  <p className="mt-2 flex items-center justify-end gap-1 text-[11px] text-white/45">
                    {jumlahBaca > 0 ? (
                      <>
                        <CheckCheck size={13} className="text-sky-300" /> Dibaca {jumlahBaca}
                      </>
                    ) : (
                      <>
                        <Check size={13} /> Dihantar
                      </>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          {ralat && <div className="liquid-glass rounded-3xl p-5 text-sm text-white">⚠️ {ralat}</div>}
          <div ref={hujungRef} />
        </div>

        {menaip.length > 0 && (
          <p className="mb-2 flex items-center gap-2 px-2 text-xs text-white/60">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:300ms]" />
            </span>
            {menaip.slice(0, 2).join(", ")} sedang menaip…
          </p>
        )}

        {fail && (
          <div className="liquid-glass mb-3 flex items-center gap-3 rounded-3xl p-3">
            <span className="flex-1 truncate text-sm text-white/70">{fail.name}</span>
            <button
              aria-label="Buang gambar"
              onClick={() => {
                setFail(null);
                if (failRef.current) failRef.current.value = "";
              }}
              className="rounded-full p-2 text-white/70 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="liquid-glass flex items-center gap-2 rounded-full p-2">
          <button
            aria-label="Kongsi gambar"
            onClick={() => {
              klik();
              failRef.current?.click();
            }}
            className="rounded-full p-3 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={failRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (!f) return setFail(null);
              const salah = failImejSah(f);
              if (salah) {
                setRalat(salah);
                e.target.value = "";
                return;
              }
              setRalat(null);
              setFail(f);
            }}
          />
          <input
            value={teks}
            maxLength={HAD.panjangMesej}
            onChange={(e) => {
              setTeks(e.target.value);
              hantarMenaip();
            }}
            onKeyDown={(e) => e.key === "Enter" && hantarMesej()}
            placeholder="Tulis mesej yang sopan…"
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40"
          />
          <button
            aria-label="Hantar mesej"
            onClick={hantarMesej}
            disabled={hantar || (!teks.trim() && !fail)}
            className="rounded-full bg-white p-3 text-black disabled:opacity-40"
          >
            {hantar ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          Kongsi kod <span className="font-mono">{kod}</span> untuk menjemput rakan · had 5 mesej/10 saat ·
          kuota {HAD.imejSehari} gambar sehari ·{" "}
          <Link to="/pentas/feed" className="underline">
            Ruang Terbuka
          </Link>
        </p>
      </main>

      {lapor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="liquid-glass w-full max-w-md space-y-3 rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Flag size={16} className="text-amber-300" />
              <h2 className="flex-1 text-white">Laporkan mesej</h2>
              <button
                aria-label="Tutup"
                onClick={() => setLapor(null)}
                className="rounded-full p-2 text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <p className="line-clamp-2 rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/60">
              “{lapor.kandungan || "(gambar)"}”
            </p>
            <div className="grid gap-2">
              {SEBAB_LAPOR.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    klik();
                    hantarLaporan(s);
                  }}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm text-white hover:bg-white/20"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] text-white/40">
              Laporan dihantar kepada hos bilik untuk semakan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
