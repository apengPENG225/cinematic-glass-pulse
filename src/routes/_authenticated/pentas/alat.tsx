import { createFileRoute } from "@tanstack/react-router";
import KotakAlat from "@/components/pentas/KotakAlat";

export const Route = createFileRoute("/_authenticated/pentas/alat")({
  head: () => ({
    meta: [
      { title: "Kotak Alat Belajar — Pentas Munsi | e-MuNsi" },
      {
        name: "description",
        content:
          "Kad imbas dan undian pantas bahasa Melayu di Pentas Munsi — belajar tatabahasa bersama komuniti secara masa nyata.",
      },
      { property: "og:title", content: "Kotak Alat Belajar — Pentas Munsi | e-MuNsi" },
      {
        property: "og:description",
        content: "Cipta kad imbas dan undian tatabahasa untuk komuniti e-MuNsi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KotakAlat,
});
