/* ----------------------------------------------------------------------------
   Login — the sign-in gate shown when Supabase auth is on and no session
   exists. Email + password, with a toggle to create an account. Built on the
   same tokens and primitives as the console.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { BrandMark } from "../components/Brand.tsx";
import { Button } from "../components/primitives.tsx";
import { Field, Input } from "../components/forms.tsx";
import { useAuth } from "../store/auth.tsx";

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) return;
    setBusy(true);
    const err =
      mode === "in"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === "up") {
      // Sign-up may require email confirmation depending on project settings.
      setNotice("Account created. If confirmation is on, check your email, then sign in.");
      setMode("in");
      setPassword("");
    }
    // On success the auth listener flips the session and the gate renders the app.
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-fade-rise">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark size={44} />
          <div>
            <h1 className="text-h2 font-semibold">V8 CRM</h1>
            <p className="text-body-sm text-text-muted">
              {mode === "in" ? "Sign in to your console" : "Create your console"}
            </p>
          </div>
        </div>

        <form
          className="panel flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Email">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" hint={mode === "up" ? "At least 6 characters." : undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
            />
          </Field>

          {error && (
            <div className="rounded-md bg-down-soft px-3 py-2 text-body-sm text-down">{error}</div>
          )}
          {notice && (
            <div className="rounded-md bg-up-soft px-3 py-2 text-body-sm text-up">{notice}</div>
          )}

          <Button variant="primary" type="submit" disabled={busy || !email.trim() || !password}>
            {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-body-sm text-text-muted">
          {mode === "in" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode((m) => (m === "in" ? "up" : "in"));
              setError(null);
              setNotice(null);
            }}
            className="font-semibold text-accent-400 hover:text-accent-200 transition-colors duration-fast"
          >
            {mode === "in" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
