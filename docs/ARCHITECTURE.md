# Architecture

Browser → Next.js App Router → validated route handlers → Prisma → PostgreSQL.

- `lib/ingest.ts`: bounded input validation, transactional upserts, source adapters, snapshots and health logs. Remote fetching is restricted to approved HTTPS RSS hosts or fixed YouTube endpoint. Manual imports never fetch arbitrary URLs.
- `lib/domain.ts`: pure, independently tested normalization, missing-data handling, comparable snapshot growth, keyword clustering and recommendation weights.
- `lib/scoring.ts`: append-only scoring history with analysis metadata, weights and scoring version. Data confidence is an explainable heuristic, not validated probability.
- `lib/creative.ts`: server-only OpenAI adapter with JSON validation and separate observations/inferences/suggestions. Distinct rule-based fallback ideas are identified explicitly. AI API failures do not masquerade as successful AI output.
- `app/api/[...path]/route.ts`: same-host write protection, schema validation, configuration-presence responses, library versioning, reports and exports. No secrets returned to the browser.
- `app/radar.tsx`: shared navigation, filters, evidence views, source controls, persistent idea workflow and management dialogs. Source-derived content is rendered as text, not injected HTML.
- `scripts/database.ts`: real persistent local PostgreSQL for development; start again after restoring a cloud snapshot. Production can supply another PostgreSQL connection string.
- `scripts/sync.ts`: sequential, bounded retries; the deployment scheduler controls cadence and budget. No privileged system scheduler changes.

Tables: Source, SyncLog, Trend, Snapshot, ScoreRecord, Idea, IdeaVersion, Watch, Setting. Trend identity is source + market + stable source key (URL by default). A country's feed does not establish content creator location or local cultural relevance. Score records preserve the then-current assessment; idea versions preserve previous edits. Source collections are provenance-bearing observations, never labeled model-generated facts.

The first version intentionally operates as an internal single-user tool. Authentication, RBAC, background job coordination, production migrations, retention policies, automated platform-specific rank connectors, video upload/storage and statistical causal analysis remain separate engineering work.
