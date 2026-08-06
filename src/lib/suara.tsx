import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Bar Suara Langsung — WebRTC mesh dengan isyarat (signalling) melalui Supabase Realtime.
 * Direka ringan untuk telefon: audio sahaja, echo cancellation & noise suppression dihidupkan.
 */

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type PesertaSuara = {
  user_id: string;
  nama: string;
  bercakap: boolean;
  bisu: boolean;
  saya: boolean;
};

type Isyarat = {
  dari: string;
  kepada: string;
  sdp?: RTCSessionDescriptionInit;
  ais?: RTCIceCandidateInit;
};

export function useSuara(bilikId: string | null, userId: string | null, nama: string) {
  const [aktif, setAktif] = useState(false);
  const [menyambung, setMenyambung] = useState(false);
  const [bisu, setBisu] = useState(false);
  const [peserta, setPeserta] = useState<PesertaSuara[]>([]);
  const [ralat, setRalat] = useState<string | null>(null);

  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analisisRef = useRef<Map<string, () => number>>(new Map());
  const ctxRef = useRef<AudioContext | null>(null);
  const namaRef = useRef<Map<string, string>>(new Map());
  const rafRef = useRef<number | null>(null);

  /** Cipta pengesan aras bunyi bagi sesuatu strim. */
  const pasangAnalisis = useCallback((kunci: string, strim: MediaStream) => {
    try {
      const AC: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctxRef.current) ctxRef.current = new AC();
      const ctx = ctxRef.current;
      const src = ctx.createMediaStreamSource(strim);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      analisisRef.current.set(kunci, () => {
        an.getByteTimeDomainData(buf);
        let jum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i]! - 128) / 128;
          jum += v * v;
        }
        return Math.sqrt(jum / buf.length);
      });
    } catch {
      /* pengesan bunyi tidak kritikal */
    }
  }, []);

  const tutupSemua = useCallback(() => {
    pcRef.current.forEach((pc) => pc.close());
    pcRef.current.clear();
    audioRef.current.forEach((a) => {
      a.pause();
      a.srcObject = null;
    });
    audioRef.current.clear();
    analisisRef.current.clear();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (chRef.current) supabase.removeChannel(chRef.current);
    chRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPeserta([]);
  }, []);

  const buatPc = useCallback(
    (rakan: string, memulakan: boolean) => {
      const sedia = pcRef.current.get(rakan);
      if (sedia) return sedia;

      const pc = new RTCPeerConnection(ICE);
      pcRef.current.set(rakan, pc);
      streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        void chRef.current?.send({
          type: "broadcast",
          event: "ais",
          payload: { dari: userId, kepada: rakan, ais: e.candidate.toJSON() } satisfies Isyarat,
        });
      };

      pc.ontrack = (e) => {
        const strim = e.streams[0];
        if (!strim) return;
        let el = audioRef.current.get(rakan);
        if (!el) {
          el = new Audio();
          el.autoplay = true;
          (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
          audioRef.current.set(rakan, el);
        }
        el.srcObject = strim;
        void el.play().catch(() => {});
        pasangAnalisis(rakan, strim);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          pc.close();
          pcRef.current.delete(rakan);
        }
      };

      if (memulakan) {
        void (async () => {
          const tawaran = await pc.createOffer();
          await pc.setLocalDescription(tawaran);
          void chRef.current?.send({
            type: "broadcast",
            event: "tawaran",
            payload: { dari: userId, kepada: rakan, sdp: tawaran } satisfies Isyarat,
          });
        })();
      }

      return pc;
    },
    [userId, pasangAnalisis],
  );

  /** Sertai bar suara. */
  const sertai = useCallback(async () => {
    if (!bilikId || !userId || aktif || menyambung) return;
    setRalat(null);
    setMenyambung(true);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch {
      setMenyambung(false);
      setRalat("Tidak dapat mengakses mikrofon. Sila benarkan kebenaran mikrofon pada pelayar anda.");
      return;
    }
    pasangAnalisis(userId, streamRef.current);
    namaRef.current.set(userId, nama);

    const ch = supabase.channel(`suara-${bilikId}`, {
      config: { presence: { key: userId } },
    });
    chRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ user_id: string; nama: string; bisu: boolean }>();
      const senarai = Object.values(state).flat();
      const unik = new Map(senarai.map((p) => [p.user_id, p]));
      unik.forEach((p) => namaRef.current.set(p.user_id, p.nama));

      // Sambung kepada rakan baharu; ID lebih kecil yang memulakan tawaran.
      unik.forEach((p) => {
        if (p.user_id === userId) return;
        if (pcRef.current.has(p.user_id)) return;
        buatPc(p.user_id, userId < p.user_id);
      });
      // Tutup sambungan yang sudah keluar.
      pcRef.current.forEach((pc, id) => {
        if (!unik.has(id)) {
          pc.close();
          pcRef.current.delete(id);
          audioRef.current.get(id)?.pause();
          audioRef.current.delete(id);
          analisisRef.current.delete(id);
        }
      });

      setPeserta(
        [...unik.values()].map((p) => ({
          user_id: p.user_id,
          nama: p.nama,
          bisu: p.bisu,
          bercakap: false,
          saya: p.user_id === userId,
        })),
      );
    });

    ch.on("broadcast", { event: "tawaran" }, async ({ payload }) => {
      const p = payload as Isyarat;
      if (p.kepada !== userId || !p.sdp) return;
      const pc = buatPc(p.dari, false);
      await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
      const jawapan = await pc.createAnswer();
      await pc.setLocalDescription(jawapan);
      void ch.send({
        type: "broadcast",
        event: "jawapan",
        payload: { dari: userId, kepada: p.dari, sdp: jawapan } satisfies Isyarat,
      });
    });

    ch.on("broadcast", { event: "jawapan" }, async ({ payload }) => {
      const p = payload as Isyarat;
      if (p.kepada !== userId || !p.sdp) return;
      const pc = pcRef.current.get(p.dari);
      if (!pc || pc.signalingState === "stable") return;
      await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
    });

    ch.on("broadcast", { event: "ais" }, async ({ payload }) => {
      const p = payload as Isyarat;
      if (p.kepada !== userId || !p.ais) return;
      const pc = pcRef.current.get(p.dari);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(p.ais));
      } catch {
        /* calon lewat — abaikan */
      }
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void ch.track({ user_id: userId, nama, bisu: false });
        setMenyambung(false);
        setAktif(true);
      }
    });
  }, [bilikId, userId, nama, aktif, menyambung, buatPc, pasangAnalisis]);

  const keluar = useCallback(() => {
    tutupSemua();
    setAktif(false);
    setBisu(false);
  }, [tutupSemua]);

  const togolBisu = useCallback(() => {
    const baru = !bisu;
    setBisu(baru);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !baru));
    if (userId) void chRef.current?.track({ user_id: userId, nama, bisu: baru });
  }, [bisu, userId, nama]);

  // Gelung pengesan "sedang bercakap".
  useEffect(() => {
    if (!aktif) return;
    let hidup = true;
    const tik = () => {
      if (!hidup) return;
      setPeserta((lama) =>
        lama.map((p) => {
          const baca = analisisRef.current.get(p.user_id);
          const aras = baca ? baca() : 0;
          const bercakap = !p.bisu && aras > 0.045;
          return bercakap === p.bercakap ? p : { ...p, bercakap };
        }),
      );
      rafRef.current = requestAnimationFrame(tik);
    };
    rafRef.current = requestAnimationFrame(tik);
    return () => {
      hidup = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [aktif]);

  // Bersihkan apabila keluar dari bilik.
  useEffect(() => () => tutupSemua(), [tutupSemua]);

  return { aktif, menyambung, bisu, peserta, ralat, sertai, keluar, togolBisu };
}
