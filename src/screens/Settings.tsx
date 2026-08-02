/* ----------------------------------------------------------------------------
   Settings — workspace and appearance. The accent picker re-themes the entire
   console live by rewriting the --v8-accent-* tokens, proving the whole app
   colors itself from one place. Also a data-reset for the demo store.
   -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { Topbar } from "../components/Topbar.tsx";
import { Button, Badge } from "../components/primitives.tsx";
import { Field, Input } from "../components/forms.tsx";
import { ACCENTS, applyAccent, applyMode, getSavedAccent, getSavedMode, type Mode } from "../lib/theme.ts";
import { isSupabaseEnabled, uploadAvatar } from "../lib/supabase.ts";
import { useAuth } from "../store/auth.tsx";
import { useToast } from "../components/toast.tsx";
import { useRef } from "react";

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="panel p-6">
      <h3 className="text-h3 font-semibold">{title}</h3>
      <p className="mt-1 text-body-sm text-text-muted">{desc}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Settings() {
  const { enabled, user, profile, saveProfile } = useAuth();
  const toast = useToast();
  const [accent, setAccent] = useState(getSavedAccent());
  const [mode, setMode] = useState<Mode>(getSavedMode());

  const [pName, setPName] = useState("");
  const [pRole, setPRole] = useState("");
  const [pWorkspace, setPWorkspace] = useState("");
  const [pAvatar, setPAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the profile form from the loaded profile (local demo uses the sample).
  useEffect(() => {
    if (enabled && profile) {
      setPName(profile.name);
      setPRole(profile.role);
      setPWorkspace(profile.workspace);
      setPAvatar(profile.avatarUrl);
    } else if (!enabled) {
      setPName("Bren Roberts");
      setPRole("Principal");
      setPWorkspace("V8 Technologies");
      setPAvatar("");
    }
  }, [enabled, profile]);

  function pick(id: string) {
    setAccent(id);
    applyAccent(id, true);
  }

  function pickMode(m: Mode) {
    setMode(m);
    applyMode(m, true);
  }

  async function saveProfileForm() {
    await saveProfile({ name: pName.trim(), role: pRole.trim(), workspace: pWorkspace.trim(), avatarUrl: pAvatar });
    toast("Profile saved");
  }

  async function onPickAvatar(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadAvatar(user.id, file);
    setUploading(false);
    if (!url) {
      toast("Avatar upload failed", "warn");
      return;
    }
    setPAvatar(url);
    // Persist immediately so the avatar sticks even without a full profile save.
    await saveProfile({ name: pName.trim(), role: pRole.trim(), workspace: pWorkspace.trim(), avatarUrl: url });
    toast("Avatar updated");
  }

  function resetData() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("v8crm.accounts");
    window.location.href = "/";
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Workspace & appearance" />
      <div className="px-6 py-6">
        <div className="mx-auto flex max-w-[820px] flex-col gap-4">
          <Card title="Appearance" desc="Theme and signal color. The whole app re-themes instantly from the tokens — nothing is hard-coded.">
            <div className="mb-6">
              <div className="eyebrow mb-3">Theme</div>
              <div className="inline-flex rounded-md border border-[color:var(--v8-border)] bg-sunken p-1">
                {(["dark", "light"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => pickMode(m)}
                    aria-pressed={mode === m}
                    className={[
                      "h-8 min-w-20 rounded-sm px-4 text-label font-semibold capitalize transition-colors duration-fast ease-out",
                      mode === m ? "bg-accent-soft text-accent-200" : "text-text-muted hover:text-text-secondary",
                    ].join(" ")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="eyebrow mb-3">Accent</div>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((a) => {
                const active = a.id === accent;
                return (
                  <button
                    key={a.id}
                    onClick={() => pick(a.id)}
                    className={[
                      "flex items-center gap-3 rounded-md border px-4 h-11 transition-[border-color,background-color] duration-fast ease-out",
                      active
                        ? "border-[color:var(--v8-accent-line)] bg-accent-soft"
                        : "border-[color:var(--v8-border)] bg-surface hover:bg-raised",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ background: a.ramp[500], boxShadow: `0 0 0 3px ${a.ramp[500]}22` }}
                    />
                    <span className={active ? "text-body font-semibold" : "text-body text-text-secondary"}>
                      {a.label}
                    </span>
                    {active && <Badge tone="accent" dot={false}>On</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Profile" desc="How you appear across the console.">
            <div className="mb-5 flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-600 text-h3 font-bold">
                {pAvatar ? (
                  <img src={pAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (pName.trim()[0] ?? "?").toUpperCase()
                )}
              </span>
              <div className="flex flex-col gap-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                />
                <Button
                  variant="subtle"
                  onClick={() => fileRef.current?.click()}
                  disabled={!enabled || uploading}
                >
                  {uploading ? "Uploading…" : "Upload photo"}
                </Button>
                <span className="text-label text-text-muted">
                  {enabled ? "PNG or JPG, square looks best." : "Sign in with Supabase to upload."}
                </span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Role">
                <Input value={pRole} onChange={(e) => setPRole(e.target.value)} placeholder="e.g. Principal" />
              </Field>
              <Field label="Email">
                <Input value={user?.email ?? "bren@v8techco.example"} disabled />
              </Field>
              <Field label="Workspace">
                <Input value={pWorkspace} onChange={(e) => setPWorkspace(e.target.value)} placeholder="e.g. V8 Technologies" />
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {!enabled && (
                <span className="text-label text-text-muted">Sign in with Supabase to save your profile.</span>
              )}
              <Button variant="primary" onClick={saveProfileForm} disabled={!enabled}>Save profile</Button>
            </div>
          </Card>

          <Card title="Data" desc="Where your book is stored and how to reset it.">
            <div className="mb-5 flex items-center gap-3">
              {isSupabaseEnabled ? (
                <>
                  <Badge tone="up">Supabase</Badge>
                  <span className="text-body-sm text-text-muted">
                    Synced to your Postgres database.
                  </span>
                </>
              ) : (
                <>
                  <Badge tone="neutral" dot={false}>Local</Badge>
                  <span className="text-body-sm text-text-muted">
                    Stored in this browser. Connect Supabase to sync.
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-body-sm text-text-muted">
                Clears the local cache and restores the sample accounts.
              </p>
              <Button variant="subtle" onClick={resetData}>Reset local data</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
