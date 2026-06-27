"use client";

/**
 * DELIVERABLE 4 — Game Client cross-chain reader.
 *
 * Flow:
 *   1. Connect a non-Aptos wallet (Solana or EVM) → resolve a Shelby account context
 *      via @shelby-protocol/cross-chain-accounts (see lib/crossChain.ts).
 *   2. (Simulated) prove the player owns the NFT gating this asset.
 *   3. Look up the asset's BlobID in the Aptos registry.
 *   4. Read the blob from the nearest Shelby RPC node and render it, surfacing latency.
 */
import { useCallback, useState } from "react";
import type { BlobID } from "@meta-asset/shelby-client";
import { connectEvm, connectSolana, type ResolvedAccount, type SupportedChain } from "@/lib/crossChain";
import { verifyOwnership } from "@/lib/nftGates";
import { formatBytes, getRegistry, getShelby } from "@/lib/meta-asset";

interface FetchedAsset {
  readonly blobId: BlobID;
  readonly objectUrl: string;
  readonly sizeBytes: number;
  readonly latencyMs: number;
}

export function CrossChainFetch() {
  const [account, setAccount] = useState<ResolvedAccount | null>(null);
  const [assetKey, setAssetKey] = useState("studioX::hero_mesh");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<FetchedAsset | null>(null);

  const connect = useCallback(async (chain: SupportedChain) => {
    setError(null);
    try {
      setAccount(chain === "evm" ? await connectEvm() : await connectSolana());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const fetchAsset = useCallback(async () => {
    if (!account) return;
    setBusy(true);
    setError(null);
    setAsset(null);
    try {
      // 1. Prove NFT ownership — real on-chain read (ERC-721 / SPL). Keys with no
      //    configured gate are open (see lib/nftGates.ts).
      const owns = await verifyOwnership(account, assetKey.trim());
      if (!owns) throw new Error("This wallet does not own the NFT required to access this asset.");

      // 2. Resolve the BlobID from the on-chain registry.
      const registry = getRegistry();
      const blobId = await registry.getBlobId(assetKey.trim());
      if (!blobId) throw new Error(`No asset registered under key "${assetKey.trim()}".`);

      // 3. Read from Shelby — paid read uses the resolved cross-chain account context.
      const shelby = getShelby();
      const { blob, latencyMs } = await shelby.read(blobId, { account: account.shelbyContext });

      setAsset({
        blobId,
        objectUrl: URL.createObjectURL(blob),
        sizeBytes: blob.size,
        latencyMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [account, assetKey]);

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Fetch asset (cross-chain)</h2>
        <p className="text-sm text-zinc-400">Connect a Solana or EVM wallet — no Aptos account needed.</p>
      </div>

      {account ? (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
          <span>
            <span className="uppercase text-accent2">{account.chain}</span>{" "}
            <span className="mono">{shorten(account.address)}</span>
          </span>
          <button className="btn-ghost py-1 text-xs" onClick={() => setAccount(null)}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => connect("evm")}>
            Connect EVM
          </button>
          <button className="btn-ghost" onClick={() => connect("solana")}>
            Connect Solana
          </button>
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Asset key</span>
        <input
          value={assetKey}
          onChange={(e) => setAssetKey(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <button className="btn" disabled={!account || busy} onClick={fetchAsset}>
        {busy ? "Fetching…" : "Verify & Fetch from Shelby"}
      </button>

      {error && <p className="text-sm text-red-400">⚠ {error}</p>}

      {asset && (
        <div className="rounded-xl border border-accent2/30 bg-accent2/5 p-4">
          <p className="text-sm font-medium text-accent2">
            Delivered in {asset.latencyMs} ms · {formatBytes(asset.sizeBytes)}
          </p>
          <p className="mono mt-1 text-zinc-400">{asset.blobId}</p>
          <a className="btn mt-3 text-sm" href={asset.objectUrl} download={`${assetKey.trim()}.glb`}>
            Download asset
          </a>
          {/* A real game client would feed objectUrl into a 3D loader (three.js / model-viewer). */}
        </div>
      )}
    </div>
  );
}

function shorten(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
