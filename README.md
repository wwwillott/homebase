# HomeBase LMS Aggregator

Unified assignment dashboard for Learning Suite LMS, Canvas, Gradescope, and Max.

## Features (v1 scaffold)

- Multi-user data model with encrypted connector tokens.
- LMS connector contract with API-first/fallback-ready connector implementations.
- Manual sync endpoint + worker-ready queue integration.
- Conservative dedupe scoring with possible-duplicate review support.
- Assignment views: daily / weekly / monthly / list.
- Class sorting and color-tag rendering.
- Reminder settings API and due-soon reminder selector.
- Google + Apple/ICS one-way calendar connection primitives.
- ICS export endpoint for calendar subscriptions.
- Theme selector with persistent user preference and six built-in visual themes.

## API Endpoints

- `POST /api/connectors/:provider/connect`
- `POST /api/sync/run`
- `GET /api/assignments?view=daily|weekly|monthly|list&start&end&classId&status&userId=...`
- `PATCH /api/assignments/:assignmentId/completion`
- `POST /api/duplicates/:groupId/resolve`
- `POST /api/calendar/google/connect`
- `POST /api/calendar/apple/connect-or-ics`
- `POST /api/reminders/settings`
- `GET /api/ics/:userId`

`GET /api/assignments` supports additional filters:
- `assignmentType=HOMEWORK|QUIZ|EXAM|PROJECT|READING|DISCUSSION|OTHER`
- `completion=all|incomplete|complete`

## Run

1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm install`
3. Generate client: `npm run prisma:generate`
4. Migrate DB: `npm run prisma:migrate`
5. Start app: `npm run dev`
6. Start worker (optional): `npm run worker`

## Notes

- Connector implementations are scaffolded with mock sync payloads and normalized schemas.
- Integrate provider-specific OAuth/API flows per LMS in `lib/connectors/providers.ts`.
- Calendar sync currently provides storage + ICS generation + stable external event IDs.
- Available themes: Scholar Paper, Terminal Study, Sunrise Calendar, Studio Minimal, Midnight Focus, Campus Retro.
