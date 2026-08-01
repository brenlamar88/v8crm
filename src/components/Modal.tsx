/* ----------------------------------------------------------------------------
   Modal — a centered dialog over a dimmed, blurred canvas. Closes on Escape or
   overlay click; the panel fades and rises in on the token motion. Focus moves
   into the panel on open. Body scroll is locked while it's open.
   -------------------------------------------------------------------------- */
import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-[color:var(--v8-bg-sunken)]/70 backdrop-blur-sm animate-fade-rise"
        style={{ animationDuration: "var(--v8-dur-fast)" }}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-xl border border-[color:var(--v8-border-strong)] bg-surface shadow-lg outline-none animate-fade-rise"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-h3 font-semibold">{title}</h2>
            {description && <p className="mt-1 text-body-sm text-text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors duration-fast"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-[color:var(--v8-border)] px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
