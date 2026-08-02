/* ----------------------------------------------------------------------------
   AppShell — the console frame: fixed sidebar + a scrolling main column that
   renders the active route. The Topbar lives inside each screen so it can set
   its own title and primary action.
   -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.tsx";
import { NewAccountModal } from "../components/NewAccountModal.tsx";
import { CommandPalette } from "../components/CommandPalette.tsx";

export function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);

  // ⌘K / Ctrl-K toggles the command palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {/* Global "New account" dialog, opened by the topbar action anywhere. */}
      <NewAccountModal />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
