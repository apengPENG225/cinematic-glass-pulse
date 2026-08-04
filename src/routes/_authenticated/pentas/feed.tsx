import { createFileRoute } from "@tanstack/react-router";
import FeedUtama from "@/components/pentas/FeedUtama";

export const Route = createFileRoute("/_authenticated/pentas/feed")({
  head: () => ({
    meta: [
      { title: "Feed Utama — Pentas Munsi | e-MuNsi" },
      {
        name: "description",
        content:
          "Feed terbuka Pentas Munsi untuk berkongsi tips, nota dan infografik bahasa Melayu dengan penapisan kandungan automatik.",
      },
      { property: "og:title", content: "Feed Utama — Pentas Munsi | e-MuNsi" },
      {
        property: "og:description",
        content: "Kongsi tips bahasa Melayu, suka dan balas hantaran komuniti e-MuNsi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedUtama,
});
