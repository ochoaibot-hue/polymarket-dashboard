# Scaffold sanity check

Date: 2026-04-25

## How to run

```bash
cd /Users/ocho/.openclaw/workspace/projects/polymarket-dashboard
npm install
npm run dev -- --host 127.0.0.1 --port 4173
# open http://127.0.0.1:4173
```

Production build:

```bash
npm run build
npm run preview
```

## What works

- `npm run dev` starts cleanly (Vite 8) and serves locally.
- `npm run build` succeeds with TypeScript strict compile + Vite bundle.
- Existing app scaffold already includes:
  - typed API layer (`src/lib/polymarket.ts`, Zod parsing)
  - scoring module (`src/lib/scoring.ts`)
  - dashboard view with sorting/filtering/charting (`src/App.tsx`)
  - polling via SWR (30s refresh)

## What breaks / gaps

- No hard build/runtime failures found.
- Build reports a warning: main JS chunk is ~618 kB (above 500 kB warning threshold).
- Data fetch is routed through `/api/markets`; this assumes proxy/rewrite support (works on Vercel via `vercel.json`, but can fail in plain static hosting without equivalent rewrite).

## Minimal next steps

1. Keep scaffold as-is for pipeline/dashboard work (no blocking changes needed).
2. If deploying outside Vercel, add equivalent `/api/*` proxy/rewrite in the target host.
3. Optional: split heavy dashboard modules (e.g., chart/table sections) with dynamic imports to reduce the large chunk warning.
4. As data pipeline grows, add a small `src/config.ts` for endpoint/version flags to keep data-source wiring centralized.
