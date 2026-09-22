# Community demo

Live: https://claude-vs-codex.shu971.workers.dev/

- index.html: comparison, four-choice voting, anonymous comments and reactions.
- worker.js: same-origin API with D1 bindings; HTML is currently a bundled Text module, not Static Assets.
- schema.sql: idempotent schema initialization. No voter or reactor deduplication.
- wrangler.jsonc: deployment configuration. With Wrangler installed and authenticated, run `wrangler d1 execute claude-codex-community --remote --file=schema.sql`, then `wrangler deploy`.

No AI API or key is used. All POST requests count, including repeated votes and reactions. Comments appear immediately, newest first, 20 per page. Posting and voting update the local display; other visitors use the refresh button or reload to get current data. Comments are plain text, 1–1000 characters. There is no rating, feedback form, login, moderation UI, or automatic GitHub deployment.

Verified against the public endpoint: all four vote choices twice; anonymous comment persisted; like and dislike twice each persisted; invalid choice and empty comments rejected with 400; page returned 200. Test records were removed. Native browser testing was blocked by the local Windows sandbox startup error.
