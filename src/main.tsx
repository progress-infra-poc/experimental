import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const normalizeTrailingSlash = () => {
  const routeMap = ["/reporting/client", "/reporting/inspec", "/reporting/node-management"];
  const pathname = window.location.pathname.replace(/\/$/, "");

  if (routeMap.includes(pathname)) {
    window.history.replaceState(null, "", `${pathname}/` + window.location.search + window.location.hash);
  }
};

normalizeTrailingSlash();

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
