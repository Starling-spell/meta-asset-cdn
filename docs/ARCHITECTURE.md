# Building with MetaAsset: Cross-Chain 3D Asset CDN

MetaAsset is a decentralized CDN for Web3 games. It uses the **Shelby Protocol** for hot storage and
**Aptos** for on-chain state, so developers can store heavy 3D assets (`.glb`, `.fbx`) cheaply while
serving players on any chain (Solana, EVM, or Aptos) with Web2-grade read speeds.

This guide describes the architecture **as actually implemented in this repo**, with links to the
source. Where the design differs from the "obvious" approach, the reason is called out.

---

## Architecture overview

Three core components:

1. **Registry Contract (Aptos Move)** — a lookup table mapping a unique `asset_key` → Shelby `BlobID`.
   See [`contracts/asset_registry/sources/asset_registry.move`](../contracts/asset_registry/sources/asset_registry.move).
2. **Creator Portal (write)** — developers upload a 3D asset and write the resulting `BlobID` to the
   registry. UI: [`UploadAsset.tsx`](../apps/web/src/components/UploadAsset.tsx).
3. **Game Client (read)** — players connect a native wallet (Solana/EVM/Aptos), prove NFT ownership,
   resolve the registry to a `BlobID`, and stream the asset. UI:
   [`CrossChainFetch.tsx`](../apps/web/src/components/CrossChainFetch.tsx).

### Key implementation fact: the Shelby SDK runs server-side

On the real network a Shelby upload is **on-chain** — a funded Aptos account signs blob commitments
and pays for storage via the micropayment channel. That private key must never reach the browser, so
`@shelby-protocol/sdk` runs **only on the server** ([`src/server/shelby.ts`](../apps/web/src/server/shelby.ts)).
The browser talks to thin app API routes instead. App code never imports the Shelby SDK directly — it
goes through the [`@meta-asset/shelby-client`](../packages/shelby-client) adapter, which has a `mock`
mode (default, zero-cred) and a `real` mode (HTTP → the API routes).

### How a blob is addressed

A Shelby blob is identified by **(owner account address, blobName)** — not an opaque hash. MetaAsset
encodes that pair into the registry `BlobID` string as `"<owner>/<blobName>"`
(the owner is a `0x`-hex address with no `/`, so the first `/` is the delimiter).

---

## Step-by-step implementation

### 1. The Aptos registry contract

A Move module ([`asset_registry.move`](../contracts/asset_registry/sources/asset_registry.move)) keeps
the verifiable link between a logical asset and its physical Shelby location.

- **Write:** `register_asset(key, blob_id, content_hash, size_bytes)` — owner-gated upsert; emits
  `AssetRegistered`.
- **Read:** `#[view] get_blob_id(registry_addr, key)` — gas-free, walletless lookup.

The typed client is [`@meta-asset/registry-sdk`](../packages/registry-sdk): `getBlobId()` reads via the
view function; `buildRegisterAssetPayload()` returns an entry-function payload the **caller** signs
with their own Aptos wallet (the SDK holds no keys).

### 2. The Creator Portal (upload flow)

1. **Select** a `.glb`/`.fbx` file.
2. **Store on Shelby** — the browser POSTs the file to
   [`/api/shelby/upload`](../apps/web/src/app/api/shelby/upload/route.ts). The route runs the SDK with
   the server service account: `client.upload({ blobData, signer, blobName, expirationMicros })`,
   returning `{ owner, blobName, contentHash, sizeBytes }`. The portal forms the `BlobID` from
   `owner/blobName`.
   - In **mock** mode there's no server call — the in-memory client returns a hash-derived id, so the
     whole flow runs with zero credentials.
3. **Log on-chain** — the portal builds the `register_asset` payload and the developer signs it with
   their connected Aptos wallet (`@aptos-labs/wallet-adapter-react`; provider in
   [`providers.tsx`](../apps/web/src/app/providers.tsx)).

### 3. The Game Client (cross-chain fetching)

The player does **not** need an Aptos account to consume data.

1. **Authenticate** — connect MetaMask (EVM) or Phantom (Solana). See
   [`crossChain.ts`](../apps/web/src/lib/crossChain.ts).
2. **Verify ownership** — the client POSTs `{ chain, address, assetKey }` to
   [`/api/nft/verify`](../apps/web/src/app/api/nft/verify/route.ts). On-chain reads (viem for EVM,
   `@solana/web3.js` for Solana) run **server-side** ([`server/nft.ts`](../apps/web/src/server/nft.ts))
   to avoid browser CORS and keep RPC URLs private. Gate config lives in
   [`nftGates.ts`](../apps/web/src/lib/nftGates.ts); assets with only placeholder gates are open access.
3. **Resolve** — read-only query to the registry view function → `BlobID`.
4. **Stream** — fetch the blob through
   [`/api/shelby/download`](../apps/web/src/app/api/shelby/download/route.ts) (`owner` + `blobName`
   query params), which streams from the nearest Shelby RPC node. The UI surfaces the measured latency.

> **Why a server proxy for reads instead of fetching "directly from RPC nodes" in the browser?**
> Reads on Shelby are *paid*; the download route lets the service account settle payment and keeps the
> RPC contract server-side. To let non-Aptos wallets pay for their **own** reads, wire
> `@shelby-protocol/cross-chain-accounts` into `resolveShelbyAccount` (currently a stub in
> [`crossChain.ts`](../apps/web/src/lib/crossChain.ts)).

---

## Request flow (real mode)

```
Creator Portal (browser)                Game Client (browser)
   │ POST file                              │ POST {chain,address,assetKey}
   ▼                                        ▼
/api/shelby/upload  ──SDK──▶ Shelby      /api/nft/verify ──viem/web3──▶ EVM/Solana RPC
   │ {owner,blobName}            ▲           │ {owns}
   ▼                            (pays)       ▼
Aptos registry  ◀── wallet sign           Aptos registry view ──▶ BlobID
 register_asset                             │
                                            ▼
                                /api/shelby/download ──SDK──▶ Shelby RPC ──▶ asset bytes
```

---

## Why this architecture?

- **Cost-effective storage** — heavy files on a smart-contract chain are prohibitively expensive;
  Shelby is purpose-built hot storage. The chain only holds the small `asset_key → BlobID` mapping.
- **Cross-chain compatibility** — storage network is decoupled from the player's wallet network, so
  MetaAsset serves ecosystems beyond Aptos.
- **Sub-second reads** — Shelby's dedicated-fiber + erasure-coded design loads in-game models at
  S3-like speed. (Measured ~0.7 s for a small blob round-trip on shelbynet in testing.)

---

## Status

Real on-chain upload + download is verified working on **shelbynet**. To run real mode, set
`NEXT_PUBLIC_SHELBY_MODE=real` plus a funded `SHELBY_SIGNER_PRIVATE_KEY` and `SHELBY_NETWORK` — see the
[README](../README.md#going-live-with-real-shelby-on-chain) and
[`.env.example`](../apps/web/.env.example). Mock mode is the default and needs no credentials.
