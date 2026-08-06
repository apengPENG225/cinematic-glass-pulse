import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Briefcase, LogOut, MessagesSquare, Newspaper } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import SiteNav from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { useAudioApp } from "@/lib/audio";

export const Route = createFileRoute("/_authenticated/pentas")({
  component: PentasLayout,
});

const tab = [
  { to: "/pentas/feed", label: "Feed", icon: Newspaper },
  { to: "/pentas/bilik", label: "Bilik", icon: MessagesSquare },
  { to: "/pentas/alat", label: "Kotak Alat", icon: Briefcase },
] as const;


function PentasLayout() {
  const { klik } = useAudioApp();
  const navigate = useNavigate();

  const keluar = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <VideoBackground />
      <SiteNav />
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-4xl text-white md:text-5xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Pentas Munsi
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Satu pentas untuk berkongsi, berbincang dan belajar bahasa Melayu.
            </p>
          </div>
          <button
            onClick={keluar}
            className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 hover:text-white"
          >
            <LogOut size={16} /> Log keluar
          </button>
        </div>

        <div className="liquid-glass mb-6 grid grid-cols-2 gap-1 rounded-full p-1">
          {tab.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              onClick={klik}
              activeProps={{ className: "bg-white text-black" }}
              inactiveProps={{ className: "text-white/70 hover:text-white" }}
              className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <t.icon size={16} /> {t.label}
            </Link>
          ))}
        </div>

        <Outlet />
      </main>
    </div>
  );
}
