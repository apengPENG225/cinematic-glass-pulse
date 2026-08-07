import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Check,
  Flame,
  Heart,
  Layers,
  Loader2,
  MessagesSquare,
  Newspaper,
  Pencil,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pastikanProfil, useAuth } from "@/lib/auth";
import { useAudioApp } from "@/lib/audio";

type Statistik = {
  pos: number;
  mesej: number;
  suka: number;
  bilik: number;
  set: number;
  undian: number;
};

const KOSONG: Statistik = { pos: 0, mesej: 0, suka: 0, bilik: 0, set: 0, undian: 0 };

/** Mata Munsi — setiap sumbangan ada beratnya sendiri. */
function kiraMata(s: Statistik) {
  return s.pos * 10 + s.mesej * 2 + s.suka * 5 + s.bilik * 15 + s.set * 20 + s.undian * 12;
}

const PANGKAT = [
  { nama: "Munsi Baharu", min: 0, warna: "text-white/70" },
  { nama: "Munsi Rajin", min: 100, warna: "text-sky-300" },
  { nama: "Munsi Mahir", min: 300, warna: "text-emerald-300" },
  { nama: "Munsi Cendekia", min: 700, warna: "text-amber-300" },
  { nama: "Munsi Agung", min: 1500, warna: "text-fuchsia-300" },
] as const;

function pangkatKini(mata: number) {
  let hasil = PANGKAT[0];
  for (const p of PANGKAT) if (mata >= p.min) hasil = p;
  return hasil;
}

function pangkatSeterusnya(mata: number) {
  return PANGKAT.find((p) => p.min > mata) ?? null;
}

function senaraiLencana(s: Statistik) {
  return [
    { nama: "Hantaran Pertama", nota: "Kongsi 1 hantaran di Feed", capai: s.pos >= 1, icon: Newspaper },
    { nama: "Penulis Aktif", nota: "10 hantaran di Feed", capai: s.pos >= 10, icon: Flame },
    { nama: "Rakan Bicara", nota: "25 mesej dalam bilik", capai: s.mesej >= 25, icon: MessagesSquare },
    { nama: "Disukai Ramai", nota: "20 suka diterima", capai: s.suka >= 20, icon: Heart },
    { nama: "Hos Bilik", nota: "Cipta 1 bilik diskusi", capai: s.bilik >= 1, icon: Users },
    { nama: "Pengumpul Kad", nota: "3 set kad imbas", capai: s.set >= 3, icon: Layers },
    { nama: "Pencetus Undian", nota: "3 undian pantas", capai: s.undian >= 3, icon: Sparkles },
    {
      nama: "Munsi Serba Boleh",
      nota: "Aktif dalam semua ruang",
      capai: s.pos >= 1 && s.mesej >= 1 && s.bilik >= 1 && s.set >= 1 && s.undian >= 1,
      icon: Star,
    },
  ];
}

export default function ProfilMunsi() {
  const { pengguna } = useAuth();
  const { klik } = useAudioApp();
  const [stat, setStat] = useState<Statistik>(KOSONG);
  const [nama, setNama] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [sunting, setSunting] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [simpan, setSimpan] = useState(false);

  const muat = useCallback(async () => {
    if (!pengguna) return;
    const uid = pengguna.id;
    const bil = (r: { count: number | null }) => r.count ?? 0;

    const [profil, pos, mesej, bilik, set, undian, posSaya] = await Promise.all([
      supabase.from("profil").select("nama_paparan, avatar_url").eq("id", uid).maybeSingle(),
      supabase.from("pos").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("mesej").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("bilik").select("id", { count: "exact", head: true }).eq("pemilik", uid),
      supabase.from("set_kad").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("undian").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("pos").select("id").eq("user_id", uid),
    ]);

    let suka = 0;
    const idPos = (posSaya.data ?? []).map((p) => p.id);
    if (idPos.length > 0) {
      const { count } = await supabase
        .from("suka_pos")
        .select("pos_id", { count: "exact", head: true })
        .in("pos_id", idPos);
      suka = count ?? 0;
    }

    setNama(profil.data?.nama_paparan ?? "Pengguna");
    setAvatar(profil.data?.avatar_url ?? null);
    setStat({
      pos: bil(pos),
      mesej: bil(mesej),
      suka,
      bilik: bil(bilik),
      set: bil(set),
      undian: bil(undian),
    });
    setMemuat(false);
  }, [pengguna]);

  useEffect(() => {
    if (pengguna) void pastikanProfil(pengguna).then(muat);
  }, [pengguna, muat]);

  const simpanNama = async () => {
    if (!pengguna || !nama.trim()) return;
    setSimpan(true);
    await supabase.from("profil").update({ nama_paparan: nama.trim() }).eq("id", pengguna.id);
    setSimpan(false);
    setSunting(false);
  };

  const mata = kiraMata(stat);
  const pangkat = pangkatKini(mata);
  const seterusnya = pangkatSeterusnya(mata);
  const lencana = senaraiLencana(stat);
  const dicapai = lencana.filter((l) => l.capai).length;
  const peratus = seterusnya
    ? Math.min(100, Math.round(((mata - pangkat.min) / (seterusnya.min - pangkat.min)) * 100))
    : 100;

  if (memuat) {
    return (
      <div className="liquid-glass flex items-center gap-2 rounded-3xl p-5 text-sm text-white/70">
        <Loader2 size={16} className="animate-spin" /> Memuatkan profil…
      </div>
    );
  }

  const kotak = [
    { label: "Hantaran", nilai: stat.pos, icon: Newspaper },
    { label: "Mesej", nilai: stat.mesej, icon: MessagesSquare },
    { label: "Suka diterima", nilai: stat.suka, icon: Heart },
    { label: "Bilik dicipta", nilai: stat.bilik, icon: Users },
    { label: "Set kad", nilai: stat.set, icon: Layers },
    { label: "Undian", nilai: stat.undian, icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      <div className="liquid-glass rounded-3xl p-5">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={`Avatar ${nama}`}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl text-white">
              {nama.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {sunting ? (
              <div className="flex gap-2">
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-2xl bg-white/10 px-3 py-2 text-base text-white outline-none"
                />
                <button
                  onClick={() => {
                    klik();
                    simpanNama();
                  }}
                  disabled={simpan}
                  aria-label="Simpan nama paparan"
                  className="shrink-0 rounded-full bg-white p-2 text-black disabled:opacity-40"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <p className="flex items-center gap-2 truncate text-lg text-white">
                <span className="truncate">{nama}</span>
                <button
                  onClick={() => {
                    klik();
                    setSunting(true);
                  }}
                  aria-label="Sunting nama paparan"
                  className="shrink-0 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <Pencil size={13} />
                </button>
              </p>
            )}
            <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${pangkat.warna}`}>
              <Award size={14} /> {pangkat.nama} · {mata} mata
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
              style={{ width: `${peratus}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/55">
            {seterusnya
              ? `${seterusnya.min - mata} mata lagi untuk pangkat ${seterusnya.nama}.`
              : "Pangkat tertinggi dicapai — syabas, Munsi Agung!"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kotak.map((k) => (
          <div key={k.label} className="liquid-glass rounded-3xl p-4">
            <k.icon size={16} className="text-white/50" />
            <p className="mt-2 text-2xl text-white">{k.nilai}</p>
            <p className="truncate text-xs text-white/55">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="liquid-glass rounded-3xl p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
          <Award size={16} /> Lencana Munsi · {dicapai}/{lencana.length}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {lencana.map((l) => (
            <div
              key={l.nama}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                l.capai ? "bg-white/12" : "bg-white/5 opacity-55"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  l.capai ? "bg-amber-300/20 text-amber-200" : "bg-white/10 text-white/40"
                }`}
              >
                <l.icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{l.nama}</p>
                <p className="truncate text-xs text-white/50">{l.nota}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
