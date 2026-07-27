import { Link } from "@tanstack/react-router";
import { useAudioApp } from "@/lib/audio";

const VELORAH_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export default function VelorahHero() {
  const { klik } = useAudioApp();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={VELORAH_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-background/40 z-0" aria-hidden="true" />

      <nav className="relative z-10 flex flex-row justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <Link
          to="/"
          onClick={klik}
          className="text-3xl tracking-tight text-foreground"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Velorah<sup className="text-xs">®</sup>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            onClick={klik}
            className="text-sm text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            to="/kamera"
            onClick={klik}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Studio
          </Link>
          <Link
            to="/"
            hash="tentang"
            onClick={klik}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/modul"
            onClick={klik}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Journal
          </Link>
          <Link
            to="/tetapan"
            onClick={klik}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reach Us
          </Link>
        </div>
        <Link
          to="/kamera"
          onClick={klik}
          className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] transition-transform"
        >
          Begin Journey
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px]">
        <h1
          className="animate-fade-rise text-5xl sm:text-7xl md:text-8xl leading-[0.95] max-w-7xl font-normal text-foreground"
          style={{
            fontFamily: "'Instrument Serif', serif",
            letterSpacing: "-2.46px",
          }}
        >
          Where <em className="not-italic text-muted-foreground">dreams</em> rise{" "}
          <em className="not-italic text-muted-foreground">through the silence.</em>
        </h1>
        <p className="animate-fade-rise-delay text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed">
          We&apos;re designing tools for deep thinkers, bold creators, and quiet rebels. Amid the
          chaos, we build digital spaces for sharp focus and inspired work.
        </p>
        <Link
          to="/kamera"
          onClick={klik}
          className="animate-fade-rise-delay-2 liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 hover:scale-[1.03] transition-transform cursor-pointer"
        >
          Begin Journey
        </Link>

        <div
          id="tentang"
          className="mt-20 grid gap-4 sm:grid-cols-2 max-w-3xl w-full text-left scroll-mt-24"
        >
          <div className="liquid-glass rounded-3xl p-6">
            <h2 className="text-foreground text-base font-medium mb-1">Kamera Peka</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chatbot yang membaca gambar anda, memetik teks, dan menerangkan setiap kesalahan
              bahasa beserta pembetulan.
            </p>
          </div>
          <div className="liquid-glass rounded-3xl p-6">
            <h2 className="text-foreground text-base font-medium mb-1">Tiga Modul</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Koleksi contoh kesalahan media cetak dan elektronik, dengan pen penyerlah, pemadam
              serta navigasi seterusnya dan kembali.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
