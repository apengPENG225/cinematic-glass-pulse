import { useRouterState } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import pagi from "@/assets/pagi.mp3.asset.json";
import petang from "@/assets/petang.mp3.asset.json";
import malam from "@/assets/malam.mp3.asset.json";

export type Waktu = "pagi" | "petang" | "malam";

export function waktuSemasa(date = new Date()): Waktu {
  const jam = date.getHours();
  if (jam >= 5 && jam < 12) return "pagi";
  if (jam < 19) return "petang";
  return "malam";
}

const LAGU: Record<Waktu, string> = {
  pagi: pagi.url,
  petang: petang.url,
  malam: malam.url,
};

const STORAGE_KEY = "emunsi-muzik";

type AudioCtx = {
  main: boolean;
  toggle: () => void;
  waktu: Waktu;
  senyapSementara: boolean;
  klik: () => void;
};

const Ctx = createContext<AudioCtx | null>(null);

export function useAudioApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudioApp mesti digunakan dalam AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [main, setMain] = useState(false);
  const [waktu, setWaktu] = useState<Waktu>(() => waktuSemasa());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<AudioContext | null>(null);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const senyapSementara = pathname.startsWith("/kuiz");

  // Ingat pilihan pengguna.
  useEffect(() => {
    setMain(localStorage.getItem(STORAGE_KEY) === "on");
  }, []);

  // Kemas kini waktu setiap minit supaya lagu bertukar mengikut masa peranti.
  useEffect(() => {
    const id = window.setInterval(() => setWaktu(waktuSemasa()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Main / henti mengikut keadaan.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (main && !senyapSementara) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [main, senyapSementara, waktu]);

  const toggle = useCallback(() => {
    setMain((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  const klik = useCallback(() => {
    try {
      if (!sfxRef.current) {
        const AC = window.AudioContext ?? (window as any).webkitAudioContext;
        if (!AC) return;
        sfxRef.current = new AC();
      }
      const ac = sfxRef.current;
      void ac.resume();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ac.currentTime + 0.09);
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.15);
    } catch {
      /* abaikan */
    }
  }, []);

  const value = useMemo(
    () => ({ main, toggle, waktu, senyapSementara, klik }),
    [main, toggle, waktu, senyapSementara, klik],
  );

  return (
    <Ctx.Provider value={value}>
      {/* Satu elemen audio global supaya lagu berterusan merentas semua halaman. */}
      <audio ref={audioRef} src={LAGU[waktu]} loop preload="auto" />
      {children}
    </Ctx.Provider>
  );
}
