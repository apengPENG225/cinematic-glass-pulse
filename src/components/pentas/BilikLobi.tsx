import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { DoorOpen, Loader2, Lock, MessagesSquare, Plus, ShieldCheck, Unlock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { janaKod } from "@/lib/chat";
import { ralatMesra } from "@/lib/bicara";
import { pastikanProfil, useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";

type Bilik = {
  id: string;
  nama: string;
  tajuk: string | null;
  kod: string;
  pemilik: string;
  ada_kata_laluan: boolean;
};

export default function BilikLobi() {
  const { pengguna } = useAuth();
  const navigate = useNavigate();
  const { klik } = useAudioApp();
  const [bilik, setBilik] = useState<Bilik[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [nama, setNama] = useState("");
  const [tajuk, setTajuk] = useState("");
  const [guncKunci, setGuncKunci] = useState(false);
  const [kataLaluan, setKataLaluan] = useState("");
  const [kodSertai, setKodSertai] = useState("");
  const [kataSertai, setKataSertai] = useState("");
  const [perluKata, setPerluKata] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);

  const muat = useCallback(async () => {
    const { data } = await supabase
      .from("bilik")
      .select("id, nama, tajuk, kod, pemilik, ada_kata_laluan")
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
    if (guncKunci && kataLaluan.trim().length < 4) {
      setRalat("Kata laluan bilik mesti sekurang-kurangnya 4 aksara.");
      return;
    }
    setSibuk(true);
    setRalat(null);
    const kod = janaKod();
    const { data, error } = await supabase.rpc("cipta_bilik", {
      _nama: nama.trim(),
      _tajuk: tajuk.trim() || "",
      _kod: kod,
      _kata_laluan: guncKunci ? kataLaluan.trim() : "",
    });
    setSibuk(false);
    if (error || !data) {
      setRalat(ralatMesra(error?.message ?? "Gagal mencipta bilik."));
      return;
    }
    navigate({ to: "/bicara/$kod", params: { kod: data as string } });
  };

  const semakKunci = async (kod: string) => {
    const { data } = await supabase.rpc("bilik_berkunci", { _kod: kod.trim() });
    setPerluKata(Boolean(data));
  };

  const sertai = async () => {
    const kod = kodSertai.trim().toLowerCase();
    if (!kod) return;
    setSibuk(true);
    setRalat(null);
    const { error } = await supabase.rpc("sertai_bilik", {
      _kod: kod,
      _kata_laluan: kataSertai.trim() || "",
    });
    setSibuk(false);
    if (error) {
      if (error.message.includes("KATA_LALUAN_SALAH")) {
        setPerluKata(true);
        setRalat(kataSertai ? "Kata laluan salah. Cuba lagi." : "Bilik ini berkunci — masukkan kata laluan.");
      } else {
        setRalat("Kod bilik tidak sah.");
      }
      return;
    }
    navigate({ to: "/bicara/$kod", params: { kod } });
  };

  return (
    <div>
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div className="liquid-glass space-y-3 rounded-3xl p-5">
          <h2 className="flex items-center gap-2 text-white">
            <Plus size={18} /> Cipta bilik baharu
          </h2>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama bilik"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
          />
          <input
            value={tajuk}
            onChange={(e) => setTajuk(e.target.value)}
            placeholder="Tajuk perbincangan (pilihan)"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
          />

          <button
            type="button"
            onClick={() => {
              klik();
              setGuncKunci((v) => !v);
            }}
            className="flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-white/80"
          >
            <span className="flex items-center gap-2">
              {guncKunci ? <Lock size={16} /> : <Unlock size={16} />}
              Kunci bilik dengan kata laluan
            </span>
            <span
              className={`relative h-6 w-11 rounded-full transition-colors ${guncKunci ? "bg-emerald-400/80" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${guncKunci ? "left-[1.4rem]" : "left-0.5"}`}
              />
            </span>
          </button>
          {guncKunci && (
            <input
              value={kataLaluan}
              onChange={(e) => setKataLaluan(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Kata laluan bilik (min. 4 aksara)"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
            />
          )}

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
            onBlur={(e) => e.target.value.trim() && semakKunci(e.target.value)}
            placeholder="cth. abc-defg-hij"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 font-mono text-base text-white outline-none placeholder:text-white/40"
          />
          {perluKata && (
            <input
              value={kataSertai}
              onChange={(e) => setKataSertai(e.target.value)}
              type="password"
              autoComplete="off"
              placeholder="Kata laluan bilik"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-white/40"
            />
          )}
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
            to="/pentas/feed"
            onClick={klik}
            className="block rounded-2xl bg-white/5 px-4 py-3 text-center text-sm text-white/80 hover:text-white"
          >
            Atau lihat Feed Utama →
          </Link>
        </div>
      </div>

      {ralat && <p className="mb-4 text-sm text-red-300">⚠️ {ralat}</p>}

      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
        <Users size={16} /> Bilik saya
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
                <p className="flex items-center gap-2 truncate font-medium text-white">
                  {b.ada_kata_laluan && <Lock size={14} className="shrink-0 text-emerald-300" />}
                  {b.nama}
                </p>
                <p className="truncate text-xs text-white/60">{b.tajuk || "Tiada tajuk"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/70">
                {b.kod}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="liquid-glass mt-6 space-y-2 rounded-3xl p-5 text-xs text-white/60">
        <p className="flex items-start gap-2">
          <MessagesSquare size={14} className="mt-0.5 shrink-0" />
          Semua mesej ditapis automatik — kata lucah atau sensitif ditukar kepada bintang.
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Had anti-spam: 5 mesej / 10 saat, 25 mesej / minit, dan kuota 20 gambar sehari.
        </p>
      </div>
    </div>
  );
}
