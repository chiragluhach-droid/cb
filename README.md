# KHAO: diet + fitness coaching platform

Next.js 16 (App Router, full-stack) + MongoDB Atlas (Mongoose). No mobile app; clients get a web dashboard.

## Run

```bash
npm install
npm run seed:admin   # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local
npm run dev          # http://localhost:3000
```

## Flow

1. **Landing** `/`: hero, 30s HTML reel (`public/reel.html`), live sample-day demo, results, pricing, FAQ.
2. **Signup** `/signup` → **onboarding quiz** `/start` → **checkout** `/checkout` (Razorpay or test mode, coupons, INR/USD).
3. After payment, a plan draft is generated (built-in engine, or Claude if `ANTHROPIC_API_KEY` is set) and goes to **admin review**. The client sees "your coach is crafting your plan".
4. Admin approves or edits it at `/admin/reviews`. The client gets it on `/dashboard`.
5. Client dashboard: today's meals (tick / swap), water, steps, weight, workout; full plan; progress (chart, check-ins, photos, before/after slider); coach inbox.
6. **Auto-adjust** (`lib/adapt.js`) runs on every weight log or check-in:
   - down ≥ 2 kg on the current plan → recalculated plan
   - flat for ~14 days → plateau plan (−150 kcal)
   - goal reached → next stage (maintain or build)

   Each one creates a draft for admin review, never a direct change.
7. **Reminders** (`/api/cron/reminders`, daily via `vercel.json`): inactivity nudges, weekly check-in, renewal reminders, expiry.

## Admin (`/admin`)
Overview (revenue, active clients, alerts), plan review queue, client list with filters, client page (profile, adherence, weight, check-ins, photos, plan editor: approve / edit / generate / copy / write by hand, messaging, phase + subscription controls), payments, coupons.

## Env
See `.env.example`. Optional: `ANTHROPIC_API_KEY`, `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, `COACH_NAME`, `ALLOW_TEST_PAYMENTS`.

## Before launch
- Replace the placeholder stories in `lib/content.js` with real client results.
- Add Razorpay keys (test mode is blocked in production unless `ALLOW_TEST_PAYMENTS=true`).
- Rotate the MongoDB password (it was shared in chat) and allow your host's IPs in Atlas.
# cs
# cs
