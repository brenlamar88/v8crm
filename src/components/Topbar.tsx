/* ----------------------------------------------------------------------------
   Topbar — page context on the left, global search + actions on the right.
   The search field expands its ring on focus; icon buttons wash on hover.
   -------------------------------------------------------------------------- */
import type { ReactNode } from "react";
import { Button } from "./primitives.tsx";
import { IconSearch, IconBell, IconPlus } from "./icons.tsx";

function IconButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="relative grid h-9 w-9 place-items-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors duration-fast ease-out"
    >
      {children}
    </button>
  );
}

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[color:var(--v8-border)] bg-base/80 px-6 h-16 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-h3 font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-body-sm text-text-muted">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="hidden md:flex items-center gap-2 rounded-md border border-[color:var(--v8-border)] bg-surface px-3 h-9 w-64 text-text-muted focus-within:border-accent focus-within:text-text-secondary transition-colors duration-fast">
          <IconSearch width={16} height={16} />
          <input
            className="w-full bg-transparent text-body text-text placeholder:text-text-muted outline-none"
            placeholder="Search accounts, deals…"
          />
        </label>
        <IconButton label="Notifications">
          <IconBell />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-400" />
        </IconButton>
        {action && (
          <Button variant="primary" icon={<IconPlus width={16} height={16} />}>
            {action}
          </Button>
        )}
      </div>
    </header>
  );
}
