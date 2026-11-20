import React from "react";

import "./styles.css";

import { QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import App from "./App";
import { DialogProvider } from "./components/dialog/DialogProvider";
import { queryClient } from "./queryClient";

const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <DialogProvider>
        <App />
      </DialogProvider>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
