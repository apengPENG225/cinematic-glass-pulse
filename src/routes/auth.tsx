import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, Mail } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { pastikanProfil, useAuth } from "@/lib/auth";

type Cari = { seterusnya?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Cari => ({
    seterusnya: typeof s["seterusnya"] === "string" ? (s["seterusnya"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Daftar Masuk — Ruang Bicara | e-MuNsi" },
      {
        name: "description",
        content:
          "Daftar masuk dengan akaun Google untuk menyertai Ruang Bicara e-MuNsi dan berkongsi tips bahasa Melayu.",
      },
      { property: "og:title", content: "Daftar Masuk — Ruang Bicara | e-MuNsi" },
      {
        property: "og:description",
        content: "Log masuk untuk berbincang kesalahan bahasa dan berkongsi tips bersama pelajar lain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

function laluanSelamat(nilai: string | undefined) {
  if (!nilai || !nilai.startsWith("/") || nilai.startsWith("//")) return "/bicara";
  return nilai;
}

function Auth() {
  const { seterusnya } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { pengguna, memuat } = useAuth();
  const [emel, setEmel] = useState("");
  const [kata, setKata] = useState("");
  const [mod, setMod] = useState<"masuk" | "daftar">("masuk");
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState<string | null>(null);
  const [nota, setNota] = useState<string | null>(null);

  useEffect(() => {
    if (!pengguna) return;
    const simpan =
      typeof window !== "undefined" ? sessionStorage.getItem("emunsi-seterusnya") : null;
    const tuju = laluanSelamat(seterusnya ?? simpan ?? undefined);
    pastikanProfil(pengguna).finally(() => {
      if (typeof window !== "undefined") sessionStorage.removeItem("emunsi-seterusnya");
      navigate({ to: tuju });
    });
  }, [pengguna, navigate, seterusnya]);

  const google = async () => {
    setRalat(null);
    setSibuk(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("emunsi-seterusnya", laluanSelamat(seterusnya));
      }
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (res.error) setRalat("Gagal daftar masuk Google. Cuba lagi.");
    } finally {
      setSibuk(false);
    }
  };

  const emelMasuk = async () => {
    setRalat(null);
    setNota(null);
    setSibuk(true);
    try {
      if (mod === "masuk") {
        const { error } = await supabase.auth.signInWithPassword({ email: emel, password: kata });
        if (error) setRalat(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email: emel,
          password: kata,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) setRalat(error.message);
        else setNota("Pendaftaran berjaya. Semak e-mel anda untuk pengesahan jika diminta.");
      }
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-6 pb-16">
        <h1
          className="mb-2 text-4xl text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Daftar Masuk
        </h1>
        <p className="mb-6 text-sm text-white/70">
          Ruang Bicara hanya untuk pengguna berdaftar supaya perbincangan lebih selamat dan sopan.
        </p>

        <div className="liquid-glass space-y-4 rounded-3xl p-6">
          <button
            type="button"
            onClick={google}
            disabled={sibuk || memuat}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {sibuk ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Teruskan dengan Google
          </button>

          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/15" /> atau e-mel{" "}
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <input
            value={emel}
            onChange={(e) => setEmel(e.target.value)}
            type="email"
            placeholder="E-mel"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
          <input
            value={kata}
            onChange={(e) => setKata(e.target.value)}
            type="password"
            placeholder="Kata laluan"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={emelMasuk}
            disabled={sibuk || !emel || !kata}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            <Mail size={16} /> {mod === "masuk" ? "Log masuk" : "Daftar akaun"}
          </button>
          <button
            type="button"
            onClick={() => setMod(mod === "masuk" ? "daftar" : "masuk")}
            className="w-full text-xs text-white/60 hover:text-white"
          >
            {mod === "masuk" ? "Belum ada akaun? Daftar di sini" : "Sudah ada akaun? Log masuk"}
          </button>

          {ralat && <p className="text-sm text-red-300">⚠️ {ralat}</p>}
          {nota && <p className="text-sm text-emerald-300">{nota}</p>}
        </div>
      </main>
    </div>
  );
}
