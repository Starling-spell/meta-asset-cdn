/**
 * NFT access gates + real on-chain ownership verification for the Game Client.
 *
 * Each asset key maps to one or more NFT gates. A wallet that holds a token from ANY
 * gate matching its chain may fetch the asset. Ownership is read live on-chain:
 *   • EVM    → viem `readContract` ERC-721 `balanceOf(owner) > 0`
 *   • Solana → @solana/web3.js parsed token accounts for the gate mint, amount > 0
 *
 * Keys with no configured gate are treated as OPEN (no NFT required) so mock-uploaded
 * assets stay fetchable in dev.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { createPublicClient, getAddress, http, type Address } from "viem";
import type { ResolvedAccount } from "./crossChain";

export interface EvmGate {
  readonly kind: "evm";
  /** Origin chain id (used to document/route; reads use NEXT_PUBLIC_EVM_RPC_URL). */
  readonly chainId: number;
  readonly contract: Address;
}

export interface SolanaGate {
  readonly kind: "solana";
  readonly mint: string;
}

export type NftGate = EvmGate | SolanaGate;

/**
 * Asset key → gates. Replace the placeholder collection/mint with real ones for your
 * game. Example shows a single asset gated by either an Ethereum collection or a Solana
 * mint.
 */
export const NFT_GATES: Record<string, readonly NftGate[]> = {
  "studioX::hero_mesh": [
    // Example only — swap for your real ERC-721 collection / SPL mint.
    { kind: "evm", chainId: 1, contract: "0x0000000000000000000000000000000000000000" },
    { kind: "solana", mint: "So11111111111111111111111111111111111111112" },
  ],
};

const EVM_RPC_URL = process.env.NEXT_PUBLIC_EVM_RPC_URL ?? "https://eth.llamarpc.com";
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

const ERC721_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** True if any gate for this asset (matching the wallet's chain) is satisfied. */
export async function verifyOwnership(account: ResolvedAccount, assetKey: string): Promise<boolean> {
  const gates = (NFT_GATES[assetKey] ?? []).filter((g) => g.kind === account.chain);

  // No gate configured for this chain → open access.
  if (gates.length === 0) return true;

  for (const gate of gates) {
    const owns =
      gate.kind === "evm" ? await ownsEvm(account.address, gate) : await ownsSolana(account.address, gate);
    if (owns) return true;
  }
  return false;
}

async function ownsEvm(owner: string, gate: EvmGate): Promise<boolean> {
  const client = createPublicClient({ transport: http(EVM_RPC_URL) });
  const balance = await client.readContract({
    address: gate.contract,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: [getAddress(owner)],
  });
  return balance > 0n;
}

async function ownsSolana(owner: string, gate: SolanaGate): Promise<boolean> {
  const conn = new Connection(SOLANA_RPC_URL, "confirmed");
  const res = await conn.getParsedTokenAccountsByOwner(new PublicKey(owner), {
    mint: new PublicKey(gate.mint),
  });
  return res.value.some((acc) => {
    const info = (acc.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } }).parsed?.info;
    return BigInt(info?.tokenAmount?.amount ?? "0") > 0n;
  });
}
