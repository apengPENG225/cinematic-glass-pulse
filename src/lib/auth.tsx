import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [sesi, setSesi] = useState<Session | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSesi(s);
      setMemuat(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSesi(data.session);
      setMemuat(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { sesi, pengguna: sesi?.user ?? null, memuat };
}

/** Pastikan baris profil wujud untuk pengguna log masuk. */
export async function pastikanProfil(user: User) {
  const nama =
    (user.user_metadata?.["full_name"] as string) ||
    (user.user_metadata?.["name"] as string) ||
    user.email?.split("@")[0] ||
    "Pengguna";
  const avatar = (user.user_metadata?.["avatar_url"] as string) ?? null;
  await supabase
    .from("profil")
    .upsert({ id: user.id, nama_paparan: nama, avatar_url: avatar }, { onConflict: "id" });
}
