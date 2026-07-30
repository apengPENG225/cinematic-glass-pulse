import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tema = {
  id: string;
  nama: string;
  huraian: string;
  /** Warna contoh untuk butang pemilih. */
  swatch: [string, string, string];
};

export const TEMA_SENARAI: Tema[] = [
  {
    id: "sinematik",
    nama: "Sinematik Malam",
    huraian: "Video latar asal, gelap dan bersinar",
    swatch: ["#0b0b0f", "#1c2233", "#6b7a99"],
  },
  {
    id: "ufuk-senja",
    nama: "Ufuk Senja",
    huraian: "Jingga senja dengan garis ufuk",
    swatch: ["#2a1020", "#a13a2f", "#f0a35e"],
  },
  {
    id: "laut-dalam",
    nama: "Laut Dalam",
    huraian: "Biru laut dengan gelombang perlahan",
    swatch: ["#04121f", "#0b3a5b", "#4fd1c5"],
  },
  {
    id: "rimba-zamrud",
    nama: "Rimba Zamrud",
    huraian: "Hijau rimba dan tompok cahaya",
    swatch: ["#04140d", "#0f3d2a", "#5ce09b"],
  },
  {
    id: "batik-nusantara",
    nama: "Batik Nusantara",
    huraian: "Corak batik berulang, emas gangsa",
    swatch: ["#1a0f08", "#5c2f16", "#e0a95c"],
  },
  {
    id: "songket-diraja",
    nama: "Songket Diraja",
    huraian: "Ungu diraja bersulam benang emas",
    swatch: ["#170a24", "#3d1a63", "#e8c46a"],
  },
  {
    id: "pasir-gurun",
    nama: "Pasir Gurun",
    huraian: "Pasir hangat dengan alun bukit",
    swatch: ["#241608", "#8a5a2b", "#e8c79a"],
  },
  {
    id: "sakura-fajar",
    nama: "Sakura Fajar",
    huraian: "Merah jambu lembut waktu fajar",
    swatch: ["#2a1220", "#8a3a5c", "#f7b8cf"],
  },
  {
    id: "nebula-ungu",
    nama: "Nebula Ungu",
    huraian: "Bintang dan kabus angkasa",
    swatch: ["#0a0618", "#3a1a6b", "#a78bfa"],
  },
  {
    id: "neon-kota",
    nama: "Neon Kota",
    huraian: "Grid neon bandar waktu malam",
    swatch: ["#07040f", "#2b0b3a", "#22d3ee"],
  },
  {
    id: "salji-utara",
    nama: "Salji Utara",
    huraian: "Biru ais sejuk dan hening",
    swatch: ["#0a1420", "#1e3a52", "#bfe6ff"],
  },
  {
    id: "kopi-petang",
    nama: "Kopi Petang",
    huraian: "Coklat suam, tenang dan mesra",
    swatch: ["#170f0a", "#4a2f1f", "#d9a86c"],
  },
];

const SIMPAN = "emunsi-tema";
const SAH = new Set(TEMA_SENARAI.map((t) => t.id));

type Ctx = {
  tema: string;
  setTema: (id: string) => void;
  senarai: Tema[];
};

const TemaCtx = createContext<Ctx | null>(null);

export function useTema() {
  const ctx = useContext(TemaCtx);
  if (!ctx) throw new Error("useTema mesti digunakan dalam TemaProvider");
  return ctx;
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState("sinematik");

  useEffect(() => {
    const simpan = localStorage.getItem(SIMPAN);
    if (simpan && SAH.has(simpan)) setTemaState(simpan);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
  }, [tema]);

  const setTema = useCallback((id: string) => {
    if (!SAH.has(id)) return;
    setTemaState(id);
    try {
      localStorage.setItem(SIMPAN, id);
    } catch {
      /* abaikan */
    }
  }, []);

  const value = useMemo(() => ({ tema, setTema, senarai: TEMA_SENARAI }), [tema, setTema]);

  return <TemaCtx.Provider value={value}>{children}</TemaCtx.Provider>;
}
