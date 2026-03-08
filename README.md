# HomeBase

HomeBase is a unified assignment aggregator for students whose schools use multiple LMS platforms.  
It pulls work from Learning Suite LMS, Canvas, Gradescope, and Max into one place, deduplicates conservatively, and presents assignments in calendar and list formats.

## What It Solves

Students often miss assignments because due dates are scattered across multiple systems. HomeBase centralizes this data so users can:

- See all assignments sorted by due date.
- Switch between daily, weekly, monthly, and list views.
- Filter quickly by class, assignment type, and completion state.
- Mark work complete with checkbox-based status updates.
- Keep uncertain duplicates visible (fail-open policy: if unsure, include it).

## Core Features

- Authentication:
  - Local account sign-up/sign-in (email + password).
  - Optional BYU SSO via OIDC when configured.
  - Session-scoped API access (no client-supplied `userId` required).
- Multi-user Postgres data model with encrypted credential/token storage.
- Provider connector architecture with a shared LMS normalization contract.
- Manual sync API plus background worker hooks for scheduled sync/reminders.
- Conservative duplicate detection with possible-duplicate review support.
- Assignment completion controls (checkbox, strike-through, greying).
- Class color tags and assignment detail/description display.
- One-way calendar integration primitives:
  - Google calendar connection endpoint.
  - Apple/ICS connection path.
  - ICS subscription feed export.
- Six built-in visual themes with persistent user preference:
  - Scholar Paper
  - Terminal Study
  - Sunrise Calendar
  - Studio Minimal
  - Midnight Focus
  - Campus Retro
- Theme previews in a settings sidebar opened from the top-left settings icon.

## Tech Stack

- Next.js App Router + React + TypeScript
- Prisma ORM + PostgreSQL
- BullMQ worker scaffolding + Redis
- Vitest for unit/integration/UI-model tests

## API Surface

- `POST /api/connectors/:provider/connect`
- `POST /api/sync/run`
- `GET /api/assignments?view=daily|weekly|monthly|list&start&end&classId&status`
- `PATCH /api/assignments/:assignmentId/completion`
- `POST /api/duplicates/:groupId/resolve`
- `POST /api/calendar/google/connect`
- `POST /api/calendar/apple/connect-or-ics`
- `POST /api/reminders/settings`
- `GET /api/ics/:userId`

Additional `GET /api/assignments` filters:

- `assignmentType=HOMEWORK|QUIZ|EXAM|PROJECT|READING|DISCUSSION|OTHER`
- `completion=all|incomplete|complete`

## Local Development

1. Copy `.env.example` to `.env`.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run DB migrations: `npm run prisma:migrate`
5. Set auth vars in `.env`:
   - `AUTH_SECRET` (required)
   - BYU SSO vars (`BYU_OIDC_CLIENT_ID`, `BYU_OIDC_CLIENT_SECRET`, `BYU_OIDC_ISSUER`) if using BYU login
   - `NEXT_PUBLIC_BYU_SSO_ENABLED=true` to show BYU button on sign-in page
6. Start app: `npm run dev`
7. Start worker (optional): `npm run worker`

## Current Scope

- LMS connectors currently use scaffold/mock sync payloads for development flow validation.
- Production integrations still require provider-specific auth/API implementations in `lib/connectors/providers.ts`.
