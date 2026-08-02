/* ----------------------------------------------------------------------------
   Sample data for the showcase. V8 Technologies builds and runs production
   systems for operators in unglamorous verticals — behavioral health networks,
   nonprofits, regional service companies. These accounts are fictional and
   generic on purpose: the design system is what's on display, not a client.
   -------------------------------------------------------------------------- */

export type EngagementStage = "Discovery" | "Proposal" | "Build" | "Retainer" | "At Risk";

export type TimelineKind = "note" | "call" | "email" | "ship" | "risk";

export interface TimelineEvent {
  when: string;
  kind: TimelineKind;
  text: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due: string; // legacy free-form label, e.g. "Fri" or "" — kept for old rows
  dueDate?: string; // ISO date "YYYY-MM-DD" when set with the date picker
  assignee?: string; // workspace member email the task is assigned to, or unset
}

/* Per-engagement delivery metrics — DORA four keys + AI quality + service
   signals. All optional; an engagement only reports what applies. */
export interface Delivery {
  deploysPerWeek?: number;
  leadTimeHours?: number; // commit → production
  changeFailurePct?: number; // 0–100
  mttrHours?: number; // time to restore service
  taskSuccessPct?: number; // AI task success 0–100
  hallucinationPct?: number; // 0–100
  p95ms?: number; // p95 latency
  costPerTask?: number; // USD per AI task/request
  uptimePct?: number; // 0–100
  openBugs?: number;
}

export interface Account {
  name: string;
  code: string;
  vertical: string;
  stage: EngagementStage;
  mrr: number;
  health: number; // 0–100
  owner: string;
  trend: number[];
  // Richer fields backing the account detail record.
  started: string;
  renewal: string;
  summary: string;
  nextStep: string;
  contacts: Contact[];
  timeline: TimelineEvent[];
  tasks: Task[];
  delivery?: Delivery;
}

/** Look up a single account by its code (used by the detail route). */
export function accountByCode(code: string): Account | undefined {
  return accounts.find((a) => a.code === code);
}

/** Approximate minutes-ago from a relative label ("just now", "2d ago",
    "1w ago", "3h ago"). Used only to order the cross-account activity feed —
    lower is more recent. Unknown labels sort oldest. */
export function agoMinutes(when: string): number {
  const w = when.trim().toLowerCase();
  if (w === "just now") return 0;
  const m = w.match(/^(\d+)\s*([mhdw])\b/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = Number(m[1]);
  const unit = { m: 1, h: 60, d: 1440, w: 10080 }[m[2]] ?? 1;
  return n * unit;
}

/* --- Task due dates -------------------------------------------------------- */

export type DueStatus = "overdue" | "today" | "soon" | "upcoming" | "none";

/** Local midnight for a date, so comparisons ignore the time of day. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days between two dates (b - a), by local calendar day. Negative when
    b is before a. */
function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/** Parse an ISO "YYYY-MM-DD" as a local date (not UTC, so it doesn't shift a
    day in western timezones). Returns null for anything unparseable. */
export function parseDueDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Classify a task's due date relative to today. "soon" is within 3 days.
    Undated (or legacy free-form) tasks are "none". */
export function dueStatus(task: Pick<Task, "dueDate">, now: Date = new Date()): DueStatus {
  const d = parseDueDate(task.dueDate);
  if (!d) return "none";
  const delta = dayDiff(now, d);
  if (delta < 0) return "overdue";
  if (delta === 0) return "today";
  if (delta <= 3) return "soon";
  return "upcoming";
}

/** Short human label for a due date: "3d overdue", "Today", "Tomorrow",
    "in 4d", else an absolute "Aug 12". Falls back to the legacy free-form
    label when there's no real date. */
export function dueLabel(task: Pick<Task, "dueDate" | "due">, now: Date = new Date()): string {
  const d = parseDueDate(task.dueDate);
  if (!d) return task.due ?? "";
  const delta = dayDiff(now, d);
  if (delta < 0) return `${Math.abs(delta)}d overdue`;
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta <= 6) return `in ${delta}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Sort key for due dates: earliest first, undated last. */
export function dueSortKey(task: Pick<Task, "dueDate">): number {
  const d = parseDueDate(task.dueDate);
  return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
}

/** Up-to-two-letter initials from an email or name, for assignee avatars.
    "ada.lovelace@x.com" → "AL"; "bren@x.com" → "B". */
export function initialsFor(who: string): string {
  const local = who.split("@")[0] ?? who;
  const parts = local.split(/[.\-_+\s]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.slice(0, 1) ?? "?");
  return letters.toUpperCase();
}

/** ISO "YYYY-MM-DD" for a date `days` from today — lets the sample tasks below
    stay a realistic overdue/today/soon spread whenever the demo is opened. */
function isoIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Stages in board order, with the tint used across the console. */
export const pipelineStages: { stage: EngagementStage; tint: string }[] = [
  { stage: "Discovery", tint: "var(--v8-text-muted)" },
  { stage: "Proposal", tint: "var(--v8-accent-400)" },
  { stage: "Build", tint: "var(--v8-accent-500)" },
  { stage: "Retainer", tint: "var(--v8-up)" },
  { stage: "At Risk", tint: "var(--v8-down)" },
];

export const accounts: Account[] = [
  {
    name: "Cypress Behavioral Network",
    code: "V8-2041",
    vertical: "Behavioral Health",
    stage: "Retainer",
    mrr: 14200,
    health: 92,
    owner: "BR",
    trend: [8, 9, 11, 10, 12, 14, 13, 15, 16, 18],
    started: "Mar 2024",
    renewal: "Mar 2026",
    summary:
      "Operations platform and M365 estate across a multi-site network. On a managed retainer with steady month-over-month expansion.",
    nextStep: "Q3 roadmap review — scope incident-reporting module.",
    contacts: [
      { name: "Dana Whitfield", role: "COO", email: "dana@cypressbn.example" },
      { name: "Marcus Reed", role: "IT Lead", email: "marcus@cypressbn.example" },
    ],
    timeline: [
      { when: "2d ago", kind: "ship", text: "Shipped v2 of the census dashboard to production." },
      { when: "1w ago", kind: "call", text: "Monthly ops review — flagged appetite for reporting module." },
      { when: "3w ago", kind: "email", text: "Sent Q3 roadmap draft for sign-off." },
    ],
    tasks: [
      { id: "t-2041-1", title: "Scope the incident-reporting module", done: false, due: "", dueDate: isoIn(-2) },
      { id: "t-2041-2", title: "Send Q3 roadmap for sign-off", done: true, due: "" },
    ],
    delivery: { deploysPerWeek: 9, leadTimeHours: 6, changeFailurePct: 4, mttrHours: 0.5, taskSuccessPct: 97, hallucinationPct: 0.3, p95ms: 780, costPerTask: 0.014, uptimePct: 99.98, openBugs: 3 },
  },
  {
    name: "Bayou Recovery Partners",
    code: "V8-2038",
    vertical: "Behavioral Health",
    stage: "Build",
    mrr: 9800,
    health: 78,
    owner: "BR",
    trend: [4, 5, 5, 7, 6, 8, 9, 9, 11, 12],
    started: "Jun 2025",
    renewal: "—",
    summary:
      "Build phase on an intake and scheduling system replacing a manual paper process. First module targeted for staged rollout.",
    nextStep: "Ship intake module to pilot facility; confirm training dates.",
    contacts: [{ name: "Priya Nadeau", role: "Clinical Director", email: "priya@bayourp.example" }],
    timeline: [
      { when: "1d ago", kind: "note", text: "Pilot facility confirmed for staged rollout next week." },
      { when: "4d ago", kind: "ship", text: "Intake form flows passed QA." },
      { when: "2w ago", kind: "call", text: "Kickoff for build phase 2." },
    ],
    tasks: [],
    delivery: { deploysPerWeek: 3, leadTimeHours: 30, changeFailurePct: 18, mttrHours: 5, taskSuccessPct: 89, hallucinationPct: 1.4, p95ms: 2200, costPerTask: 0.031, uptimePct: 99.4, openBugs: 12 },
  },
  {
    name: "Acadiana Services Group",
    code: "V8-2033",
    vertical: "Field Operations",
    stage: "Proposal",
    mrr: 0,
    health: 64,
    owner: "BR",
    trend: [3, 3, 4, 3, 5, 4, 6, 5, 6, 7],
    started: "—",
    renewal: "—",
    summary:
      "Proposal out for a dispatch and work-order platform to replace spreadsheets across regional field crews.",
    nextStep: "Follow up on proposal; pricing question outstanding.",
    contacts: [{ name: "Cole Bergeron", role: "Owner", email: "cole@acadianasg.example" }],
    timeline: [
      { when: "3d ago", kind: "email", text: "Answered pricing questions on the dispatch proposal." },
      { when: "1w ago", kind: "call", text: "Scoping call — walked through current spreadsheet process." },
    ],
    tasks: [],
  },
  {
    name: "Delta Wildlife Association",
    code: "V8-2029",
    vertical: "Nonprofit",
    stage: "Retainer",
    mrr: 6400,
    health: 88,
    owner: "BR",
    trend: [6, 6, 7, 8, 7, 9, 9, 10, 10, 11],
    started: "Sep 2024",
    renewal: "Sep 2025",
    summary:
      "Membership and events platform on a light managed retainer. Stable, low-touch, renews in the fall.",
    nextStep: "Send renewal packet; propose donations module.",
    contacts: [{ name: "Renee Guidry", role: "Executive Director", email: "renee@deltawa.example" }],
    timeline: [
      { when: "5d ago", kind: "note", text: "Renewal window opens next month — prep packet." },
      { when: "3w ago", kind: "ship", text: "Deployed event registration improvements." },
    ],
    tasks: [],
    delivery: { deploysPerWeek: 5, leadTimeHours: 18, changeFailurePct: 10, mttrHours: 2, taskSuccessPct: 94, hallucinationPct: 0.8, p95ms: 1400, costPerTask: 0.02, uptimePct: 99.9, openBugs: 6 },
  },
  {
    name: "Gulf Coast Care Collective",
    code: "V8-2024",
    vertical: "Behavioral Health",
    stage: "At Risk",
    mrr: 5200,
    health: 41,
    owner: "BR",
    trend: [12, 11, 11, 9, 8, 8, 6, 5, 5, 4],
    started: "Jan 2024",
    renewal: "Jan 2026",
    summary:
      "Retainer at risk — usage has fallen and a key champion left. Needs a save plan before the renewal conversation.",
    nextStep: "Book an exec check-in; rebuild the champion relationship.",
    contacts: [{ name: "Alex Fontaine", role: "Interim Ops Manager", email: "alex@gulfcoastcc.example" }],
    timeline: [
      { when: "1d ago", kind: "risk", text: "Health dropped below 45 — usage down third week running." },
      { when: "2w ago", kind: "email", text: "No reply on last two check-in emails." },
      { when: "5w ago", kind: "note", text: "Champion (former ops lead) departed the org." },
    ],
    tasks: [
      { id: "t-2024-1", title: "Book an exec check-in", done: false, due: "", dueDate: isoIn(0) },
      { id: "t-2024-2", title: "Draft a save plan before renewal", done: false, due: "", dueDate: isoIn(2) },
    ],
    delivery: { deploysPerWeek: 0.5, leadTimeHours: 240, changeFailurePct: 34, mttrHours: 30, taskSuccessPct: 79, hallucinationPct: 3.2, p95ms: 4200, costPerTask: 0.06, uptimePct: 98.5, openBugs: 21 },
  },
  {
    name: "Teche Logistics Co.",
    code: "V8-2019",
    vertical: "Field Operations",
    stage: "Discovery",
    mrr: 0,
    health: 55,
    owner: "BR",
    trend: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
    started: "—",
    renewal: "—",
    summary:
      "Early discovery on a routing and driver-log system. Qualifying fit and budget before proposing.",
    nextStep: "Run discovery workshop; map the current dispatch flow.",
    contacts: [{ name: "Sam Thibodeaux", role: "Operations Manager", email: "sam@techelog.example" }],
    timeline: [
      { when: "6d ago", kind: "call", text: "Intro call — outlined routing pain points." },
      { when: "2w ago", kind: "note", text: "Inbound from referral; qualified as a fit." },
    ],
    tasks: [],
  },
];

// A smooth-ish intraday-style series for the hero chart.
export const revenueSeries: number[] = [
  22, 24, 23, 27, 31, 29, 35, 41, 38, 44, 52, 49, 47, 55, 61, 58, 63, 66, 62,
  59, 54, 50, 47, 45, 48, 44, 41, 43, 40, 44, 49, 53, 57, 61, 58, 64, 68, 65,
  70, 74, 71, 69, 73,
];
