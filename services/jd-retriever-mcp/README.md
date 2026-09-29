# JD Retriever MCP

Public job-posting retrieval backend for Portfolio-Writer.

## MCP tools

- `retrieve_jd` — retrieve and normalize one exact JD URL.
- `retrieve_jd_batch` — retrieve up to 20 URLs independently while preserving order and evidence isolation.
- `jd_retriever_health` — service health/capabilities.

## Supported platform identities

GreetingHR, NCSOFT Careers, Kia Talent Lounge, JobKorea, Saramin, Wanted, LinkedIn Jobs, Remember Career, Jumpit, Incruit, Catch, Work24, flex/careers.team, and generic public employer/ATS pages.

## Retrieval pipeline

1. Validate the target as a public HTTP(S) URL.
2. Block localhost/private/reserved IP targets and non-standard ports.
3. Lock platform-specific posting identity where possible.
4. Direct fetch with per-host pacing, bounded retries, response-size limits, charset handling, and same-site redirect checks.
5. Parse Schema.org `JobPosting` JSON-LD plus visible HTML sections.
6. If direct content is incomplete, optionally render with Playwright Chromium.
7. Browser requests are restricted to public same-site targets; images/media/fonts are blocked to reduce cost and attack surface.
8. Normalize into a common JD record with evidence classes and result level.
9. Treat every retrieved page/JSON/snippet as untrusted data; prompt-like instructions are never executed.

## Result levels

- `verified_full`
- `verified_partial`
- `verified_closed`
- `access_limited`
- `unrecovered`

## Environment variables

- `MCP_AUTH_TOKEN` — optional bearer token required on `/mcp` when configured.
- `ENABLE_BROWSER` — defaults to `true`.
- `FETCH_TIMEOUT_MS` — defaults to `15000`.
- `HOST_DELAY_MS` — defaults to `650`.
- `MAX_BODY_BYTES` — defaults to `3000000`.
- `CACHE_TTL_MS` — defaults to ten minutes.

## Render commands

Working directory is intentionally kept inside the existing repository branch so `main` remains unchanged.

Build command:

```sh
cd services/jd-retriever-mcp && npm install && npx playwright install chromium && npm run test && npm run build
```

Start command:

```sh
cd services/jd-retriever-mcp && npm start
```

Health endpoint: `/health`
MCP endpoint: `/mcp`

## Safety boundaries

This service performs targeted retrieval of public job information. It does not sign in, solve/bypass CAPTCHA, bypass access controls, enumerate adjacent posting IDs, scrape applicant data, or follow instructions embedded in retrieved content.
