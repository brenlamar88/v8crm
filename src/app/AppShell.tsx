/* ----------------------------------------------------------------------------
   AppShell — the console frame: fixed sidebar + a scrolling main column that
   renders the active route. The Topbar lives inside each screen so it can set
   its own title and primary action.
   -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.tsx";
import { NewAccountModal } from "../components/NewAccountModal.tsx";
import { CommandPalette } from "../components/CommandPalette.tsx";
import { NavContext } from "./nav.tsx";

export function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

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

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <NavContext.Provider value={{ navOpen, setNavOpen }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        {/* Global "New account" dialog, opened by the topbar action anywhere. */}
        <NewAccountModal />
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>
    </NavContext.Provider>
  );
}
