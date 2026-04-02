# BetterList

Medical practices want to provide patients with trusted recommendations (devices, wellness apps, skincare, hygiene kits, supplements) outside of prescriptions and care plans, but don’t want the burden of inventory, fulfillment, or retail operations. So they scribble a brand name on a piece of paper, drop an Amazon link in the visit notes, or say it out loud and hope for the best. Most patients never buy it at all.

The answer? Betterlist reccomendation links. Patients can finally see exactly what is recommended and buy at the best price. For the practice it's no extra work; just pick products, select patient, and boom - a shoppable link is instantly sent. Hipaa compliant. We handle everything from fulfillment, returns, and compliance, so the provider stays focused on care.

The core novelty: a provider's recommendation doesn't end at advice. It ends at delivery and better outcomes.

## Key Features

- **Clinician-to-patient recommendation flow** — build a list, send a link, patient checks out
- **Reusable Kits** — clinicians save product bundles for common protocols and reuse them
- **Smart retailer selection** — real-time Amazon and Walmart pricing pipeline, with shipping cost optimization to pick the best option per order
- **Automated fulfillment** — physical products are ordered programatically (Amazon/Walmart); manual, digital, and affiliate products are handled separately
- **Recommendation lifecycle tracking** — SENT → VIEWED → PURCHASED with automated 48-hour follow-up reminders
- **Multi-channel auth** — phone OTP (Twilio), email magic link, and token-based auto-login for patients

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth v5 |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Payments | Stripe |
| Fulfillment | Zinc API | Rainforest API
| Email | Resend |
| SMS | Twilio |
| Background Jobs | BullMQ + Redis (Upstash) |

## Architecture Highlights

- Background job workers handle order confirmations, recommendation delivery, and reminders
- Fulfillment logic evaluates Amazon vs. Walmart pricing including free-shipping thresholds before routing each order
- Admin-managed manual price overrides sit alongside live-scraped prices without conflict
- Role-based access: CLINICIAN, PATIENT, ADMIN — with auto-assignment based on email domain
- Practice/group support for multi-clinician organizations

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```