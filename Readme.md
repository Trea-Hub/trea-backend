# Trea Backend

Off-chain API server for **Trea**, an event registration and ticketing platform on Stellar/Soroban. This repo handles everything that shouldn't (or can't) live on-chain: event metadata, photo uploads, search, and indexing of contract state. It does **not** hold custody of funds or sign transactions on behalf of users — all payments, refunds, and registration happen directly between the frontend and the [Trea smart contract](../trea-contract).

> Status: early development.

---

## What this service does

- Stores event **metadata** the contract doesn't (title, description, cover image, location, tags).
- Stores and serves **event photos** uploaded by attendees after check-in.
- **Indexes** on-chain contract state (via Stellar RPC) into Postgres so the frontend can query "list of events," "who's registered," etc. without hitting the ledger on every page load.
- Handles **notifications** (email/reminders) — planned.
- Provides **search/filtering** across events.

## What this service explicitly does not do

- It does not custody funds. Registration payments go directly from the attendee's wallet into the smart contract's escrow — this backend never touches that money.
- It does not sign transactions on behalf of users. All contract calls (`register`, `refund`, `check_in`, `payout`) are built and signed client-side in the frontend via the user's own wallet.
- It is not the source of truth for registration or payment state — the contract is. This backend's copy of that data is a read-optimized cache, rebuildable from the chain at any time.

## Tech stack

- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** — event metadata, cached registration state, photo references
- **`@stellar/stellar-sdk`** — reading contract state and events from Stellar RPC
- Object storage (S3-compatible, or IPFS) for photo files — *decide and document once chosen*

## Repo structure

```
.
├── src/
│   ├── index.ts          # server entry point
│   ├── routes/
│   │   ├── events.ts      # event metadata CRUD, listing, search
│   │   └── photos.ts      # photo upload/list per event
│   ├── db/
│   │   ├── client.ts       # Postgres connection
│   │   └── migrations/     # schema migrations
│   └── stellar/
│       └── indexer.ts      # polls/subscribes to contract events, syncs to DB
├── .env.example
├── package.json
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A deployed Trea contract ID (Testnet, for local development)

### Setup

```bash
git clone https://github.com/<org>/trea-backend.git
cd trea-backend
npm install
cp .env.example .env   # fill in DB connection, contract ID, network
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `STELLAR_NETWORK` | `testnet` or `mainnet` |
| `STELLAR_RPC_URL` | Soroban RPC endpoint |
| `CONTRACT_ID` | Deployed `EventRegistration` contract ID |
| `PORT` | API server port (default `4000`) |

### Scripts

```bash
npm run dev      # start with hot reload (ts-node-dev)
npm run build    # compile TypeScript
npm start        # run compiled build
```

## Photo access rule

Only wallets that appear as a registered attendee for a given event (per the indexed contract state) should be able to view or upload photos for that event's page. This check should happen server-side against the indexed registration data — never trust a client-supplied "I'm registered" flag.

## Related repos

- Smart contract: [trea-contract](https://github.com/Trea-Hub/trea-contract)
- Frontend: [trea-frontend](https://github.com/Trea-Hub/trea-frontend)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).