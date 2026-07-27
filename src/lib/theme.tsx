import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeId = "emunsi" | "velorah";

export const TEMA_SENARAI: {
  id: ThemeId;
  nama: string;
  keterangan: string;
}[] = [
  {
    id: "emunsi",
    nama: "Sinar e-MuNsi",
    keterangan:
      "Tema asal — panorama sinematik dengan liquid glass keemasan dan tipografi Instrument Serif.",
  },
  {
    id: "velorah",
    nama: "Velorah Malam Biru",
    keterangan:
      "Tema navy dalam bergaya editorial — hero berpusat, tipografi lapang dan animasi fade-rise.",
  },
];

const STORAGE_KEY = "emunsi-tema";

type ThemeCtx = {
  tema: ThemeId;
  tetapTema: (t: ThemeId) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function applyThemeClass(t: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-emunsi", "theme-velorah");
  root.classList.add(`theme-${t}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<ThemeId>("emunsi");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (stored === "emunsi" || stored === "velorah") {
        setTema(stored);
        applyThemeClass(stored);
        return;
      }
    } catch {
      // ignore
    }
    applyThemeClass("emunsi");
  }, []);

  const tetapTema = useCallback((t: ThemeId) => {
    setTema(t);
    applyThemeClass(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ tema, tetapTema }), [tema, tetapTema]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme mesti digunakan dalam ThemeProvider");
  return ctx;
}
