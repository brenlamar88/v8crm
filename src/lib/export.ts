/* ----------------------------------------------------------------------------
   CSV export — turn the book into a downloadable file, entirely client-side.
   Values are quote-escaped so commas and quotes in names survive.
   -------------------------------------------------------------------------- */
import type { Account } from "../data.ts";

const COLUMNS: { header: string; value: (a: Account) => string | number }[] = [
  { header: "Code", value: (a) => a.code },
  { header: "Name", value: (a) => a.name },
  { header: "Vertical", value: (a) => a.vertical },
  { header: "Stage", value: (a) => a.stage },
  { header: "MRR", value: (a) => a.mrr },
  { header: "Health", value: (a) => a.health },
  { header: "Owner", value: (a) => a.owner },
  { header: "Started", value: (a) => a.started },
  { header: "Renewal", value: (a) => a.renewal },
];

function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function accountsToCsv(accounts: Account[]): string {
  const head = COLUMNS.map((c) => c.header).join(",");
  const rows = accounts.map((a) => COLUMNS.map((c) => cell(c.value(a))).join(","));
  return [head, ...rows].join("\n");
}

/** Trigger a browser download of the given text as a file. */
export function downloadText(filename: string, text: string, type = "text/csv"): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
