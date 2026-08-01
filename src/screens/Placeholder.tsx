/* ----------------------------------------------------------------------------
   Placeholder — an honest empty state for nav destinations not yet built, so
   the shell navigates cleanly without dead ends. Uses the same tokens.
   -------------------------------------------------------------------------- */
import { Topbar } from "../components/Topbar.tsx";

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <>
      <Topbar title={title} />
      <div className="grid place-items-center px-6 py-16">
        <div className="panel flex max-w-md flex-col items-center gap-4 p-10 text-center animate-fade-rise">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-accent-soft text-accent-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </span>
          <div>
            <h2 className="text-h3 font-semibold">{title}</h2>
            <p className="mt-1 text-body text-text-muted">{note}</p>
          </div>
          <span className="eyebrow">Next on the roadmap</span>
        </div>
      </div>
    </>
  );
}
