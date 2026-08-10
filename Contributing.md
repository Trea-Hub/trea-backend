# Contributing to Trea Backend

Thanks for considering contributing. This repo is the off-chain API server for Trea — it handles event metadata, photos, search, and indexing of on-chain state. It does not custody funds or sign transactions; if you're looking to work on payment/refund/registration logic itself, that lives in [trea-contract](https://github.com/<org>/trea-contract).

## Code of conduct

Be respectful, assume good faith, and keep disagreements about the code, not the person. Harassment or abusive behavior toward maintainers or other contributors will result in removal from the project and its communication channels.

## Ways to contribute

- New API endpoints (event search/filtering, notifications, etc.)
- Improving the on-chain indexer (reliability, catching up after downtime, handling reorgs/failed transactions gracefully)
- Photo upload/storage handling
- Bug fixes and test coverage
- Documentation

If you found this repo through **Drips Wave**, issues there are tagged with a complexity/point value (Trivial / Medium / High). Comment on the issue to claim it before starting work.

## Project setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Testnet contract ID from [trea-contract](https://github.com/<org>/trea-contract) (deploy your own, or use the shared dev contract ID if documented in Discord/README)

### Setup

```bash
git clone https://github.com/<org>/trea-backend.git
cd trea-backend
npm install
cp .env.example .env
npm run dev
```

## Branching and commits

- Branch off `main`: `git checkout -b feat/short-description` or `fix/short-description`.
- Keep commits scoped to one logical change.
- Write commit messages in the imperative mood: `Add event search endpoint`, not `Added`.

## Coding conventions

- TypeScript throughout — avoid `any` where a real type is knowable.
- Routes stay thin — validation and business logic belong in a service/helper function, not inline in the route handler, so it's testable without spinning up an HTTP server.
- **Never trust client-supplied claims about on-chain state.** For example, when checking whether a wallet is allowed to view/upload event photos, verify against the indexed registration data in Postgres (which is itself synced from the contract), not a flag passed in the request body.
- Any new environment variable must be added to `.env.example` with a comment explaining what it's for.
- Keep the indexer idempotent — re-running it against already-synced data should not create duplicates or corrupt state. This matters because indexers need to be safely re-run after downtime.

## Tests

- New endpoints need at least one test for the success path and one for an auth/validation failure path.
- Indexer logic should be tested against recorded/mocked contract events, not a live network, so tests are deterministic and don't depend on Testnet being up.
- Run the full suite before opening a PR: `npm test`.

## Pull requests

1. Make sure the app builds and tests pass locally (`npm run build`, `npm test`).
2. Reference the issue you're closing, e.g. `Closes #12`.
3. Describe **what changed and why**, especially for indexer or auth-related changes.
4. Keep PRs focused on one issue.
5. A maintainer will review, may request changes, and will merge once checks and review pass.

## Reporting bugs

Open an issue with:
- Expected vs. actual behavior
- Steps to reproduce
- Full error output/stack trace
- Environment: Node version, OS, whether it's Testnet or Mainnet-related

## Reporting security issues

**Do not open a public issue** for anything involving unauthorized data access (e.g. viewing photos for events you're not registered for) or indexer manipulation. Contact the maintainers privately first. *(Add a security contact once one exists.)*

## Questions

Open a discussion or issue if something here is unclear.