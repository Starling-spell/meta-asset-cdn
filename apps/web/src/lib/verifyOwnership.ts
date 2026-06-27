import type { ResolvedAccount } from "./crossChain";

/**
 * Ask the server whether this wallet owns an NFT gating the asset. The on-chain read
 * runs server-side (see /api/nft/verify) to avoid browser CORS with public RPCs.
 */
export async function verifyOwnership(account: ResolvedAccount, assetKey: string): Promise<boolean> {
  const res = await fetch("/api/nft/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chain: account.chain, address: account.address, assetKey }),
  });
  if (!res.ok) throw new Error(`Ownership check failed: ${await res.text()}`);
  const { owns } = (await res.json()) as { owns: boolean };
  return owns;
}
