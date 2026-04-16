# BetterList

Medical practices want to provide patients with trusted recommendations outside of prescriptions and careplans (devices, wellness apps, skincare, hygiene kits, supplements), but don’t want the burden of inventory, fulfillment, or retail operations. So they scribble a brand name on a piece of paper, drop an Amazon link in the visit notes, or say it out loud and hope for the best. Most patients never buy it at all.

The answer? BetterList. Every provider gets a branded storefront where patients can browse the products their doctor actually recommends and buy them at the best price. Providers can also send a quick recommendation link directly to a patient. Either way, it's no extra work: pick products, share a link, and we handle everything from fulfillment to returns. HIPAA compliant.

The core novelty: a provider's recommendation doesn't end at advice. It ends at delivery and better outcomes.

## Key Features

- **Provider storefront** — each clinician gets a public, shareable page showcasing their recommended products; patients can browse, add to bag, and check out
- **Personalized recommendation links** — build a product list for a specific patient, send it via phone or name, and track when they view or purchase
- **Reusable Kits** — clinicians save product bundles for common protocols and reuse them across patients
- **Smart retailer selection** — real-time Amazon and Walmart pricing pipeline, with shipping cost optimization to pick the best option per order
- **Automated fulfillment** — physical products are ordered programmatically (Amazon/Walmart); manual, digital, and affiliate products are handled separately
- **Recommendation lifecycle tracking** — SENT → VIEWED → PURCHASED with automated 48-hour follow-up reminders
- **Activity & history** — providers can review all sent recommendations, patient orders, and saved product favorites in one place
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