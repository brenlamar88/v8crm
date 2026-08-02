/* ----------------------------------------------------------------------------
   UpdatePassword — shown after arriving from a password-reset email (the auth
   provider flags `recovery`). Sets a new password, then drops into the console.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { BrandMark } from "../components/Brand.tsx";
import { Button } from "../components/primitives.tsx";
import { Field, Input } from "../components/forms.tsx";
import { useAuth } from "../store/auth.tsx";

export function UpdatePassword() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const err = await updatePassword(password);
    setBusy(false);
    if (err) setError(err);
    // On success `recovery` clears and the gate renders the console.
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm animate-fade-rise">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark size={44} />
          <div>
            <h1 className="text-h2 font-semibold">Set a new password</h1>
            <p className="text-body-sm text-text-muted">Choose a new password for your account.</p>
          </div>
        </div>

        <form
          className="panel flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="New password" hint="At least 6 characters.">
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="rounded-md bg-down-soft px-3 py-2 text-body-sm text-down">{error}</div>
          )}

          <Button variant="primary" type="submit" disabled={busy || !password || !confirm}>
            {busy ? "…" : "Update password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-body-sm text-text-muted">
          <button
            onClick={() => void signOut()}
            className="font-semibold text-accent-400 hover:text-accent-200 transition-colors duration-fast"
          >
            Cancel and sign out
          </button>
        </p>
      </div>
    </div>
  );
}
