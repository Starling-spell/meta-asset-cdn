# Meta-Asset

A universal, high-speed decentralized **CDN for Web3 game studios**. Heavy 3D game assets
(`.glb` / `.fbx`) are stored as blobs on the **[Shelby Protocol](https://shelby.xyz)** (decentralized
hot storage on Aptos) and indexed by an on-chain **Asset Registry** Move contract. Players on any
chain — Solana, EVM, or Aptos — fetch assets with Web2-grade read speeds.

```
Creator ──upload──▶ Shelby ──BlobID──▶ Aptos Registry ◀──resolve── Game Client (Solana/EVM wallet)
                                                                        │
                                                                        └─read──▶ Shelby RPC node
```

## ⚠️ Status of the Shelby SDK integration

The packages `@shelby-protocol/sdk` and `@shelby-protocol/cross-chain-accounts`, the `BlobID` format,
and exact method signatures are **not yet publicly verifiable**. Shelby is real (Aptos Labs + Jump
Crypto), but this scaffold infers the SDK surface from the public docs. To stay honest and runnable:

- Every Shelby call is isolated behind a typed **adapter** in [`packages/shelby-client`](packages/shelby-client).
- A **mock client** (default) makes the whole app run end-to-end with zero credentials.
- The real-SDK impl ([`realClient.ts`](packages/shelby-client/src/realClient.ts)) and the cross-chain
  resolver ([`crossChain.ts`](apps/web/src/lib/crossChain.ts)) mark every inferred call with
  `// SHELBY INTEGRATION POINT — verify against official docs`.

When the real SDK is confirmed, you adapt **those files only**; nothing else in the app changes.

## Layout

| Path | What |
| --- | --- |
| `apps/web` | Next.js 15 app — Creator Portal (`/creator`) + Game Client (`/play`) |
| `packages/shelby-client` | The Shelby adapter (interface + real + mock) — the only place the Shelby SDK is touched |
| `packages/registry-sdk` | Typed client for the Asset Registry Move contract |
| `packages/tsconfig` | Shared TypeScript presets |
| `contracts/asset_registry` | Aptos Move package: asset key → BlobID registry |

## Getting started

```bash
# pnpm via corepack (ships with Node 16.13+)
corepack enable pnpm

# install the workspace
pnpm install

# run the web app (mock Shelby — no credentials needed)
pnpm dev
#   → http://localhost:3000/creator  (upload returns a BlobID)
#   → http://localhost:3000/play     (connect wallet, fetch the asset)
```

Other scripts: `pnpm build`, `pnpm typecheck`, `pnpm lint` (all via Turborepo).

### Going live with real Shelby

1. `cp apps/web/.env.example apps/web/.env.local` and set `NEXT_PUBLIC_SHELBY_MODE=real` +
   `NEXT_PUBLIC_SHELBY_RPC_URL`.
2. Install the real SDK: `pnpm --filter @meta-asset/shelby-client add @shelby-protocol/sdk`.
3. Reconcile the `SHELBY INTEGRATION POINT` markers in `realClient.ts` / `crossChain.ts` with the
   confirmed API.

## Deploy to Vercel

The repo is Vercel-ready via [vercel.json](vercel.json) (pnpm + Turborepo monorepo). Import the repo
at [vercel.com/new](https://vercel.com/new) — no manual settings needed:

- **Install:** `pnpm install --frozen-lockfile` (Vercel runs pnpm via the `packageManager` field)
- **Build:** `turbo run build --filter=@meta-asset/web`
- **Output:** `apps/web/.next`

It deploys and runs **out of the box** in mock mode (no env vars) — pages render and the upload demo
returns a mock BlobID. To enable the real integrations, add these Environment Variables in the Vercel
project (see [apps/web/.env.example](apps/web/.env.example)):

| Variable | Needed for |
| --- | --- |
| `NEXT_PUBLIC_SHELBY_MODE=real` + `NEXT_PUBLIC_SHELBY_RPC_URL` | Real Shelby reads/writes |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` + `NEXT_PUBLIC_APTOS_NETWORK` | On-chain registry (Creator/Game) |
| `NEXT_PUBLIC_EVM_RPC_URL` / `NEXT_PUBLIC_SOLANA_RPC_URL` | Real NFT-ownership checks (defaults: public RPCs) |

## Smart contract

```bash
cd contracts/asset_registry
aptos move compile                       # requires the Aptos CLI
aptos move test                          # runs the bundled unit test
aptos move publish --named-addresses meta_asset=0x<your-account>
```

Then set `NEXT_PUBLIC_REGISTRY_ADDRESS` to the publishing address and call `init_registry` once.

## Wallets & on-chain writes

The Creator Portal is wired to a **real** Aptos wallet via `@aptos-labs/wallet-adapter-react`
(`AptosWalletAdapterProvider` in [providers.tsx](apps/web/src/app/providers.tsx)). Uploading signs a
real `register_asset` transaction with the connected wallet — no stub. AIP-62 standard wallets (Petra,
Pontem, Nightly) and Aptos Connect keyless (Google/Apple) auto-register; no plugin list needed.

`@aptos-labs/ts-sdk` is pinned to **5.2.1** across the workspace — the overlap that satisfies the real
`@shelby-protocol/sdk` (`^5.2.1 || ^6`) and the Aptos wallet-standard (`^3 || ^4 || ^5`).

The Game Client's cross-chain (Solana/EVM) wallet flow and NFT-ownership check remain mocked — those
are marked `TODO(integration)` / `SHELBY INTEGRATION POINT`.

## Out of scope (scaffold)

Real Shelby payment-channel/storage-fee settlement, production NFT-ownership proofs (Game Client),
auth, CI/CD, and tests beyond typecheck.
