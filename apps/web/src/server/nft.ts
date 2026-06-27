import "server-only";

/**
 * Server-side NFT ownership verification. Runs the on-chain reads (viem for EVM,
 * @solana/web3.js for Solana) where there's no CORS and RPC URLs stay private.
 * Called from /api/nft/verify.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { createPublicClient, getAddress, http } from "viem";
import { realGatesFor, type EvmGate, type SolanaGate } from "@/lib/nftGates";

const EVM_RPC_URL =
  process.env.EVM_RPC_URL ?? process.env.NEXT_PUBLIC_EVM_RPC_URL ?? "https://eth.llamarpc.com";
const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

const ERC721_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function verifyOwnershipServer(
  chain: "evm" | "solana",
  address: string,
  assetKey: string,
): Promise<boolean> {
  const gates = realGatesFor(assetKey, chain);

  // No real gate configured for this chain → open access.
  if (gates.length === 0) return true;

  for (const gate of gates) {
    const owns =
      gate.kind === "evm" ? await ownsEvm(address, gate) : await ownsSolana(address, gate);
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
