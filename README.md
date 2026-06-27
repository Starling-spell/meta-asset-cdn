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

📖 Full architecture walkthrough with source links: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Shelby integration

Wired against the real, published `@shelby-protocol/sdk` (v0.3.1). Two modes behind one typed adapter
in [`packages/shelby-client`](packages/shelby-client):

- **`mock`** (default) — in-memory client; the whole app runs end-to-end with zero credentials.
- **`real`** — on-chain. Uploads/reads go through the app's `/api/shelby/*` routes, which run the SDK
  server-side with a funded Aptos service account (signs commitments + pays storage via the Shelby
  micropayment channel). See [Going live](#going-live-with-real-shelby-on-chain).

Switch with `NEXT_PUBLIC_SHELBY_MODE`. App code only ever imports `@meta-asset/shelby-client` — never
the SDK directly — so the boundary stays in one place.

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

### Going live with real Shelby (on-chain)

Real mode is **fully wired** to `@shelby-protocol/sdk`. Uploads are on-chain: a server-held Aptos
service account signs blob commitments on Aptos and pays for storage (ShelbyUSD) via the micropayment
channel. Because that needs a private key, the SDK runs **only server-side** — the browser calls the
app's `/api/shelby/*` routes ([upload](apps/web/src/app/api/shelby/upload/route.ts),
[download](apps/web/src/app/api/shelby/download/route.ts)), which use
[src/server/shelby.ts](apps/web/src/server/shelby.ts).

A Shelby blob is addressed by **(owner account address, blobName)**; the app encodes that pair as the
registry `BlobID` string `"<owner>/<blobName>"`.

To enable it:

1. Create + **fund** an Aptos account on the target network (APT for gas, ShelbyUSD for storage). The
   SDK exposes `fundAccountWith{APT,ShelbyUSD}` and a faucet for `shelbynet`.
2. Set env (see [.env.example](apps/web/.env.example)) — server-side, never `NEXT_PUBLIC_`:
   - `NEXT_PUBLIC_SHELBY_MODE=real`
   - `SHELBY_SIGNER_PRIVATE_KEY=0x…` (the funded account)
   - `SHELBY_NETWORK=shelbynet` (or `testnet` / `local`)
3. Deploy. Uploads in the Creator Portal now write real blobs on-chain and log the `BlobID` to the
   Aptos registry; the Game Client streams them back through `/api/shelby/download`.

> The cross-chain account resolution for *paid reads* by non-Aptos wallets
> (`resolveShelbyAccount` in [crossChain.ts](apps/web/src/lib/crossChain.ts)) is still a stub — reads
> currently go through the server service account. Wire `@shelby-protocol/cross-chain-accounts` there
> when you want EVM/Solana wallets to pay for their own reads.

## Deploy to Vercel

Import the repo at [vercel.com/new](https://vercel.com/new) and set **Root Directory = `apps/web`**.
[vercel.json](vercel.json) supplies the rest:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/web` |
| Install | `pnpm install` (runs at the workspace root) |
| Build | `turbo run build --filter=@meta-asset/web` |
| Output | `.next` (relative to `apps/web`) |

`turbo` is invoked from inside `apps/web` and walks up to the repo-root `turbo.json`, building the web
app plus its workspace deps. Output lands in `apps/web/.next`, which `outputDirectory: ".next"` resolves
to correctly under the `apps/web` root.

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
