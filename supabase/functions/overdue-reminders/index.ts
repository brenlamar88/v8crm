import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Overdue-task reminder digest. Intended to be called on a daily schedule
// (pg_cron -> pg_net) with a shared secret header. It scans for open, assigned,
// past-due tasks via the overdue_task_digest() RPC (service role) and emails
// each assignee their own list through Resend. With no RESEND_API_KEY set it
// runs as a dry run (reports who WOULD be emailed, sends nothing).
//
// Activation runbook: supabase/reminders.md. Deployed with verify_jwt=false;
// auth is the x-cron-secret shared-secret header (see below).

type Row = { assignee: string; code: string; account: string; title: string; due_date: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  // Shared-secret auth: closed until CRON_SECRET is configured.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) return json({ error: "CRON_SECRET not configured" }, 503);
  if (req.headers.get("x-cron-secret") !== cronSecret) return json({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "missing supabase env" }, 500);

  // Pull the overdue digest with the service role (bypasses RLS by design).
  const res = await fetch(`${url}/rest/v1/rpc/overdue_task_digest`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    return json({ error: "digest query failed", status: res.status, detail: await res.text() }, 500);
  }
  const rows = (await res.json()) as Row[];

  // Group by assignee email.
  const byAssignee = new Map<string, Row[]>();
  for (const r of rows) {
    const list = byAssignee.get(r.assignee) ?? [];
    list.push(r);
    byAssignee.set(r.assignee, list);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL") ?? "V8 CRM <onboarding@resend.dev>";
  const appUrl = Deno.env.get("APP_URL") ?? "https://v8crm.vercel.app";
  const dryRun = !resendKey;

  const results: Array<{ to: string; tasks: number; sent: boolean; error?: string }> = [];

  for (const [assignee, list] of byAssignee) {
    const count = list.length;
    const subject = `${count} overdue task${count === 1 ? "" : "s"} in V8 CRM`;
    const textLines = list
      .map((t) => `• ${t.title} — ${t.account} (${t.code}) · due ${t.due_date}`)
      .join("\n");
    const text = `You have ${count} overdue task${count === 1 ? "" : "s"}:\n\n${textLines}\n\nOpen the console: ${appUrl}/tasks`;
    const htmlRows = list
      .map(
        (t) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(t.title)}</td>` +
          `<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">${esc(t.account)}</td>` +
          `<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#c0392b;white-space:nowrap">due ${esc(t.due_date)}</td></tr>`,
      )
      .join("");
    const html =
      `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">` +
      `<h2 style="font-size:18px;margin:0 0 4px">${count} overdue task${count === 1 ? "" : "s"}</h2>` +
      `<p style="color:#666;margin:0 0 16px">These follow-ups are past due in V8 CRM.</p>` +
      `<table style="border-collapse:collapse;width:100%;font-size:14px">${htmlRows}</table>` +
      `<p style="margin:20px 0 0"><a href="${appUrl}/tasks" style="background:#6d5efc;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">Open your tasks</a></p>` +
      `</div>`;

    if (dryRun) {
      results.push({ to: assignee, tasks: count, sent: false });
      continue;
    }

    try {
      const er = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: assignee, subject, text, html }),
      });
      results.push({ to: assignee, tasks: count, sent: er.ok, error: er.ok ? undefined : await er.text() });
    } catch (e) {
      results.push({ to: assignee, tasks: count, sent: false, error: String(e) });
    }
  }

  return json({ dryRun, assignees: byAssignee.size, tasks: rows.length, results });
});
