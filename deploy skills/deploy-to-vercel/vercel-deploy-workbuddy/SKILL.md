---
name: vercel-deploy-workbuddy
description: Deploy and prepare local web projects on Vercel from WorkBuddy using Vercel CLI automation. Use when the user asks WorkBuddy to deploy, publish, push live, create a Vercel preview or production deployment, open Vercel auth/token setup, create or connect Vercel Blob storage, add Vercel environment variables, inspect a deployment, or return the deployed Vercel URL without relying on Vercel MCP.
---

# Vercel Deploy WorkBuddy

Use this skill to prepare and deploy a local project to Vercel from WorkBuddy. Prefer an existing Vercel CLI login or token-based authentication. If neither exists, actively guide setup instead of only telling the user to visit pages manually.

## Authentication Flow

Use this order:

1. Check whether `VERCEL_TOKEN` is exported or present in `.env`.
2. If no token exists, run `vercel whoami` to check for an existing CLI login.
3. If not logged in, open Vercel for the user and start login:
   ```bash
   bash "deploy skills/deploy-to-vercel/vercel-deploy-workbuddy/scripts/setup-vercel-project.sh" --login-only
   ```
4. If the user wants fully unattended future deploys, open the token page and ask them to paste the created token into WorkBuddy's secure environment:
   ```bash
   open https://vercel.com/account/tokens
   ```

Do not ask the user to find project IDs if `.vercel/project.json` exists. The scripts read `orgId` and `projectId` automatically.

## Project Setup Workflow

Before the first production deploy, prepare the project:

```bash
bash "deploy skills/deploy-to-vercel/vercel-deploy-workbuddy/scripts/setup-vercel-project.sh" --generate-admin-password
```

This script can:

- Install Vercel CLI if missing.
- Reuse `VERCEL_TOKEN` or existing `vercel login`.
- Open Vercel login/token pages when auth is missing.
- Link the project when `.vercel/project.json` is absent.
- Create a Vercel Blob store with `vercel blob create-store`.
- Add generated or provided `ADMIN_PASSWORD` to Vercel environments.
- Pull Vercel environment variables into `.env.local` when possible.

For this project, Blob is not something the user should manually create in the happy path. Try CLI setup first. Only fall back to dashboard instructions if Vercel CLI cannot create or connect the store.

## Deploy Workflow

1. Inspect the project state:
   ```bash
   git remote get-url origin 2>/dev/null
   cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null
   ```

2. Confirm the requested environment:
   - Deploy as preview by default.
   - Deploy to production only when the user explicitly asks for production, live, or official release deployment.

3. Run the bundled script from the project directory:
   ```bash
   bash "deploy skills/deploy-to-vercel/vercel-deploy-workbuddy/scripts/deploy-vercel.sh"
   ```

   For production:
   ```bash
   bash "deploy skills/deploy-to-vercel/vercel-deploy-workbuddy/scripts/deploy-vercel.sh" --prod
   ```

   For another project path:
   ```bash
   bash "deploy skills/deploy-to-vercel/vercel-deploy-workbuddy/scripts/deploy-vercel.sh" --path /path/to/project --prod
   ```

4. Return the deployment URL shown by the script. If deployment fails, return the failing command phase and the relevant error text.

## Blob Handling

Use Vercel Blob CLI before asking the user to use the dashboard:

```bash
vercel blob list-stores
vercel blob create-store <project-name>-blob --access public
vercel env pull .env.local
```

Vercel Blob supports project-connected OIDC credentials. Connected Blob stores add `BLOB_STORE_ID` and Vercel populates `VERCEL_OIDC_TOKEN` at runtime. Some projects may still require `BLOB_READ_WRITE_TOKEN`; if the app code explicitly checks for that variable, ensure the Vercel project has it after Blob setup or ask the user to paste only that missing value.

## Safety Rules

- Never print or reveal `VERCEL_TOKEN`.
- Never pass the token through `--token`; export `VERCEL_TOKEN` and let the Vercel CLI read it.
- Do not ask for Vercel project IDs when `.vercel/project.json` is already present.
- Do not ask the user to manually create Blob before trying `vercel blob create-store`.
- Do not modify `.vercel/` files manually.
- Do not run `git push` unless the user explicitly asks for a git-push deployment.
- Do not use claimable deployment endpoints as the primary path; those are only fallback demos and do not deploy directly into the user's own Vercel project.
- Do not curl the deployed site for content verification unless the user explicitly asks. Use `vercel inspect` for deployment status.

## Troubleshooting

- If `VERCEL_TOKEN` is missing, first check `vercel whoami`. If not logged in, run `setup-vercel-project.sh --login-only` to open the right page and start CLI login.
- If `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are missing and no `.vercel/project.json` exists, run `vercel link -y` only after confirming the intended Vercel project or team.
- If the CLI is missing, the script installs it through `npm install -g vercel`.
- If the build fails, run:
  ```bash
  vercel inspect <deployment-url> --logs
  ```
