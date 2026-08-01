/* ============================================================================
   V8 CRM — application router. The console shell wraps every route; the design
   system's living style guide lives at /styleguide.
   ========================================================================== */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./app/AppShell.tsx";
import { Overview } from "./screens/Overview.tsx";
import { AccountsScreen } from "./screens/AccountsScreen.tsx";
import { StyleGuide } from "./screens/StyleGuide.tsx";
import { Placeholder } from "./screens/Placeholder.tsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="accounts" element={<AccountsScreen />} />
          <Route
            path="pipeline"
            element={<Placeholder title="Pipeline" note="A stage-by-stage board for deals in flight, built on the same cards and tokens." />}
          />
          <Route
            path="activity"
            element={<Placeholder title="Activity" note="A unified timeline of touches across every account." />}
          />
          <Route
            path="reports"
            element={<Placeholder title="Reports" note="Saved views and exports over your book of engagements." />}
          />
          <Route
            path="settings"
            element={<Placeholder title="Settings" note="Workspace, team, and integration configuration." />}
          />
          <Route path="styleguide" element={<StyleGuide />} />
          <Route
            path="*"
            element={<Placeholder title="Not found" note="That route doesn't exist yet." />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
