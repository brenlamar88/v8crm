import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { applyAccent, applyMode, getSavedAccent, getSavedMode } from "./lib/theme.ts";
import "./index.css";

// Apply the saved theme (light/dark) and accent before the first render.
applyMode(getSavedMode());
applyAccent(getSavedAccent());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
