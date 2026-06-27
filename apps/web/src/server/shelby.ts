import "server-only";

/**
 * Server-side Shelby integration. This is the ONLY place the real
 * `@shelby-protocol/sdk` runs, and the ONLY place the service account's private key is
 * used. Never import this from a client component.
 *
 * On the real network, uploads are on-chain: the service `Account` signs commitment
 * transactions on Aptos and pays for storage (ShelbyUSD) via the micropayment channel.
 * The account must be funded on the target network before uploads succeed.
 */
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient, type ShelbyNetwork } from "@shelby-protocol/sdk/node";

export interface ServerShelby {
  readonly client: ShelbyClient;
  readonly account: Account;
  readonly ownerAddress: string;
}

let cached: ServerShelby | null = null;

function resolveNetwork(): ShelbyNetwork {
  const raw = (process.env.SHELBY_NETWORK ?? "shelbynet").toLowerCase();
  switch (raw) {
    case "testnet":
      return Network.TESTNET;
    case "local":
      return Network.LOCAL;
    case "shelbynet":
    default:
      return Network.SHELBYNET;
  }
}

export function getServerShelby(): ServerShelby {
  if (cached) return cached;

  const pk = process.env.SHELBY_SIGNER_PRIVATE_KEY;
  if (!pk) {
    throw new Error(
      "SHELBY_SIGNER_PRIVATE_KEY is not set. Real Shelby uploads need a funded Aptos account. " +
        "Set it (and SHELBY_NETWORK) in the environment, or use NEXT_PUBLIC_SHELBY_MODE=mock.",
    );
  }

  const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(pk) });
  const client = new ShelbyClient({
    network: resolveNetwork(),
    ...(process.env.SHELBY_RPC_URL ? { rpc: { baseUrl: process.env.SHELBY_RPC_URL } } : {}),
  });

  cached = { client, account, ownerAddress: account.accountAddress.toString() };
  return cached;
}

/** Default blob lifetime: 30 days, expressed as microseconds since the Unix epoch. */
export function defaultExpirationMicros(): number {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return (Date.now() + THIRTY_DAYS_MS) * 1000;
}
