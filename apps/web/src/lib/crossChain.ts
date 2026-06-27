/**
 * Cross-chain wallet connector for the Game Client.
 *
 * Shelby reads are paid and may require a Shelby-readable account context. For users on
 * non-Aptos chains, `@shelby-protocol/cross-chain-accounts` is expected to translate a
 * Solana/EVM signer into that context. As with the storage SDK, this package's exact
 * surface is NOT yet publicly verifiable — every call into it is isolated here and marked
 * "SHELBY INTEGRATION POINT". The UI depends only on the `ResolvedAccount` type below.
 */
import type { ShelbyAccountContext } from "@meta-asset/shelby-client";

export type SupportedChain = "solana" | "evm";

export interface ResolvedAccount {
  readonly chain: SupportedChain;
  readonly address: string;
  /** EVM chain id (decimal), when chain === "evm". */
  readonly chainId?: number;
  /** Pass this into shelby.read({ account }) — opaque by design. */
  readonly shelbyContext: ShelbyAccountContext;
}

/** Minimal structural types for injected wallets, to avoid `any`. */
interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
interface SolanaProvider {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  isPhantom?: boolean;
}
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    solana?: SolanaProvider;
  }
}

/** Connect an EVM wallet (MetaMask, etc.) and resolve a Shelby account context. */
export async function connectEvm(): Promise<ResolvedAccount> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No EVM wallet found. Install MetaMask (or set up wagmi connectors).");
  }
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) throw new Error("EVM wallet returned no account.");

  const chainIdHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
  const chainId = Number.parseInt(chainIdHex, 16);

  const shelbyContext = await resolveShelbyAccount("evm", address, window.ethereum);
  return { chain: "evm", address, chainId, shelbyContext };
}

/** Connect a Solana wallet (Phantom, etc.) and resolve a Shelby account context. */
export async function connectSolana(): Promise<ResolvedAccount> {
  if (typeof window === "undefined" || !window.solana) {
    throw new Error("No Solana wallet found. Install Phantom (or wire @solana/wallet-adapter).");
  }
  const { publicKey } = await window.solana.connect();
  const address = publicKey.toString();

  const shelbyContext = await resolveShelbyAccount("solana", address, window.solana);
  return { chain: "solana", address, shelbyContext };
}

/**
 * Translate a non-Aptos signer into a Shelby-readable account context.
 *
 * SHELBY INTEGRATION POINT — replace the body with the real
 * `@shelby-protocol/cross-chain-accounts` flow once its API is confirmed. The expected
 * shape is roughly: derive/sign a Shelby principal from the origin-chain signer, returning
 * an authorization the RPC node accepts on paid reads.
 */
async function resolveShelbyAccount(
  chain: SupportedChain,
  address: string,
  signer: unknown,
): Promise<ShelbyAccountContext> {
  try {
    // Optional dependency: string specifier so this scaffold compiles without it installed.
    const specifier = "@shelby-protocol/cross-chain-accounts";
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier)) as {
      resolveAccount?: (args: { chain: SupportedChain; address: string; signer: unknown }) => Promise<unknown>;
    };

    if (typeof mod.resolveAccount === "function") {
      const authorization = await mod.resolveAccount({ chain, address, signer });
      return { chain, address, authorization };
    }
  } catch {
    // Package not installed / API differs — fall through to an unauthenticated context
    // so the mock read path still works in development.
  }

  // Dev fallback: no real authorization. Works against the mock Shelby client.
  return { chain, address, authorization: undefined };
}
