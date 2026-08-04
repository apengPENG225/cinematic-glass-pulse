import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/terbuka")({
  beforeLoad: () => {
    throw redirect({ to: "/pentas/feed" });
  },
});
