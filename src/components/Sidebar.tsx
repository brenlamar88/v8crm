/* ----------------------------------------------------------------------------
   Sidebar — the console's primary navigation rail. Grouped nav sections with
   uppercase labels; the active item gets a tinted violet pill and a left
   signal bar. Built on NavLink so routing state drives the active style.
   -------------------------------------------------------------------------- */
import { NavLink } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";
import { useNav } from "../app/nav.tsx";
import { useAuth } from "../store/auth.tsx";
import { BrandMark } from "./Brand.tsx";
import {
  IconOverview,
  IconAccounts,
  IconPipeline,
  IconActivity,
  IconReports,
  IconSystem,
  IconSettings,
} from "./icons.tsx";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  badge?: string;
}

const groups: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: "/", label: "Overview", icon: IconOverview },
      { to: "/accounts", label: "Accounts", icon: IconAccounts, badge: "6" },
      { to: "/pipeline", label: "Pipeline", icon: IconPipeline },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/activity", label: "Activity", icon: IconActivity },
      { to: "/reports", label: "Reports", icon: IconReports, badge: "2" },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/styleguide", label: "Design System", icon: IconSystem },
      { to: "/settings", label: "Settings", icon: IconSettings },
    ],
  },
];

function Item({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-md px-3 h-9 text-body font-medium",
          "transition-[background-color,color] duration-fast ease-out",
          isActive
            ? "bg-accent-soft text-text"
            : "text-text-secondary hover:text-text hover:bg-raised",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-pill bg-accent-400",
              "transition-opacity duration-fast",
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
          <Icon
            className={
              isActive ? "text-accent-400" : "text-text-muted group-hover:text-text-secondary"
            }
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="tabular grid h-5 min-w-5 place-items-center rounded-pill bg-raised px-1.5 text-micro font-semibold text-text-secondary">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { navOpen, setNavOpen } = useNav();
  const { enabled, user, profile, signOut } = useAuth();

  // Signed in → the user's profile name (falls back to email); local demo → the
  // sample principal.
  const email = user?.email ?? "";
  const displayName = (profile?.name?.trim() || email) ?? "";
  const primaryName = enabled && user ? displayName : "Bren Roberts";
  const secondary = enabled && user ? (profile?.role?.trim() || "Signed in") : "Principal · V8";
  const initials =
    enabled && user
      ? (displayName.trim()[0] ?? "?").toUpperCase()
      : "BR";

  return (
    <>
      {/* Scrim behind the mobile drawer. */}
      {navOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-[color:var(--v8-scrim)] backdrop-blur-sm lg:hidden animate-fade-rise"
          style={{ animationDuration: "var(--v8-dur-fast)" }}
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-[color:var(--v8-border)] bg-surface",
          "transition-transform duration-base ease-out lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[color:var(--v8-border)]">
        <BrandMark size={32} />
        <div className="leading-tight">
          <div className="text-body font-semibold">V8 CRM</div>
          <div className="text-micro uppercase tracking-[0.08em] text-text-muted">
            Operating console
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g, i) => (
          <div key={i} className={i > 0 ? "mt-6" : ""}>
            {g.title && <div className="eyebrow px-3 pb-2">{g.title}</div>}
            <div className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <Item key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[color:var(--v8-border)] p-3">
        <div className="flex items-center gap-3 rounded-md px-3 h-12 hover:bg-raised transition-colors duration-fast">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-600 text-label font-bold">
            {enabled && profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-body-sm font-semibold">{primaryName}</div>
            <div className="truncate text-micro text-text-muted">{secondary}</div>
          </div>
          {enabled && user && (
            <button
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-text hover:bg-overlay transition-colors duration-fast"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 12H4M8 8l-4 4 4 4M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}
