/**
 * NFT access-gate configuration for the Game Client.
 *
 * Pure data + helpers — safe to import on the client. The actual on-chain ownership
 * reads happen server-side (see src/server/nft.ts, called via /api/nft/verify) to avoid
 * browser CORS issues with public RPCs and to keep RPC URLs/keys off the client.
 *
 * Each asset key maps to one or more gates. A wallet holding a token from ANY real gate
 * matching its chain may fetch the asset. Placeholder gates (the example zero-address /
 * wrapped-SOL mint below) are ignored, so an asset with only placeholders is treated as
 * OPEN — handy for the mock/demo flow until you wire real collections.
 */
import type { Address } from "viem";

export interface EvmGate {
  readonly kind: "evm";
  readonly chainId: number;
  readonly contract: Address;
}

export interface SolanaGate {
  readonly kind: "solana";
  readonly mint: string;
}

export type NftGate = EvmGate | SolanaGate;

/** Example placeholders — replace with your real ERC-721 collection / SPL mint. */
export const ZERO_EVM_ADDRESS = "0x0000000000000000000000000000000000000000";
export const PLACEHOLDER_SOL_MINT = "So11111111111111111111111111111111111111112";

export const NFT_GATES: Record<string, readonly NftGate[]> = {
  "studioX::hero_mesh": [
    { kind: "evm", chainId: 1, contract: ZERO_EVM_ADDRESS },
    { kind: "solana", mint: PLACEHOLDER_SOL_MINT },
  ],
};

/** A gate that still points at an example placeholder — not enforceable. */
export function isPlaceholderGate(gate: NftGate): boolean {
  return gate.kind === "evm"
    ? gate.contract.toLowerCase() === ZERO_EVM_ADDRESS
    : gate.mint === PLACEHOLDER_SOL_MINT;
}

/** Real (non-placeholder) gates configured for an asset on the given chain. */
export function realGatesFor(assetKey: string, chain: "evm" | "solana"): NftGate[] {
  return (NFT_GATES[assetKey] ?? []).filter((g) => g.kind === chain && !isPlaceholderGate(g));
}
