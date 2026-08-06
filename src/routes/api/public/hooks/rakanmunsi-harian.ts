import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/rakanmunsi-harian")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { janaPosHarianRakanMunsi } = await import("@/lib/rakanmunsi.server");
          const hasil = await janaPosHarianRakanMunsi(false);
          return Response.json({ ok: true, ...hasil });
        } catch (e) {
          const mesej = e instanceof Error ? e.message : "Ralat tidak diketahui";
          console.error("RakanMunsi harian gagal:", mesej);
          return Response.json({ ok: false, error: mesej }, { status: 500 });
        }
      },
    },
  },
});
