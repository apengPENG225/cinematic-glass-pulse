import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { DoorOpen, Loader2, LogOut, MessagesSquare, Plus, Users } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { janaKod } from "@/lib/chat";
import { pastikanProfil, useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/_authenticated/bicara/")({
  head: () => ({
    meta: [
      { title: "Ruang Bicara — Bilik Perbincangan Bahasa | e-MuNsi" },
      {
        name: "description",
        content:
          "Cipta atau sertai bilik perbincangan bahasa Melayu secara masa nyata dengan kod jemputan peribadi.",
      },
      { property: "og:title", content: "Ruang Bicara — Bilik Perbincangan Bahasa | e-MuNsi" },
      {
        property: "og:description",
        content: "Bilik chat masa nyata yang selamat untuk berbincang kesalahan bahasa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BicaraIndex,
});

type Bilik = { id: string; nama: string; tajuk: string | null; kod: string; pemilik: string };

function BicaraIndex() {
  const { pengguna } = useAuth();
  const navigate = useNavigate();
  const { klik } = useAudioApp();
  const [bilik, setBilik] = useState<Bilik[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [nama, setNama] = useState("");
  const [tajuk, setTajuk] = useState("");
  const [kodSertai, setKodSertai] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const { data } = await supabase
      .from("bilik")
      .select("id, nama, tajuk, kod, pemilik")
      .order("created_at", { ascending: false });
    setBilik((data as Bilik[]) ?? []);
    setMemuat(false);
  }, []);

  useEffect(() => {
    if (pengguna) pastikanProfil(pengguna);
    muat();
  }, [pengguna, muat]);

  const cipta = async () => {
    if (!pengguna || !nama.trim()) return;
    setSibuk(true);
    setRalat(null);
    const kod = janaKod();
    const { data, error } = await supabase
      .from("bilik")
      .insert({ nama: nama.trim(), tajuk: tajuk.trim() || null, kod, pemilik: pengguna.id })
      .select("id, kod")
      .single();
    if (error || !data) {
      setRalat(error?.message ?? "Gagal mencipta bilik.");
      setSibuk(false);
      return;
    }
    await supabase.from("ahli_bilik").insert({ bilik_id: data.id, user_id: pengguna.id, peranan: "hos" });
    setSibuk(false);
    navigate({ to: "/bicara/$kod", params: { kod: data.kod } });
  };

  const sertai = async () => {
    if (!kodSertai.trim()) return;
    setSibuk(true);
    setRalat(null);
    const { error } = await supabase.rpc("sertai_bilik", { _kod: kodSertai.trim() });
    setSibuk(false);
    if (error) {
      setRalat("Kod bilik tidak sah.");
      return;
    }
    navigate({ to: "/bicara/$kod", params: { kod: kodSertai.trim().toLowerCase() } });
  };

  const keluar = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-4xl text-white md:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Ruang Bicara
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Bilik perbincangan berkod — hanya orang yang ada kod boleh masuk.
            </p>
          </div>
          <button
            onClick={keluar}
            className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            <LogOut size={16} /> Log keluar
          </button>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="liquid-glass space-y-3 rounded-3xl p-5">
            <h2 className="flex items-center gap-2 text-white">
              <Plus size={18} /> Cipta bilik baharu
            </h2>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama bilik"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <input
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Tajuk perbincangan (pilihan)"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={() => {
                klik();
                cipta();
              }}
              disabled={sibuk || !nama.trim()}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              {sibuk ? "Sedang proses…" : "Cipta & mulakan"}
            </button>
          </div>

          <div className="liquid-glass space-y-3 rounded-3xl p-5">
            <h2 className="flex items-center gap-2 text-white">
              <DoorOpen size={18} /> Sertai dengan kod
            </h2>
            <input
              value={kodSertai}
              onChange={(e) => setKodSertai(e.target.value)}
              placeholder="cth. abc-defg-hij"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={() => {
                klik();
                sertai();
              }}
              disabled={sibuk || !kodSertai.trim()}
              className="w-full rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              Sertai bilik
            </button>
            <Link
              to="/terbuka"
              onClick={klik}
              className="block rounded-2xl bg-white/5 px-4 py-3 text-center text-sm text-white/80 hover:text-white"
            >
              Atau lawat Ruang Terbuka →
            </Link>
          </div>
        </div>

        {ralat && <p className="mb-4 text-sm text-red-300">⚠️ {ralat}</p>}

        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
          <Users size={16} /> Bilik anda
        </h2>
        {memuat ? (
          <div className="liquid-glass flex items-center gap-2 rounded-3xl p-5 text-sm text-white/70">
            <Loader2 size={16} className="animate-spin" /> Memuatkan…
          </div>
        ) : bilik.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-5 text-sm text-white/70">
            Belum ada bilik. Ciptakan satu atau masukkan kod jemputan.
          </div>
        ) : (
          <div className="grid gap-3">
            {bilik.map((b) => (
              <Link
                key={b.id}
                to="/bicara/$kod"
                params={{ kod: b.kod }}
                onClick={klik}
                className="liquid-glass flex items-center justify-between gap-3 rounded-3xl p-5 transition-transform hover:scale-[1.01]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{b.nama}</p>
                  <p className="truncate text-xs text-white/60">{b.tajuk || "Tiada tajuk"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/70">
                  {b.kod}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs text-white/50">
          <MessagesSquare size={14} className="mt-0.5 shrink-0" />
          Semua mesej ditapis automatik — kata lucah atau sensitif akan ditukar kepada bintang.
        </p>
      </main>
    </div>
  );
}
