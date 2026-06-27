# On-chain proofs (shelbynet)

MetaAsset's `real` mode was exercised against the live **Shelby** network. A blob was uploaded on-chain
(the SDK signs commitment transactions on Aptos and pays storage via the micropayment channel), then
read back and byte-verified.

## Run — 2026-06-27

| Field | Value |
| --- | --- |
| Network | `shelbynet` |
| Owner account | `0xf824bab2436e7f5f5fd46fc1de54be5af55fa15a75dafbb8c5a21d8d9b0745d0` |
| Blob name | `metaasset/proof_2026-06-27T22-48-28-593Z.glb` |
| BlobID | `0xf824…45d0/metaasset/proof_2026-06-27T22-48-28-593Z.glb` |
| Upload time | **9 865 ms** |
| Download time | **651 ms** |
| Upload SHA-256 | `b1e53ebf8a7f0d7b57ed7288bd146eee0250b3c24b4066a11304196a4735cb0a` |
| Download SHA-256 | `b1e53ebf8a7f0d7b57ed7288bd146eee0250b3c24b4066a11304196a4735cb0a` |
| Integrity | ✅ **match** (downloaded bytes identical to uploaded) |

An earlier run uploaded a 2 KB binary blob with the same result (download 673 ms, bytes `[0,1,2,3,…]`
verified).

## Verify it yourself (explorer)

- Blob: <https://explorer.shelby.xyz/shelbynet/account/0xf824bab2436e7f5f5fd46fc1de54be5af55fa15a75dafbb8c5a21d8d9b0745d0/blob/metaasset%2Fproof_2026-06-27T22-48-28-593Z.glb>
- Account blobs: <https://explorer.shelby.xyz/shelbynet/account/0xf824bab2436e7f5f5fd46fc1de54be5af55fa15a75dafbb8c5a21d8d9b0745d0/blobs>
- Aptos account: <https://explorer.aptoslabs.com/account/0xf824bab2436e7f5f5fd46fc1de54be5af55fa15a75dafbb8c5a21d8d9b0745d0?network=shelbynet>

## Reproduce

With a funded shelbynet account:

```ts
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node";

const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(process.env.SHELBY_SIGNER_PRIVATE_KEY) });
const client = new ShelbyClient({ network: Network.SHELBYNET });

await client.upload({
  blobData: new TextEncoder().encode("hello shelby"),
  signer: account,
  blobName: "demo/hello.txt",
  expirationMicros: (Date.now() + 30 * 86_400_000) * 1000,
});

const blob = await client.download({ account: account.accountAddress, blobName: "demo/hello.txt" });
// blob.readable → bytes; sha256 matches what you uploaded
```

Or in this app: set `NEXT_PUBLIC_SHELBY_MODE=real` + `SHELBY_SIGNER_PRIVATE_KEY` + `SHELBY_NETWORK`,
then upload via the Creator Portal and fetch via the Game Client.

> Notes: timings are single-sample on shelbynet. Upload includes erasure coding + on-chain commitment
> registration (one-time per blob); reads are the hot path (~0.65 s here). The Shelby GraphQL indexer
> requires an API key for anonymous-blocked queries, so tx-level enrichment isn't included here — the
> byte-verified round-trip + explorer links are the proof.
