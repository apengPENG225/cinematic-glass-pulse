import { createFileRoute } from "@tanstack/react-router";
import ProfilMunsi from "@/components/pentas/ProfilMunsi";

export const Route = createFileRoute("/_authenticated/pentas/profil")({
  head: () => ({
    meta: [
      { title: "Profil & Lencana Munsi — Pentas Munsi | e-MuNsi" },
      {
        name: "description",
        content:
          "Lihat mata Munsi, pangkat dan lencana pencapaian anda daripada penyertaan dalam feed, bilik diskusi dan kotak alat belajar e-MuNsi.",
      },
      { property: "og:title", content: "Profil & Lencana Munsi — Pentas Munsi | e-MuNsi" },
      {
        property: "og:description",
        content: "Kumpul mata Munsi dan buka lencana pencapaian melalui sumbangan bahasa anda.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilMunsi,
});
