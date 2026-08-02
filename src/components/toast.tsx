/* ----------------------------------------------------------------------------
   Toasts — brief, self-dismissing confirmations. A provider holds the queue and
   renders the stack bottom-right; useToast() gives any component a push(). Each
   toast fades-rise in and auto-dismisses. Tones reuse the status tokens.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "info" | "warn";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

const toneMeta: Record<ToastTone, { color: string; glyph: string }> = {
  success: { color: "var(--v8-up)", glyph: "M5 10.5l3.5 3.5L15 6.5" },
  info: { color: "var(--v8-info)", glyph: "M10 9v5M10 6h.01" },
  warn: { color: "var(--v8-warn)", glyph: "M10 3l8 14H2zM10 8v4M10 15h.01" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, tone, message }]);
      window.setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const meta = toneMeta[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[color:var(--v8-border-strong)] bg-overlay px-4 py-3 shadow-lg animate-fade-rise"
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{ color: meta.color, background: "var(--v8-surface-raised)" }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={meta.glyph} />
                </svg>
              </span>
              <span className="flex-1 text-body-sm text-text">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="grid h-6 w-6 place-items-center rounded-sm text-text-muted hover:text-text hover:bg-raised transition-colors duration-fast"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string, tone?: ToastTone) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
