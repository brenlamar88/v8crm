/* ----------------------------------------------------------------------------
   Sample data for the showcase. V8 Technologies builds and runs production
   systems for operators in unglamorous verticals — behavioral health networks,
   nonprofits, regional service companies. These accounts are fictional and
   generic on purpose: the design system is what's on display, not a client.
   -------------------------------------------------------------------------- */

export type EngagementStage = "Discovery" | "Proposal" | "Build" | "Retainer" | "At Risk";

export interface Account {
  name: string;
  code: string;
  vertical: string;
  stage: EngagementStage;
  mrr: number;
  health: number; // 0–100
  owner: string;
  trend: number[];
}

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
  },
];

// A smooth-ish intraday-style series for the hero chart.
export const revenueSeries: number[] = [
  22, 24, 23, 27, 31, 29, 35, 41, 38, 44, 52, 49, 47, 55, 61, 58, 63, 66, 62,
  59, 54, 50, 47, 45, 48, 44, 41, 43, 40, 44, 49, 53, 57, 61, 58, 64, 68, 65,
  70, 74, 71, 69, 73,
];
