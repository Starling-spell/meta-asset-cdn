"use client";

/**
 * Minimal Aptos wallet connect/disconnect control. Lists detected AIP-62 wallets and
 * connects on click. Used by the Creator Portal so registry writes can be signed.
 */
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function WalletBar() {
  const { connect, disconnect, account, connected, wallets } = useWallet();

  if (connected && account) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
        <span>
          <span className="uppercase text-accent2">aptos</span>{" "}
          <span className="mono">{shorten(account.address.toString())}</span>
        </span>
        <button className="btn-ghost py-1 text-xs" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  const installed = wallets.filter((w) => w.readyState === "Installed");
  const list = installed.length > 0 ? installed : wallets;

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-400">Connect an Aptos wallet to sign the registry write:</p>
      <div className="flex flex-wrap gap-2">
        {list.length === 0 ? (
          <span className="text-xs text-zinc-500">
            No Aptos wallet detected. Install Petra, Pontem, or Nightly.
          </span>
        ) : (
          list.map((w) => (
            <button key={w.name} className="btn-ghost text-sm" onClick={() => connect(w.name)}>
              {w.icon ? <img src={w.icon} alt="" className="h-4 w-4" /> : null}
              {w.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function shorten(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
