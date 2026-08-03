import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Had tempatan (cermin kepada had pangkalan data) supaya UI boleh beri amaran awal. */
export const HAD = {
  mesejPer10s: 5,
  mesejSeminit: 25,
  imejSehari: 20,
  saizImejMaks: 5 * 1024 * 1024,
  panjangMesej: 1000,
};

export type SebabLapor =
  | "Kata kesat / lucah"
  | "Spam atau iklan"
  | "Buli atau ugutan"
  | "Kandungan sensitif"
  | "Maklumat bahasa yang salah"
  | "Lain-lain";

export const SEBAB_LAPOR: SebabLapor[] = [
  "Kata kesat / lucah",
  "Spam atau iklan",
  "Buli atau ugutan",
  "Kandungan sensitif",
  "Maklumat bahasa yang salah",
  "Lain-lain",
];

/** Penapis sisi klien: beri amaran sebelum hantar (pangkalan data tetap menapis). */
export function mesejRingkasSah(teks: string, adaFail: boolean) {
  const t = teks.trim();
  if (!t && !adaFail) return "Tulis sesuatu dahulu.";
  if (t.length > HAD.panjangMesej) return `Mesej terlalu panjang (maks ${HAD.panjangMesej} aksara).`;
  return null;
}

export function failImejSah(f: File) {
  if (!f.type.startsWith("image/")) return "Hanya fail gambar dibenarkan.";
  if (f.size > HAD.saizImejMaks) return "Saiz gambar melebihi 5 MB. Sila pilih gambar lebih kecil.";
  return null;
}

/** Pengehad kadar sisi klien — elak spam tap berulang pada telefon. */
export function useHadKadar() {
  const cap = useRef<number[]>([]);
  return useMemo(
    () => ({
      semak() {
        const kini = Date.now();
        cap.current = cap.current.filter((t) => kini - t < 60_000);
        const dlm10 = cap.current.filter((t) => kini - t < 10_000).length;
        if (dlm10 >= HAD.mesejPer10s) return "Perlahan sedikit — tunggu beberapa saat sebelum menghantar lagi.";
        if (cap.current.length >= HAD.mesejSeminit) return "Had 25 mesej seminit dicapai. Rehat sebentar ya.";
        return null;
      },
      rekod() {
        cap.current.push(Date.now());
      },
    }),
    [],
  );
}

export type Kehadiran = { user_id: string; nama: string; menaip: boolean };

/** Kehadiran + indikator menaip melalui Realtime Presence & Broadcast. */
export function useKehadiran(bilikId: string | null, userId: string | null, nama: string) {
  const [hadir, setHadir] = useState<Kehadiran[]>([]);
  const [menaip, setMenaip] = useState<Record<string, string>>({});
  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const masaRef = useRef(0);

  useEffect(() => {
    if (!bilikId || !userId) return;
    const ch = supabase.channel(`hadir-${bilikId}`, { config: { presence: { key: userId } } });
    chRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ user_id: string; nama: string }>();
      const senarai: Kehadiran[] = Object.values(state)
        .flat()
        .map((p) => ({ user_id: p.user_id, nama: p.nama, menaip: false }));
      const unik = new Map(senarai.map((s) => [s.user_id, s]));
      setHadir([...unik.values()]);
    });

    ch.on("broadcast", { event: "menaip" }, ({ payload }) => {
      const p = payload as { user_id: string; nama: string };
      if (p.user_id === userId) return;
      setMenaip((m) => ({ ...m, [p.user_id]: p.nama }));
      setTimeout(() => {
        setMenaip((m) => {
          const baru = { ...m };
          delete baru[p.user_id];
          return baru;
        });
      }, 3000);
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") void ch.track({ user_id: userId, nama });
    });

    return () => {
      supabase.removeChannel(ch);
      chRef.current = null;
    };
  }, [bilikId, userId, nama]);

  const hantarMenaip = () => {
    const kini = Date.now();
    if (kini - masaRef.current < 1500) return;
    masaRef.current = kini;
    void chRef.current?.send({
      type: "broadcast",
      event: "menaip",
      payload: { user_id: userId, nama },
    });
  };

  return { hadir, menaip: Object.values(menaip), hantarMenaip };
}

export function ralatMesra(mesej: string) {
  if (mesej.includes("KATA_LALUAN_SALAH")) return "Kata laluan bilik salah.";
  if (/duplicate key/i.test(mesej)) return "Anda sudah melaporkan mesej ini.";
  if (/row-level security|permission/i.test(mesej)) return "Anda tiada kebenaran untuk tindakan ini.";
  return mesej.replace(/^.*?:\s*/, "");
}
