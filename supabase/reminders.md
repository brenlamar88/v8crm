# Overdue-task email reminders

A daily digest that emails each workspace member the tasks assigned to them that
are open and past due. Two pieces are already deployed to the Supabase project:

- **`overdue_task_digest()`** — a SECURITY DEFINER SQL function (in
  `schema.sql`) that returns open, assigned, past-due tasks across every
  workspace. Locked to the `service_role`.
- **`overdue-reminders`** — an Edge Function (`functions/overdue-reminders/`)
  that calls the digest, groups by assignee, and emails each person their list
  via [Resend](https://resend.com). It is **closed** (HTTP 503) until
  `CRON_SECRET` is set, and runs as a **dry run** (sends nothing, just reports)
  until `RESEND_API_KEY` is set.

The function URL is:

```
https://jqcobwrrjwybrcvtjqxa.supabase.co/functions/v1/overdue-reminders
```

## Activation (3 steps)

### 1. Set Edge Function secrets

Supabase Dashboard → **Project Settings → Edge Functions → Secrets** (or
`supabase secrets set`). Add:

| Secret           | Value                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `CRON_SECRET`    | any long random string (suggestion below) — must match step 3     |
| `RESEND_API_KEY` | your Resend API key (`re_…`)                                       |
| `FROM_EMAIL`     | a Resend-**verified** sender, e.g. `V8 CRM <reminders@yourdomain>` |
| `APP_URL`        | optional; defaults to `https://v8crm.vercel.app`                  |

Suggested `CRON_SECRET` (or generate your own):

```
79985638454cce31d7bc5025739bae637610d1463c5e812f
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do
not set them.

### 2. Test it (dry run is safe)

```bash
curl -X POST 'https://jqcobwrrjwybrcvtjqxa.supabase.co/functions/v1/overdue-reminders' \
  -H 'x-cron-secret: <YOUR_CRON_SECRET>' \
  -H 'content-type: application/json' -d '{}'
```

Before `RESEND_API_KEY` is set you'll get `{"dryRun": true, ...}` listing who
would be emailed. After it's set, real emails go out and `sent` flips to `true`.

### 3. Schedule it daily

Run once in the SQL editor. `13:00 UTC` ≈ 8am Central; adjust to taste. Replace
the secret with the same value from step 1.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'overdue-reminders-daily',
  '0 13 * * *',
  $$
  select net.http_post(
    url     := 'https://jqcobwrrjwybrcvtjqxa.supabase.co/functions/v1/overdue-reminders',
    headers := jsonb_build_object(
                 'content-type', 'application/json',
                 'x-cron-secret', '<YOUR_CRON_SECRET>'
               ),
    body    := '{}'::jsonb
  );
  $$
);
```

To change the time: `select cron.alter_job(...)`. To stop:
`select cron.unschedule('overdue-reminders-daily');`

## Notes

- Only tasks with a **real due date** (the date picker) and an **assignee**
  count — legacy free-form labels and unassigned tasks are ignored.
- Each person is emailed only their own overdue tasks; the service-role scan
  never leaks another member's book.
- Redeploy the function after editing it:
  `supabase functions deploy overdue-reminders --no-verify-jwt`.
