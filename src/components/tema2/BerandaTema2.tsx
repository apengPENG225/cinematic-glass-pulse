import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Instagram, Linkedin, Twitter, Music, VolumeX } from "lucide-react";
import { useAudioApp } from "@/lib/audio";
import { moduls } from "@/lib/modul-data";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4";
const MISI_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_132944_a0d124bb-eaa1-4082-aa30-2310efb42b4b.mp4";
const SOLUSI_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_125119_8e5ae31c-0021-4396-bc08-f7aebeb877a2.mp4";
const CTA_HLS = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

const fadeUp = (delay: number) =>
  ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }) as const;

function Lingkaran({ luar, dalam }: { luar: string; dalam: string }) {
  return (
    <span
      className={`${luar} rounded-full border-2 border-foreground/60 flex items-center justify-center`}
    >
      <span className={`${dalam} rounded-full border border-foreground/60`} />
    </span>
  );
}

function PerkataanSkrol({
  teks,
  serlah,
  progress,
  mula,
  tamat,
  className,
}: {
  teks: string;
  serlah: string[];
  progress: MotionValue<number>;
  mula: number;
  tamat: number;
  className: string;
}) {
  const kata = teks.split(" ");
  return (
    <p className={className}>
      {kata.map((w, i) => (
        <Kata
          key={`${w}-${i}`}
          kata={w}
          penting={serlah.includes(w.replace(/[.,—]/g, ""))}
          progress={progress}
          from={mula + ((tamat - mula) * i) / kata.length}
          to={mula + ((tamat - mula) * (i + 1)) / kata.length}
        />
      ))}
    </p>
  );
}

function Kata({
  kata,
  penting,
  progress,
  from,
  to,
}: {
  kata: string;
  penting: boolean;
  progress: MotionValue<number>;
  from: number;
  to: number;
}) {
  const opacity = useTransform(progress, [from, to], [0.15, 1]);
  return (
    <motion.span
      style={{ opacity, color: penting ? "hsl(var(--foreground))" : "hsl(var(--hero-subtitle))" }}
      className="inline-block mr-[0.28em]"
    >
      {kata}
    </motion.span>
  );
}

function CtaVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let hls: { destroy: () => void } | null = null;
    let batal = false;
    void (async () => {
      const { default: Hls } = await import("hls.js");
      if (batal || !ref.current) return;
      if (Hls.isSupported()) {
        const inst = new Hls();
        inst.loadSource(CTA_HLS);
        inst.attachMedia(ref.current);
        hls = inst;
      } else if (ref.current.canPlayType("application/vnd.apple.mpegurl")) {
        ref.current.src = CTA_HLS;
      }
      void ref.current.play().catch(() => {});
    })();
    return () => {
      batal = true;
      hls?.destroy();
    };
  }, []);
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover z-0"
      muted
      loop
      playsInline
      autoPlay
      aria-hidden="true"
    />
  );
}

const ciri = [
  { t: "Kamera Peka", d: "Muat naik gambar, AI kesan kesalahan bahasa dalam sekelip mata." },
  { t: "Pembetulan Sahih", d: "Setiap pembetulan disertakan pautan rujukan hidup ke PRPM (DBP)." },
  { t: "Tiga Modul", d: "Fonologi, Morfologi dan Sintaksis dengan contoh media cetak & elektronik." },
  { t: "Alat Anotasi", d: "Pen penyerlah dan pemadam pada setiap slaid untuk pembelajaran aktif." },
];

export default function BerandaTema2() {
  const { klik, main, toggle } = useAudioApp();
  const misiRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: misiRef,
    offset: ["start end", "end start"],
  });

  return (
    <div className="tema-mono min-h-screen bg-background text-foreground font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 md:px-28 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" onClick={klik} className="flex items-center gap-3 font-bold">
            <Lingkaran luar="w-7 h-7" dalam="w-3 h-3" />
            e-MuNsi
          </Link>
          <div className="hidden md:flex items-center gap-3 text-sm">
            <Link to="/" onClick={klik} className="text-muted-foreground hover:text-foreground">
              Utama
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/kamera"
              onClick={klik}
              className="text-muted-foreground hover:text-foreground"
            >
              Kamera Peka
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/modul" onClick={klik} className="text-muted-foreground hover:text-foreground">
              Modul
            </Link>
            <span className="text-muted-foreground">•</span>
            <a href="#tentang" onClick={klik} className="text-muted-foreground hover:text-foreground">
              Tentang
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              klik();
              toggle();
            }}
            aria-pressed={main}
            aria-label={main ? "Matikan muzik latar" : "Hidupkan muzik latar"}
            className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-foreground"
          >
            {main ? <Music size={16} /> : <VolumeX size={16} />}
          </button>
          {[Instagram, Linkedin, Twitter].map((Ikon, i) => (
            <span
              key={i}
              className="liquid-glass w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-foreground"
            >
              <Ikon size={16} />
            </span>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          muted
          loop
          autoPlay
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/45" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center px-6 pt-28 md:pt-32">
          <motion.div
            {...fadeUp(0)}
            className="flex items-center justify-center gap-3 mb-6 text-muted-foreground text-sm"
          >
            <div className="flex -space-x-2">
              {["F", "M", "S"].map((h) => (
                <span
                  key={h}
                  className="w-8 h-8 rounded-full border-2 border-background bg-secondary text-secondary-foreground text-xs flex items-center justify-center"
                >
                  {h}
                </span>
              ))}
            </div>
            Tiga modul bahasa Melayu dalam satu platform
          </motion.div>
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] mb-6"
          >
            Imbas Kesalahan{" "}
            <span className="font-serif italic font-normal">Bahasa</span>
          </motion.h1>
          <motion.p
            {...fadeUp(0.2)}
            className="text-lg max-w-2xl mx-auto mb-8"
            style={{ color: "hsl(var(--hero-subtitle))" }}
          >
            Muat naik gambar papan tanda, iklan atau petikan akhbar — Kamera Peka AI mengenal pasti
            kesalahan bahasa dan memberi pembetulan berserta rujukan PRPM.
          </motion.p>
          <motion.div
            {...fadeUp(0.3)}
            className="liquid-glass rounded-full p-2 max-w-lg mx-auto flex items-center gap-2"
          >
            <Link
              to="/modul"
              onClick={klik}
              className="flex-1 text-center text-sm text-muted-foreground hover:text-foreground px-4 py-3"
            >
              Terokai Modul
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/kamera"
                onClick={klik}
                className="block bg-foreground text-background rounded-full px-8 py-3 text-sm font-medium"
              >
                IMBAS
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bahasa berubah */}
      <section id="tentang" className="px-8 md:px-28 pt-52 md:pt-64 pb-6 md:pb-9 text-center">
        <motion.h2
          {...fadeUp(0)}
          className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] mb-6"
        >
          Bahasa kita <span className="font-serif italic">berubah.</span> Anda?
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-24">
          Kesalahan bahasa berlegar di papan tanda, iklan dan media sosial setiap hari. e-MuNsi
          membantu anda mengesan, memahami dan membetulkannya.
        </motion.p>
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-20">
          {moduls.map((m, i) => (
            <motion.div key={m.slug} {...fadeUp(0.1 * i)}>
              <Link to="/modul/$slug" params={{ slug: m.slug }} onClick={klik} className="block">
                <div className="liquid-glass w-[200px] h-[200px] rounded-3xl mx-auto mb-6 flex items-center justify-center text-6xl">
                  {m.emoji}
                </div>
                <h3 className="font-semibold text-base mb-2">{m.nama}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">{m.ringkas}</p>
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm text-center">
          Jika kita tidak membetulkannya, kesalahan itu akan terus disalin orang lain.
        </p>
      </section>

      {/* Misi */}
      <section ref={misiRef} className="px-8 md:px-28 pt-0 pb-32 md:pb-44">
        <video
          className="w-full max-w-[800px] aspect-square object-cover mx-auto"
          src={MISI_VIDEO}
          muted
          loop
          autoPlay
          playsInline
          aria-hidden="true"
        />
        <div className="max-w-4xl mx-auto">
          <PerkataanSkrol
            teks="Kami membina ruang di mana keingintahuan bertemu kejelasan — tempat pelajar menemui kedalaman, guru menemui jangkauan, dan setiap kesalahan bahasa menjadi peluang belajar."
            serlah={["keingintahuan", "bertemu", "kejelasan"]}
            progress={scrollYProgress}
            mula={0.1}
            tamat={0.55}
            className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-[-1px]"
          />
          <PerkataanSkrol
            teks="Satu platform di mana kandungan, komuniti dan wawasan mengalir bersama — kurang bunyi bising, kurang halangan, lebih banyak makna."
            serlah={[]}
            progress={scrollYProgress}
            mula={0.5}
            tamat={0.85}
            className="text-xl md:text-2xl lg:text-3xl font-medium mt-10"
          />
        </div>
      </section>

      {/* Solusi */}
      <section className="px-8 md:px-28 py-32 md:py-44 border-t border-border/30">
        <motion.p
          {...fadeUp(0)}
          className="text-xs tracking-[3px] uppercase text-muted-foreground mb-4"
        >
          Solusi
        </motion.p>
        <motion.h2 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-medium mb-12">
          Platform untuk bahasa yang <span className="font-serif italic">bermakna</span>
        </motion.h2>
        <motion.video
          {...fadeUp(0.15)}
          className="w-full rounded-2xl aspect-[3/1] object-cover mb-16"
          src={SOLUSI_VIDEO}
          muted
          loop
          autoPlay
          playsInline
          aria-hidden="true"
        />
        <div className="grid md:grid-cols-4 gap-8">
          {ciri.map((c, i) => (
            <motion.div key={c.t} {...fadeUp(0.08 * i)}>
              <h3 className="font-semibold text-base mb-2">{c.t}</h3>
              <p className="text-muted-foreground text-sm">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-8 md:px-28 py-32 md:py-44 border-t border-border/30 overflow-hidden">
        <CtaVideo />
        <div className="absolute inset-0 bg-background/45 z-[1]" />
        <div className="relative z-10 text-center flex flex-col items-center">
          <Lingkaran luar="w-10 h-10" dalam="w-5 h-5" />
          <h2 className="text-4xl md:text-6xl font-medium mt-6 mb-4">
            Mulakan <span className="font-serif italic">Perjalanan</span> Anda
          </h2>
          <p className="text-muted-foreground max-w-xl mb-8">
            Imbas gambar pertama anda atau terus belajar melalui tiga modul kesalahan bahasa Melayu.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/kamera"
              onClick={klik}
              className="bg-foreground text-background rounded-lg px-8 py-3.5 text-sm font-medium"
            >
              Buka Kamera Peka
            </Link>
            <Link
              to="/modul"
              onClick={klik}
              className="liquid-glass rounded-lg px-8 py-3.5 text-sm font-medium text-foreground"
            >
              Mula Belajar
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 px-8 md:px-28 flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">© 2026 e-MuNsi. Hak cipta terpelihara.</p>
        <div className="flex gap-6">
          {["Privasi", "Terma", "Hubungi"].map((t) => (
            <span key={t} className="text-muted-foreground text-sm hover:text-foreground">
              {t}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
