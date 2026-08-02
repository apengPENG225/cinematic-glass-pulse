import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "chat-media";

/** Muat naik gambar ke folder pengguna. Pulangkan laluan storan. */
export async function muatNaikImej(file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const laluan = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(laluan, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return laluan;
}

export function janaKod() {
  const abj = "abcdefghijkmnopqrstuvwxyz";
  const blok = (n: number) =>
    Array.from({ length: n }, () => abj[Math.floor(Math.random() * abj.length)]).join("");
  return `${blok(3)}-${blok(4)}-${blok(3)}`;
}

export function masaRingkas(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });
}

/** Gambar dalam storan peribadi — jana pautan bertandatangan. */
export function ImejChat({ laluan, alt }: { laluan: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let hidup = true;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(laluan, 60 * 60 * 24)
      .then(({ data }) => {
        if (hidup) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      hidup = false;
    };
  }, [laluan]);

  if (!url) {
    return <div className="h-40 w-40 animate-pulse rounded-2xl bg-white/10" />;
  }
  return <img src={url} alt={alt} loading="lazy" className="max-h-72 w-auto rounded-2xl" />;
}
