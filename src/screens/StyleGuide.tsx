/* ============================================================================
   Design System — the living style guide, now a route inside the console.
   Documents the tokens and shows them applied to real CRM primitives.
   ========================================================================== */
import { useState, type ReactNode } from "react";
import { Topbar } from "../components/Topbar.tsx";
import { Button, Badge, SegmentedControl, Toggle } from "../components/primitives.tsx";
import { Field, Input, Select, Textarea } from "../components/forms.tsx";
import { Modal } from "../components/Modal.tsx";
import { useToast } from "../components/toast.tsx";
import { StatCard, StatCardRow } from "../components/StatCard.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { AccountsTable } from "../components/AccountsTable.tsx";
import { accounts, revenueSeries } from "../data.ts";

function Section({
  n,
  title,
  desc,
  children,
}: {
  n: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-8">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="tabular text-label font-semibold text-accent-400">{n}</span>
        <div>
          <h2 className="text-h2 font-semibold">{title}</h2>
          <p className="mt-1 text-body text-text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TypeRow({ cls, name, meta, sample }: { cls: string; name: string; meta: string; sample: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-[color:var(--v8-border)] py-4 last:border-0">
      <div className={`${cls} min-w-0 truncate font-semibold`}>{sample}</div>
      <div className="shrink-0 text-right">
        <div className="text-body-sm font-semibold text-text-secondary">{name}</div>
        <div className="tabular text-label text-text-muted">{meta}</div>
      </div>
    </div>
  );
}

function Swatch({ varName, name }: { varName: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-9 w-9 shrink-0 rounded-md border border-[color:var(--v8-border-strong)]"
        style={{ background: `var(${varName})` }}
      />
      <div className="min-w-0">
        <div className="truncate text-body-sm font-semibold">{name}</div>
        <div className="tabular text-label text-text-muted">{varName}</div>
      </div>
    </div>
  );
}

function SpaceRow({ token, px }: { token: string; px: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="tabular w-16 text-body-sm text-text-secondary">{token}</span>
      <span className="tabular w-12 text-label text-text-muted">{px}px</span>
      <span className="h-4 rounded-sm bg-accent-500" style={{ width: `${px}px` }} />
    </div>
  );
}

export function StyleGuide() {
  const [range, setRange] = useState("1D");
  const [demoRange, setDemoRange] = useState("1D");
  const [demoOpen, setDemoOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      <Topbar title="Design System" subtitle="Tokens, primitives & motion — v0.1" />
      <div className="px-6 py-8">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-16">
          <Section n="01" title="Metrics" desc="The KPI tile and hero chart — the reference's readouts, rebuilt on V8 tokens.">
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow">This quarter</span>
              <SegmentedControl options={["1D", "1W", "1M", "1Q", "1Y"]} value={range} onChange={setRange} />
            </div>
            <StatCardRow>
              <StatCard label="Recurring Revenue" value="$41.6" unit="K" trend={8.27} range={range} series={[28, 30, 29, 33, 36, 34, 39, 42]} delay={0} />
              <StatCard label="Pipeline Value" value="$228" unit="K" trend={4.12} range={range} series={[10, 12, 11, 14, 13, 16, 18, 21]} delay={60} />
              <StatCard label="Win Rate" value="61" unit="%" trend={-1.42} range={range} series={[18, 17, 17, 15, 16, 14, 13, 13]} delay={120} />
              <StatCard label="Active Engagements" value="9" trend={2.4} range={range} series={[5, 5, 6, 6, 7, 7, 8, 9]} delay={180} />
            </StatCardRow>
            <div className="panel mt-4 p-6 animate-fade-rise" style={{ animationDelay: "220ms" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Revenue · trailing 30 days</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="tabular text-display-xl font-bold leading-tight">$93.4</span>
                    <span className="tabular text-h1 font-semibold text-text-muted">K</span>
                  </div>
                </div>
                <div className="rounded-md border border-[color:var(--v8-border-strong)] bg-overlay px-3 py-2 shadow-md">
                  <div className="eyebrow">Peak day</div>
                  <div className="tabular mt-1 text-body font-semibold">$93,420</div>
                </div>
              </div>
              <div className="mt-6">
                <Sparkline data={revenueSeries} height={140} tone="accent" />
              </div>
            </div>
          </Section>

          <Section n="02" title="Typographic scale" desc="A tight, deliberate ramp. Display sizes carry the numeric readouts; body and below hold the same rhythm as the reference.">
            <div className="panel px-6 py-2">
              <TypeRow cls="text-display-xl" name="display-xl" meta="60 / 1.05 / -0.02em" sample="$3.4M" />
              <TypeRow cls="text-display" name="display" meta="40 / 1.05 / -0.02em" sample="$280K" />
              <TypeRow cls="text-h1" name="h1" meta="28 / 1.25 / -0.011em" sample="Cypress Behavioral Network" />
              <TypeRow cls="text-h2" name="h2" meta="22 / 1.25" sample="Active engagements" />
              <TypeRow cls="text-h3" name="h3" meta="17 / 1.25" sample="Pipeline this quarter" />
              <TypeRow cls="text-body" name="body" meta="14 / 1.5" sample="The default reading size for the console." />
              <TypeRow cls="text-label" name="label" meta="12 / 1.25" sample="Form label & table meta" />
              <TypeRow cls="eyebrow" name="micro / eyebrow" meta="11 / uppercase / 0.08em" sample="Recurring revenue" />
            </div>
          </Section>

          <Section n="03" title="Color" desc="Near-black surfaces in elevation layers, a single violet signal, and status tints reserved for meaning — never decoration.">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="panel p-5">
                <span className="eyebrow">Surfaces</span>
                <div className="mt-4 flex flex-col gap-3">
                  <Swatch varName="--v8-bg-base" name="Canvas" />
                  <Swatch varName="--v8-surface" name="Surface" />
                  <Swatch varName="--v8-surface-raised" name="Raised" />
                  <Swatch varName="--v8-surface-overlay" name="Overlay" />
                </div>
              </div>
              <div className="panel p-5">
                <span className="eyebrow">Signal</span>
                <div className="mt-4 flex flex-col gap-3">
                  <Swatch varName="--v8-accent-400" name="Accent 400" />
                  <Swatch varName="--v8-accent-500" name="Accent 500 · primary" />
                  <Swatch varName="--v8-accent-600" name="Accent 600" />
                  <Swatch varName="--v8-accent-700" name="Accent 700" />
                </div>
              </div>
              <div className="panel p-5">
                <span className="eyebrow">Status</span>
                <div className="mt-4 flex flex-col gap-3">
                  <Swatch varName="--v8-up" name="Up · healthy" />
                  <Swatch varName="--v8-down" name="Down · at risk" />
                  <Swatch varName="--v8-warn" name="Warn" />
                  <Swatch varName="--v8-info" name="Info" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-body-sm text-text-muted">
              Because every surface reads from these variables, the whole console re-themes from one
              place — <span className="text-text-secondary">Settings</span> ships a <span className="text-text-secondary">dark / light</span> mode
              and six accent presets, applied by rewriting the tokens on <code className="tabular text-text-secondary">:root</code>.
              Nothing hard-codes a color.
            </p>
          </Section>

          <Section n="04" title="Spacing rhythm" desc="One unit is 4px. Layouts compose from this ladder only, so horizontal and vertical rhythm stay locked.">
            <div className="panel flex flex-col gap-3 p-6">
              <SpaceRow token="space-1" px={4} />
              <SpaceRow token="space-2" px={8} />
              <SpaceRow token="space-3" px={12} />
              <SpaceRow token="space-4" px={16} />
              <SpaceRow token="space-6" px={24} />
              <SpaceRow token="space-8" px={32} />
              <SpaceRow token="space-12" px={48} />
              <SpaceRow token="space-16" px={64} />
            </div>
          </Section>

          <Section n="05" title="Motion & controls" desc="Short, calm, ease-out. Hover and press are fast feedback; toggles and entrances run one step longer. Hover the controls to feel the timing.">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="panel flex flex-col gap-5 p-6">
                <span className="eyebrow">Buttons</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="subtle">Subtle</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <span className="eyebrow mt-2">Toasts</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="subtle" onClick={() => toast("Changes saved")}>Success toast</Button>
                  <Button variant="subtle" onClick={() => toast("Renewal due soon", "warn")}>Warn toast</Button>
                </div>
                <span className="eyebrow mt-2">Badges</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="up">Retainer</Badge>
                  <Badge tone="accent">Build</Badge>
                  <Badge tone="warn">Review</Badge>
                  <Badge tone="down">At Risk</Badge>
                  <Badge tone="neutral">Discovery</Badge>
                </div>
              </div>
              <div className="panel flex flex-col gap-6 p-6">
                <div>
                  <span className="eyebrow">Segmented control · 220ms slide</span>
                  <div className="mt-3">
                    <SegmentedControl options={["1H", "1D", "1W", "1M", "1Y"]} value={demoRange} onChange={setDemoRange} />
                  </div>
                </div>
                <div>
                  <span className="eyebrow">Toggle · 220ms</span>
                  <div className="mt-3 flex flex-col gap-3">
                    <Toggle label="Only my accounts" />
                    <Toggle label="Show forecast band" />
                  </div>
                </div>
                <div>
                  <span className="eyebrow">Timing tokens</span>
                  <div className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-body-sm text-text-secondary">
                    <span>fast · 150ms</span>
                    <span>base · 220ms</span>
                    <span>slow · 360ms</span>
                    <span className="text-text-muted">ease-out (.22,1,.36,1)</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section n="06" title="Forms & overlays" desc="The input layer: one field frame that shifts to the accent on focus, and a dialog that fades in over a dimmed canvas.">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="panel flex flex-col gap-4 p-6">
                <span className="eyebrow">Fields</span>
                <Field label="Account name">
                  <Input placeholder="e.g. Vermilion Health Group" />
                </Field>
                <Field label="Stage">
                  <Select defaultValue="Discovery">
                    <option>Discovery</option>
                    <option>Proposal</option>
                    <option>Build</option>
                    <option>Retainer</option>
                  </Select>
                </Field>
                <Field label="Notes" hint="Supports multiple lines.">
                  <Textarea placeholder="Context for the engagement…" />
                </Field>
              </div>
              <div className="panel flex flex-col items-start gap-4 p-6">
                <span className="eyebrow">Dialog</span>
                <p className="text-body text-text-secondary">
                  Overlays dim and blur the canvas, close on Escape or backdrop click, and
                  lock body scroll while open.
                </p>
                <Button variant="primary" onClick={() => setDemoOpen(true)}>
                  Open dialog
                </Button>
              </div>
            </div>
          </Section>

          <Section n="07" title="In context" desc="The primitives assembled into a real CRM surface — the accounts table V8 uses to run its book of engagements.">
            <AccountsTable accounts={accounts} />
          </Section>
        </div>
      </div>

      <Modal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Dialog"
        description="A token-driven overlay, same as the console's forms."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDemoOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setDemoOpen(false)}>Done</Button>
          </>
        }
      >
        <p className="text-body text-text-secondary">
          Everything here — spacing, radius, motion, color — comes from the same tokens as
          the rest of the page. Press Escape or click outside to dismiss.
        </p>
      </Modal>
    </>
  );
}
