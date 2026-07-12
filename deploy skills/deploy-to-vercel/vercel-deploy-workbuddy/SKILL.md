---
name: vercel-deploy-workbuddy
description: Deploy local web projects to Vercel from WorkBuddy using token-based CLI automation. Use when the user asks WorkBuddy to deploy, publish, push live, create a Vercel preview deployment, create a Vercel production deployment, inspect a Vercel deployment, or return the deployed Vercel URL without relying on an interactive Vercel login or Vercel MCP.
---

# Vercel Deploy WorkBuddy

Use this skill to deploy a local project to Vercel from WorkBuddy. Prefer Vercel CLI with token-based authentication so the agent can run without an interactive browser login.

## Required Inputs

Before deploying, ensure the project directory is available locally and one of these authentication setups exists:

- `VERCEL_TOKEN` is exported in the shell environment.
- `.env` contains `VERCEL_TOKEN=...`.
- WorkBuddy has a configured secret or environment variable named `VERCEL_TOKEN`.

For the smoothest non-interactive deploy, also provide both:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If the project already has `.vercel/project.json`, the bundled script can read `orgId` and `projectId` from it.

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

## Safety Rules

- Never print or reveal `VERCEL_TOKEN`.
- Never pass the token through `--token`; export `VERCEL_TOKEN` and let the Vercel CLI read it.
- Do not modify `.vercel/` files manually.
- Do not run `git push` unless the user explicitly asks for a git-push deployment.
- Do not use claimable deployment endpoints as the primary path; those are only fallback demos and do not deploy directly into the user's own Vercel project.
- Do not curl the deployed site for content verification unless the user explicitly asks. Use `vercel inspect` for deployment status.

## Troubleshooting

- If `VERCEL_TOKEN` is missing, ask the user to add a Vercel access token to WorkBuddy's environment or the local `.env` file.
- If `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are missing and no `.vercel/project.json` exists, run `vercel link -y` only after confirming the intended Vercel project or team.
- If the CLI is missing, the script installs it through `npm install -g vercel`.
- If the build fails, run:
  ```bash
  vercel inspect <deployment-url> --logs
  ```
