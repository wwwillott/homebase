# HomeBase Deployment Guide

This guide sets up public user sign-in (local + BYU SSO) on Vercel.

## 1. Create Required Services

1. Create a Postgres database (Neon recommended).
2. Create a Redis instance (Upstash recommended).
3. Generate secrets:
   - `AUTH_SECRET`: `openssl rand -base64 32`
   - `ENCRYPTION_KEY`: 32-byte key used by connector/calendar token encryption.

## 2. Deploy to Vercel

1. Push your `master` branch to GitHub.
2. In Vercel, click **Add New Project** and import `wwwillott/homebase`.
3. Keep framework as **Next.js**.

## 3. Configure Environment Variables (Vercel)

Set these for Production:

- `DATABASE_URL` = postgres connection string
- `REDIS_URL` = redis connection string
- `AUTH_SECRET` = generated secret
- `NEXTAUTH_URL` = `https://<your-domain>`
- `ENCRYPTION_KEY` = generated key
- `APP_BASE_URL` = `https://<your-domain>`
- `SYNC_CRON_MINUTES` = `30`
- `BYU_OIDC_CLIENT_ID` = BYU app client id
- `BYU_OIDC_CLIENT_SECRET` = BYU app secret
- `BYU_OIDC_ISSUER` = BYU issuer URL
- `NEXT_PUBLIC_BYU_SSO_ENABLED` = `true`

Optional calendar vars:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## 4. Configure BYU OIDC App

In BYU OAuth/OIDC app configuration, set:

- Redirect/Callback URL: `https://<your-domain>/api/auth/callback/byu`

Also ensure scopes include at least `openid profile email`.

## 5. Run Prisma Migrations on Production DB

From your local machine, run against production `DATABASE_URL`:

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
```

## 6. Verify End-to-End

1. Visit `https://<your-domain>/sign-in`.
2. Test `Sign In with BYU SSO`.
3. Test local sign-up and sign-in.
4. Open settings sidebar (top-left gear icon).
5. Connect each LMS provider and click `Sync now`.
6. Confirm assignments appear in list and calendar views.

## 7. Troubleshooting

- `Unauthorized` from APIs:
  - Verify sign-in succeeded and cookies are present.
- BYU button missing:
  - Set `NEXT_PUBLIC_BYU_SSO_ENABLED=true` and redeploy.
- BYU callback errors:
  - Ensure callback URL exactly matches deployed domain.
- DB migration errors:
  - Verify `DATABASE_URL` points to the intended production database.
