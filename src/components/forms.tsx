/* ----------------------------------------------------------------------------
   Form primitives — the input layer of the design system. All share one field
   frame: a hairline surface that shifts its border to the accent on focus,
   using the token motion. Labels and hints come from <Field>.
   -------------------------------------------------------------------------- */
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const control =
  "w-full rounded-md border border-[color:var(--v8-border)] bg-surface px-3 text-body text-text " +
  "placeholder:text-text-muted outline-none transition-colors duration-fast ease-out " +
  "focus:border-accent hover:border-strong";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-label font-semibold text-text-secondary">{label}</span>
      {children}
      {hint && <span className="text-label text-text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} h-9 ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${control} py-2 min-h-20 resize-y leading-normal ${props.className ?? ""}`}
    />
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${control} h-9 appearance-none pr-9 ${props.className ?? ""}`}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
