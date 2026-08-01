/* ----------------------------------------------------------------------------
   Timeline — a vertical activity feed. Each event has a kind that sets the
   marker color and glyph; a hairline rail connects them. Entries fade-rise in
   sequence using the token motion.
   -------------------------------------------------------------------------- */
import type { TimelineEvent, TimelineKind } from "../data.ts";

const kindMeta: Record<TimelineKind, { tint: string; glyph: string }> = {
  note: { tint: "var(--v8-text-muted)", glyph: "M4 4h12v9l-4 4H4z M12 17v-4h4" },
  call: { tint: "var(--v8-accent-400)", glyph: "M5 4h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2z" },
  email: { tint: "var(--v8-info)", glyph: "M3 6h14v10H3z M3 6l7 5 7-5" },
  ship: { tint: "var(--v8-up)", glyph: "M4 11l6-7 6 7-6 3z M4 11l6 3 6-3M10 14v4" },
  risk: { tint: "var(--v8-down)", glyph: "M10 3l8 14H2z M10 8v4M10 15h.01" },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative flex flex-col">
      {events.map((e, i) => {
        const meta = kindMeta[e.kind];
        const last = i === events.length - 1;
        return (
          <li
            key={i}
            className="relative flex gap-4 pb-6 last:pb-0 animate-fade-rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {!last && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[color:var(--v8-border)]" />
            )}
            <span
              className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:var(--v8-border-strong)] bg-surface"
              style={{ color: meta.tint }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={meta.glyph} />
              </svg>
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-body text-text">{e.text}</p>
              <p className="eyebrow mt-1 normal-case tracking-normal text-text-muted">{e.when}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
