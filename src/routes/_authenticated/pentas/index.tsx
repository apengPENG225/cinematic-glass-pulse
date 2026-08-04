import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pentas/")({
  beforeLoad: () => {
    throw redirect({ to: "/pentas/feed" });
  },
});
