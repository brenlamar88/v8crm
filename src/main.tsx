import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { applyAccent, getSavedAccent } from "./lib/theme.ts";
import "./index.css";

// Re-theme the console to the saved accent before the first render.
applyAccent(getSavedAccent());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
