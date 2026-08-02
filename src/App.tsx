/* ============================================================================
   V8 CRM — application router. Auth gates the console when Supabase is on;
   otherwise it runs open (local demo). The shell wraps every route; the design
   system's living style guide lives at /styleguide.
   ========================================================================== */
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountsProvider } from "./store/accounts.tsx";
import { TimeProvider } from "./store/time.tsx";
import { WorkspaceProvider, useWorkspace } from "./store/workspace.tsx";
import { AuthProvider, useAuth } from "./store/auth.tsx";
import { ToastProvider } from "./components/toast.tsx";
import { BrandMark } from "./components/Brand.tsx";
import { AppShell } from "./app/AppShell.tsx";
import { Login } from "./screens/Login.tsx";
import { UpdatePassword } from "./screens/UpdatePassword.tsx";
import { Overview } from "./screens/Overview.tsx";
import { AccountsScreen } from "./screens/AccountsScreen.tsx";
import { AccountDetail } from "./screens/AccountDetail.tsx";
import { Pipeline } from "./screens/Pipeline.tsx";
import { Tasks } from "./screens/Tasks.tsx";
import { Time } from "./screens/Time.tsx";
import { Delivery } from "./screens/Delivery.tsx";
import { Activity } from "./screens/Activity.tsx";
import { Reports } from "./screens/Reports.tsx";
import { Settings } from "./screens/Settings.tsx";
import { StyleGuide } from "./screens/StyleGuide.tsx";
import { Placeholder } from "./screens/Placeholder.tsx";

/* Holds the console until the workspace context has resolved (which team am I
   in?), so AccountsProvider mounts with a workspace to scope to. When Supabase
   is off, WorkspaceProvider reports `loading=false` immediately and this is a
   pass-through. */
function WorkspaceBoundary({ children }: { children: ReactNode }) {
  const { enabled, loading } = useWorkspace();
  if (enabled && loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="animate-fade-rise opacity-80">
          <BrandMark size={44} />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function ConsoleRoutes() {
  return (
    <WorkspaceProvider>
      <WorkspaceBoundary>
        <AccountsProvider>
          <TimeProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Overview />} />
                <Route path="accounts" element={<AccountsScreen />} />
                <Route path="accounts/:code" element={<AccountDetail />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="time" element={<Time />} />
                <Route path="delivery" element={<Delivery />} />
                <Route path="activity" element={<Activity />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="styleguide" element={<StyleGuide />} />
                <Route
                  path="*"
                  element={<Placeholder title="Not found" note="That route doesn't exist yet." />}
                />
              </Route>
            </Routes>
          </TimeProvider>
        </AccountsProvider>
      </WorkspaceBoundary>
    </WorkspaceProvider>
  );
}

/* Decides what to render: a brief loading state while the session resolves, the
   Login screen when auth is on and nobody's signed in, else the console. When
   Supabase is off, `enabled` is false and it always renders the console. */
function AuthGate() {
  const { enabled, user, loading, recovery } = useAuth();

  if (enabled && loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="animate-fade-rise opacity-80">
          <BrandMark size={44} />
        </div>
      </div>
    );
  }

  // Arrived from a reset email → set a new password before anything else.
  if (enabled && recovery) return <UpdatePassword />;

  if (enabled && !user) return <Login />;

  return <ConsoleRoutes />;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
