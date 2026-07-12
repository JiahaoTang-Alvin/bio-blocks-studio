# Vercel AI Deployment Guide

Last updated: 2026-07-12

This document is written for AI agents that receive this repository and need to deploy it to Vercel. It is project-specific. Use the generic Vercel deployment skill only as a toolbox; use this document to understand what this project needs.

## Project Architecture

This is a Next.js personal bio / portfolio template with two main surfaces:

- Public site: `app/page.tsx`, hidden variant routes under `app/[accessCode]`, and metadata/icon routes.
- Admin editor: `app/admin/page.tsx`, `components/admin/AdminVisualEditor.tsx`, and authenticated API routes under `app/api/admin`.

The content source of truth is a validated `SiteConfig` object:

- Local/fresh fallback: `lib/default-site-config.ts`.
- Production config: Vercel Blob object at `config/site-config.json`.
- Config read/write helpers: `lib/blob-config.ts`.
- Validation: `lib/validators.ts`.

Uploads also use Vercel Blob:

- Upload route: `app/api/admin/upload/route.ts`.
- Allowed folders: `avatar`, `blocks`, `gallery`, `qrcode`.
- Max upload size: 5 MB.
- Uploaded images are public Blob objects, so do not store private media there.

## Vercel Features Required

Deploy this project as a normal Vercel Next.js project.

Required Vercel features:

- Vercel project linked to this repository or local checkout.
- Vercel Blob store for config and media uploads.
- Server-only environment variables for admin auth and Blob access.

Optional but recommended:

- A production domain stored in `NEXT_PUBLIC_SITE_URL`.
- A manually generated `SESSION_SECRET` so sessions are not derived from the admin password.

## Required Environment Variables

Set these in Vercel Project Settings or through `vercel env`.

```text
NEXT_PUBLIC_SITE_URL
BLOB_READ_WRITE_TOKEN
ADMIN_PASSWORD or ADMIN_PASSWORD_HASH
SESSION_SECRET
```

Meaning:

- `NEXT_PUBLIC_SITE_URL`: public production origin, for example `https://example.com`. This is browser-visible.
- `BLOB_READ_WRITE_TOKEN`: server-only Vercel Blob token. Required by current code before admin config save and image upload.
- `ADMIN_PASSWORD`: simplest admin login secret.
- `ADMIN_PASSWORD_HASH`: bcrypt hash. If set, it takes priority over `ADMIN_PASSWORD`.
- `SESSION_SECRET`: server-only HMAC signing secret for admin sessions. Use at least 32 characters.

Never prefix server-only secrets with `NEXT_PUBLIC_`.

## Deployment Auth vs App Env

Keep these two categories separate:

- `VERCEL_TOKEN`: deploy credential for the AI/CLI. Put it in WorkBuddy/Codex/CI environment when unattended deployment is needed. Do not add it to the Vercel project as an app runtime variable.
- App env vars such as `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD`, and `SESSION_SECRET`: set these on the Vercel project so the deployed app can run.

If the AI generates an admin password, it should:

1. Add it to Vercel as `ADMIN_PASSWORD` or generate a bcrypt hash and add `ADMIN_PASSWORD_HASH`.
2. Tell the user the password once, because the user needs it for `/admin/login`.
3. Never commit it to the repository.

If the AI obtains or receives `BLOB_READ_WRITE_TOKEN`, it should:

1. Add it to Vercel as a server-only env var for production, preview, and development when needed.
2. Optionally place it in local `.env.local` for local testing.
3. Never commit it or print it back.

## Recommended AI Flow

1. Inspect the project:
   ```bash
   git remote get-url origin 2>/dev/null
   cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null
   cat package.json
   cat .env.example
   ```

2. Prepare Vercel auth:
   - If `VERCEL_TOKEN` exists, use it silently.
   - Else run `vercel whoami`.
   - If not logged in, open Vercel login and run `vercel login`.
   - For unattended future demos, open `https://vercel.com/account/tokens` and ask the user to paste the token into the agent's secure environment.

3. Link the project if needed:
   ```bash
   vercel link --repo -y
   ```
   Use plain `vercel link -y` only when there is no git remote.

4. Prepare Blob:
   ```bash
   vercel blob list-stores
   vercel blob create-store <project-name>-blob --access public
   vercel env pull .env.local
   ```
   Try the CLI path before asking the user to create Blob in the dashboard.

5. Set app env vars:
   ```bash
   printf "%s" "$NEXT_PUBLIC_SITE_URL" | vercel env add NEXT_PUBLIC_SITE_URL production
   printf "%s" "$BLOB_READ_WRITE_TOKEN" | vercel env add BLOB_READ_WRITE_TOKEN production
   printf "%s" "$ADMIN_PASSWORD" | vercel env add ADMIN_PASSWORD production
   printf "%s" "$SESSION_SECRET" | vercel env add SESSION_SECRET production
   ```
   Repeat for preview/development as needed. If a variable already exists, use `vercel env update`.

6. Deploy:
   ```bash
   vercel deploy --prod -y --no-wait
   vercel inspect <deployment-url>
   ```

7. After deploy:
   - Return the production URL.
   - Tell the user the admin login path: `/admin/login`.
   - If the AI generated `ADMIN_PASSWORD`, provide it once.
   - Ask the user to sign in, open project settings, confirm site URL/title/description/languages/versions, and save once to initialize `config/site-config.json` in Blob.

## Fresh Deployment Checklist

- Vercel project linked.
- Blob store exists.
- `BLOB_READ_WRITE_TOKEN` is available to the deployed app.
- `NEXT_PUBLIC_SITE_URL` points to the production origin.
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` is set.
- `SESSION_SECRET` is set or intentionally omitted for simple setup.
- Production deploy completed.
- Admin saved config once so Blob contains `config/site-config.json`.

## Failure Handling

- Missing Vercel auth: open login/token setup; do not ask for project IDs first.
- Blob CLI fails: report the CLI error, then guide the user to Vercel Dashboard -> Project -> Storage -> Create Database -> Blob.
- Env var already exists: use `vercel env update`.
- Build fails: run `vercel inspect <deployment-url> --logs`.
- Admin save/upload fails with missing Blob token: add `BLOB_READ_WRITE_TOKEN` to the Vercel project and redeploy.
