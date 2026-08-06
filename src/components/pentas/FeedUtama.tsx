import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImejChat, masaRingkas, muatNaikImej } from "@/lib/chat";
import { pastikanProfil, useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";
import { janaPosRakanMunsi } from "@/lib/rakanmunsi.functions";


type Pos = {
  id: string;
  user_id: string;
  induk_id: string | null;
  kandungan: string;
  imej_url: string | null;
  ditapis: boolean;
  created_at: string;
};

export default function FeedUtama() {
  const { pengguna } = useAuth();
  const { klik } = useAudioApp();
  const failRef = useRef<HTMLInputElement>(null);
  const teksRef = useRef<HTMLTextAreaElement>(null);

  const [pos, setPos] = useState<Pos[]>([]);
  const [nama, setNama] = useState<Record<string, string>>({});
  const [suka, setSuka] = useState<Record<string, number>>({});
  const [sukaSaya, setSukaSaya] = useState<Set<string>>(new Set());
  const [teks, setTeks] = useState("");
  const [fail, setFail] = useState<File | null>(null);
  const [balasKepada, setBalasKepada] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);
  const [jana, setJana] = useState(false);
  const autoRef = useRef(false);


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

  const muatSuka = useCallback(async () => {
    const { data } = await supabase.from("suka_pos").select("pos_id, user_id");
    const kira: Record<string, number> = {};
    const saya = new Set<string>();
    for (const s of data ?? []) {
      kira[s.pos_id] = (kira[s.pos_id] ?? 0) + 1;
      if (s.user_id === pengguna?.id) saya.add(s.pos_id);
    }
    setSuka(kira);
    setSukaSaya(saya);
  }, [pengguna?.id]);

  const muat = useCallback(async () => {
    const { data } = await supabase
      .from("pos")
      .select("id, user_id, induk_id, kandungan, imej_url, ditapis, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const senarai = (data as Pos[]) ?? [];
    setPos(senarai);
    await muatNama([...new Set(senarai.map((p) => p.user_id))]);
    await muatSuka();
    setMemuat(false);
  }, [muatNama, muatSuka]);

  useEffect(() => {
    if (pengguna) pastikanProfil(pengguna);
    muat();
  }, [pengguna, muat]);

  const mintaRakanMunsi = useCallback(async () => {
    if (autoRef.current) return;
    autoRef.current = true;
    setJana(true);
    setRalat(null);
    try {
      await janaPosRakanMunsi();
      await muat();
    } catch (e) {
      setRalat(e instanceof Error ? e.message : "RakanMunsi gagal menghantar.");
    } finally {
      setJana(false);
    }
  }, [muat]);

  // Hantaran harian RakanMunsi: dicuba sekali sehari sahaja (pelayan tetap
  // menolak jika hantaran hari ini sudah ada, jadi tiada penghantaran berulang).
  useEffect(() => {
    if (memuat || !pengguna) return;
    const hariIni = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("rakanmunsi-harian") === hariIni) return;
    localStorage.setItem("rakanmunsi-harian", hariIni);
    void mintaRakanMunsi();
  }, [memuat, pengguna, mintaRakanMunsi]);



  useEffect(() => {
    const channel = supabase
      .channel("pos-terbuka")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos" }, () => {
        muat();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [muat]);

  const hantarPos = async () => {
    if (!pengguna || hantar) return;
    if (!teks.trim() && !fail) return;
    setHantar(true);
    setRalat(null);
    try {
      let laluan: string | null = null;
      if (fail) laluan = await muatNaikImej(fail, pengguna.id);
      const { error } = await supabase.from("pos").insert({
        user_id: pengguna.id,
        induk_id: balasKepada,
        kandungan: teks.trim(),
        imej_url: laluan,
      });
      if (error) throw new Error(error.message);
      setTeks("");
      setFail(null);
      setBalasKepada(null);
      if (failRef.current) failRef.current.value = "";
      await muat();
    } catch (e) {
      setRalat(e instanceof Error ? e.message : "Gagal berkongsi.");
    } finally {
      setHantar(false);
    }
  };

  const togolSuka = async (posId: string) => {
    if (!pengguna) return;
    if (sukaSaya.has(posId)) {
      await supabase.from("suka_pos").delete().eq("pos_id", posId).eq("user_id", pengguna.id);
    } else {
      await supabase.from("suka_pos").insert({ pos_id: posId, user_id: pengguna.id });
    }
    await muatSuka();
  };

  const padam = async (posId: string) => {
    await supabase.from("pos").delete().eq("id", posId);
    await muat();
  };

  const utama = pos.filter((p) => !p.induk_id);
  const balasan = (id: string) =>
    pos.filter((p) => p.induk_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div>
      <div className="liquid-glass mb-6 space-y-3 rounded-3xl p-4">
        {balasKepada && (
          <div className="flex items-center gap-2 text-xs text-white/60">
            Membalas satu pos
            <button onClick={() => setBalasKepada(null)} className="text-white/80 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          ref={teksRef}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          rows={3}
          placeholder="Apa tips bahasa anda hari ini?"
          className="w-full resize-none bg-transparent text-base text-white outline-none placeholder:text-white/40"
        />
        {fail && (
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="flex-1 truncate">{fail.name}</span>
            <button
              onClick={() => {
                setFail(null);
                if (failRef.current) failRef.current.value = "";
              }}
              aria-label="Buang gambar"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            aria-label="Kongsi gambar"
            onClick={() => {
              klik();
              failRef.current?.click();
            }}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
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
          <button
            onClick={hantarPos}
            disabled={hantar || (!teks.trim() && !fail)}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {hantar ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Kongsi
          </button>
        </div>
      </div>

      {ralat && <p className="mb-4 text-sm text-red-300">⚠️ {ralat}</p>}

      {memuat ? (
        <div className="liquid-glass flex items-center gap-2 rounded-3xl p-5 text-sm text-white/70">
          <Loader2 size={16} className="animate-spin" /> Memuatkan…
        </div>
      ) : utama.length === 0 ? (
        <div className="liquid-glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
          {jana ? (
            <>
              <Sparkles size={22} className="animate-pulse text-white" />
              <p className="text-sm text-white/70">
                RakanMunsi sedang menyiapkan hantaran pembuka + infografik untuk anda…
              </p>
            </>
          ) : (
            <p className="text-sm text-white/70">
              Belum ada hantaran di sini lagi. Jadilah orang pertama yang berkongsi soalan atau nota
              hari ini! 🚀
            </p>
          )}
          <button
            onClick={() => {
              klik();
              window.scrollTo({ top: 0, behavior: "smooth" });
              teksRef.current?.focus();
            }}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            <PenLine size={16} /> Tulis Post Baharu
          </button>
          {!jana && (
            <button
              onClick={() => {
                klik();
                void mintaRakanMunsi();
              }}
              className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm text-white/80 hover:text-white"
            >
              <Sparkles size={16} /> Minta RakanMunsi mulakan
            </button>
          )}
        </div>

      ) : (
        <div className="space-y-4">
          {utama.map((p) => (
            <article key={p.id} className="liquid-glass rounded-3xl p-5">
              <p className="mb-2 text-xs text-white/50">
                {nama[p.user_id] ?? "Pengguna"} · {masaRingkas(p.created_at)}
              </p>
              {p.imej_url && (
                <div className="mb-3">
                  <ImejChat laluan={p.imej_url} alt="Gambar perkongsian pengguna" />
                </div>
              )}
              {p.kandungan && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{p.kandungan}</p>
              )}
              {p.ditapis && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                  <ShieldCheck size={12} /> Sebahagian kandungan ditapis automatik
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
                <button
                  onClick={() => togolSuka(p.id)}
                  className={`flex items-center gap-1 hover:text-white ${sukaSaya.has(p.id) ? "text-rose-300" : ""}`}
                >
                  <Heart size={14} fill={sukaSaya.has(p.id) ? "currentColor" : "none"} /> {suka[p.id] ?? 0}
                </button>
                <button
                  onClick={() => {
                    klik();
                    setBalasKepada(p.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <MessageCircle size={14} /> {balasan(p.id).length}
                </button>
                {p.user_id === pengguna?.id && (
                  <button onClick={() => padam(p.id)} className="hover:text-white">
                    Padam
                  </button>
                )}
              </div>

              {balasan(p.id).length > 0 && (
                <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                  {balasan(p.id).map((r) => (
                    <div key={r.id}>
                      <p className="mb-1 text-xs text-white/50">
                        {nama[r.user_id] ?? "Pengguna"} · {masaRingkas(r.created_at)}
                      </p>
                      {r.imej_url && (
                        <div className="mb-2">
                          <ImejChat laluan={r.imej_url} alt="Gambar balasan pengguna" />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm text-white/90">{r.kandungan}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
