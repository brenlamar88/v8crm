/* ----------------------------------------------------------------------------
   AppShell — the console frame: fixed sidebar + a scrolling main column that
   renders the active route. The Topbar lives inside each screen so it can set
   its own title and primary action.
   -------------------------------------------------------------------------- */
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.tsx";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
