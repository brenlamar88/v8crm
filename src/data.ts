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
}

/** Look up a single account by its code (used by the detail route). */
export function accountByCode(code: string): Account | undefined {
  return accounts.find((a) => a.code === code);
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
  },
];

// A smooth-ish intraday-style series for the hero chart.
export const revenueSeries: number[] = [
  22, 24, 23, 27, 31, 29, 35, 41, 38, 44, 52, 49, 47, 55, 61, 58, 63, 66, 62,
  59, 54, 50, 47, 45, 48, 44, 41, 43, 40, 44, 49, 53, 57, 61, 58, 64, 68, 65,
  70, 74, 71, 69, 73,
];
