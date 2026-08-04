import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/bicara/")({
  beforeLoad: () => {
    throw redirect({ to: "/pentas/bilik" });
  },
});
