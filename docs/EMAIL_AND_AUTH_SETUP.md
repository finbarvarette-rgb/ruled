# Email & password reset setup

## Resend (transactional emails)

1. Add `RESEND_API_KEY` to `.env.local` (and Vercel env).
2. Verify the domain `ruled.ca` in [Resend](https://resend.com/domains).
3. All app emails send from **hello@ruled.ca** via `lib/email-service.ts`.

## Supabase password reset (Resend SMTP)

Supabase sends reset links; configure Resend as custom SMTP so delivery works reliably.

In **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**:

| Field | Value |
|--------|--------|
| Enable custom SMTP | On |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` |
| Password | Your `RESEND_API_KEY` |
| Sender email | `hello@ruled.ca` |
| Sender name | `Ruled` |

Also set **Site URL** to `https://ruled.ca` (or your dev URL) and add redirect URLs:

- `https://ruled.ca/auth/callback`
- `https://ruled.ca/auth/reset-password`
- `http://localhost:3000/auth/callback` (local dev)
- `http://localhost:3000/auth/reset-password` (local dev)

The app sends reset links through `/auth/callback?next=/auth/reset-password` so the session is established before the user sets a new password.

## 14-day demand letter reminder (cron)

Set `CRON_SECRET` in env (random string). Vercel Cron calls:

`GET /api/cron/demand-reminders` with header `Authorization: Bearer <CRON_SECRET>`

Schedule: daily (see `vercel.json`). Reminders send when:

- `demand_letter_sent_at` is at least 14 days ago
- `demand_reminder_sent_at` is null
- Case has an `email`

Users start the clock with **“I've sent my letter”** on the demand letter success page (sets `demand_letter_sent_at`).
