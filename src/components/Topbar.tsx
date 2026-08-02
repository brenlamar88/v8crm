/* ----------------------------------------------------------------------------
   Topbar — page context on the left, global search + actions on the right.
   The search field expands its ring on focus; icon buttons wash on hover.
   -------------------------------------------------------------------------- */
import type { ReactNode } from "react";
import { Button } from "./primitives.tsx";
import { SearchBox } from "./SearchBox.tsx";
import { IconBell, IconPlus } from "./icons.tsx";
import { useNav } from "../app/nav.tsx";

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
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { setNavOpen } = useNav();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[color:var(--v8-border)] bg-[color:var(--v8-glass)] px-4 sm:px-6 h-16 backdrop-blur">
      <button
        aria-label="Open navigation"
        onClick={() => setNavOpen(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-secondary hover:text-text hover:bg-raised transition-colors duration-fast lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-h3 font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-body-sm text-text-muted">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SearchBox />
        <IconButton label="Notifications">
          <IconBell />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-400" />
        </IconButton>
        {action && (
          <Button variant="primary" onClick={onAction} icon={<IconPlus width={16} height={16} />}>
            {action}
          </Button>
        )}
      </div>
    </header>
  );
}
