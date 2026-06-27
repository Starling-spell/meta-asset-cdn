"use client";

/**
 * Client providers mounted once at the root. Wraps the app in the Aptos wallet adapter
 * so any component can call `useWallet()` to sign + submit registry transactions.
 */
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

function resolveNetwork(): Network {
  const raw = (process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet").toLowerCase();
  switch (raw) {
    case "mainnet":
      return Network.MAINNET;
    case "devnet":
      return Network.DEVNET;
    case "local":
      return Network.LOCAL;
    default:
      return Network.TESTNET;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      // AIP-62 standard wallets (Petra, Pontem, Nightly, …) auto-register; no plugin list needed.
      autoConnect
      dappConfig={{ network: resolveNetwork() }}
      onError={(err) => console.error("[meta-asset wallet]", err)}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
