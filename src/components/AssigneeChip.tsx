/* ----------------------------------------------------------------------------
   AssigneeChip — a compact initials avatar for the workspace member a task is
   assigned to. Unassigned renders a dashed placeholder. Purely presentational.
   -------------------------------------------------------------------------- */
import { initialsFor } from "../data.ts";

export function AssigneeChip({ email, size = 24 }: { email?: string; size?: number }) {
  const s = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (!email) {
    return (
      <span
        title="Unassigned"
        style={s}
        className="grid shrink-0 place-items-center rounded-full border border-dashed border-[color:var(--v8-border-strong)] text-text-faint"
      >
        <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      </span>
    );
  }
  return (
    <span
      title={email}
      style={s}
      className="grid shrink-0 place-items-center rounded-full bg-accent-600 font-bold text-text"
    >
      {initialsFor(email)}
    </span>
  );
}
