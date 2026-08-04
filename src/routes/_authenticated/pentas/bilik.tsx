import { createFileRoute } from "@tanstack/react-router";
import BilikLobi from "@/components/pentas/BilikLobi";

export const Route = createFileRoute("/_authenticated/pentas/bilik")({
  head: () => ({
    meta: [
      { title: "Bilik Diskusi — Pentas Munsi | e-MuNsi" },
      {
        name: "description",
        content:
          "Cipta atau sertai bilik diskusi bahasa Melayu berkod dan berkunci untuk sesi ulang kaji berkumpulan.",
      },
      { property: "og:title", content: "Bilik Diskusi — Pentas Munsi | e-MuNsi" },
      {
        property: "og:description",
        content: "Bilik perbincangan masa nyata yang selamat dengan kod jemputan dan kata laluan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BilikLobi,
});
