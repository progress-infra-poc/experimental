import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reporting/")({
  beforeLoad: () => {
    throw redirect({ to: "/reporting/client/" });
  },
});
