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
import { useAccounts } from "../store/accounts.tsx";

/** True when focus is in a field or editable region — suppress bare-key shortcuts. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const { openNewAccount } = useAccounts();

  // Global keyboard shortcuts: ⌘K/Ctrl-K toggles the palette; a bare "n" opens
  // New account (ignored while typing or with a modifier held).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (
        e.key.toLowerCase() === "n" &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !isTyping(e.target)
      ) {
        e.preventDefault();
        openNewAccount();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openNewAccount]);

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
