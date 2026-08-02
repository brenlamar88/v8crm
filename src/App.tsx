/* ============================================================================
   V8 CRM — application router. The console shell wraps every route; the design
   system's living style guide lives at /styleguide.
   ========================================================================== */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountsProvider } from "./store/accounts.tsx";
import { AppShell } from "./app/AppShell.tsx";
import { Overview } from "./screens/Overview.tsx";
import { AccountsScreen } from "./screens/AccountsScreen.tsx";
import { AccountDetail } from "./screens/AccountDetail.tsx";
import { Pipeline } from "./screens/Pipeline.tsx";
import { Activity } from "./screens/Activity.tsx";
import { StyleGuide } from "./screens/StyleGuide.tsx";
import { Placeholder } from "./screens/Placeholder.tsx";

export function App() {
  return (
    <BrowserRouter>
      <AccountsProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="accounts" element={<AccountsScreen />} />
          <Route path="accounts/:code" element={<AccountDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="activity" element={<Activity />} />
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
      </AccountsProvider>
    </BrowserRouter>
  );
}
