import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy, ImagePlus, Loader2, Send, ShieldCheck, X } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { ImejChat, masaRingkas, muatNaikImej } from "@/lib/chat";
import { useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/_authenticated/bicara/$kod")({
  head: () => ({
    meta: [
      { title: "Bilik Perbincangan — Ruang Bicara | e-MuNsi" },
      {
        name: "description",
        content:
          "Berbual masa nyata dalam bilik perbincangan bahasa Melayu e-MuNsi dengan penapisan kandungan automatik.",
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

  const [bilik, setBilik] = useState<{ id: string; nama: string; tajuk: string | null } | null>(null);
  const [mesej, setMesej] = useState<Mesej[]>([]);
  const [nama, setNama] = useState<Record<string, string>>({});
  const [teks, setTeks] = useState("");
  const [fail, setFail] = useState<File | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);
  const [salin, setSalin] = useState(false);

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

  useEffect(() => {
    let hidup = true;
    (async () => {
      const { error: ralatSertai } = await supabase.rpc("sertai_bilik", { _kod: kod });
      if (ralatSertai) {
        if (hidup) {
          setRalat("Kod bilik tidak sah atau bilik telah ditutup.");
          setMemuat(false);
        }
        return;
      }
      const { data: b } = await supabase
        .from("bilik")
        .select("id, nama, tajuk")
        .eq("kod", kod)
        .maybeSingle();
      if (!hidup || !b) return;
      setBilik(b);
      const { data: m } = await supabase
        .from("mesej")
        .select("id, user_id, kandungan, imej_url, ditapis, created_at")
        .eq("bilik_id", b.id)
        .order("created_at", { ascending: true });
      if (!hidup) return;
      setMesej((m as Mesej[]) ?? []);
      await muatNama([...new Set((m ?? []).map((x) => x.user_id))]);
      setMemuat(false);
    })();
    return () => {
      hidup = false;
    };
  }, [kod, muatNama]);

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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bilik, muatNama]);

  useEffect(() => {
    hujungRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesej.length]);

  const hantarMesej = async () => {
    if (!bilik || !pengguna || hantar) return;
    if (!teks.trim() && !fail) return;
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
      setTeks("");
      setFail(null);
      if (failRef.current) failRef.current.value = "";
    } catch (e) {
      setRalat(e instanceof Error ? e.message : "Gagal menghantar mesej.");
    } finally {
      setHantar(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6">
        <div className="liquid-glass mb-4 flex items-center gap-3 rounded-3xl p-4">
          <button
            onClick={() => {
              klik();
              navigate({ to: "/bicara" });
            }}
            aria-label="Kembali ke senarai bilik"
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white">{bilik?.nama ?? "Bilik"}</p>
            <p className="truncate text-xs text-white/60">{bilik?.tajuk || "Perbincangan bahasa"}</p>
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

        <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
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
            return (
              <div
                key={m.id}
                className={`liquid-glass max-w-[85%] rounded-3xl p-4 ${saya ? "ml-auto" : "mr-auto"}`}
              >
                <p className="mb-1 text-xs text-white/50">
                  {saya ? "Anda" : (nama[m.user_id] ?? "Pengguna")} · {masaRingkas(m.created_at)}
                </p>
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
              </div>
            );
          })}
          {ralat && <div className="liquid-glass rounded-3xl p-5 text-sm text-white">⚠️ {ralat}</div>}
          <div ref={hujungRef} />
        </div>

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
            onChange={(e) => setFail(e.target.files?.[0] ?? null)}
          />
          <input
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hantarMesej()}
            placeholder="Tulis mesej yang sopan…"
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/40"
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
          Kongsi kod <span className="font-mono">{kod}</span> untuk menjemput rakan.{" "}
          <Link to="/terbuka" className="underline">
            Ruang Terbuka
          </Link>
        </p>
      </main>
    </div>
  );
}
