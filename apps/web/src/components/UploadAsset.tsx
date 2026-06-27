"use client";

/**
 * DELIVERABLE 3 — Creator Portal upload flow.
 *
 * 1. Pick a heavy 3D asset (.glb/.fbx).
 * 2. Upload it to Shelby via the adapter → receive a BlobID + content hash.
 * 3. Build the Aptos registry `register_asset` payload and (TODO) sign it with the
 *    creator's Aptos wallet so the key → BlobID mapping is recorded on-chain.
 *
 * The Shelby + registry calls go exclusively through @meta-asset/* packages — this
 * component knows nothing about the underlying SDKs.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { BlobID, UploadResult } from "@meta-asset/shelby-client";
import { formatBytes, getRegistry, getShelby } from "@/lib/meta-asset";
import { WalletBar } from "./WalletBar";

const ACCEPTED = ".glb,.fbx,.gltf";

type Phase =
  | { status: "idle" }
  | { status: "uploading"; fraction: number }
  | { status: "registering"; result: UploadResult }
  | { status: "done"; result: UploadResult; blobId: BlobID; txHash: string }
  | { status: "error"; message: string };

export function UploadAsset() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [assetKey, setAssetKey] = useState("");
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase.status === "uploading" || phase.status === "registering";
  const canSubmit = useMemo(
    () => file !== null && assetKey.trim().length > 0 && connected && !busy,
    [file, assetKey, connected, busy],
  );

  const onPickFile = useCallback((f: File | null) => {
    setFile(f);
    setPhase({ status: "idle" });
    // Default the registry key to the filename if the user hasn't set one.
    setAssetKey((prev) => prev || (f ? f.name.replace(/\.[^.]+$/, "") : ""));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!file) return;
    if (!connected || !account) {
      setPhase({ status: "error", message: "Connect an Aptos wallet first." });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // --- 1. Upload to Shelby ------------------------------------------------
      setPhase({ status: "uploading", fraction: 0 });
      const shelby = getShelby();
      const result = await shelby.upload(file, {
        contentType: file.type || "model/gltf-binary",
        signal: controller.signal,
        onProgress: (p) => setPhase({ status: "uploading", fraction: p.fraction }),
      });

      // --- 2. Write the registry mapping on Aptos -----------------------------
      // Build the entry-function payload, then sign + submit with the connected
      // wallet. This is a real on-chain transaction (requires a deployed registry
      // at NEXT_PUBLIC_REGISTRY_ADDRESS).
      setPhase({ status: "registering", result });
      const registry = getRegistry();
      const payload = registry.buildRegisterAssetPayload({
        key: assetKey.trim(),
        blobId: result.blobId,
        contentHash: result.contentHash,
        sizeBytes: result.sizeBytes,
      });

      const pending = await signAndSubmitTransaction({ data: payload });
      const txHash = (pending as { hash?: string }).hash ?? "";

      setPhase({ status: "done", result, blobId: result.blobId, txHash });
    } catch (err) {
      setPhase({ status: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      abortRef.current = null;
    }
  }, [file, assetKey, connected, account, signAndSubmitTransaction]);

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Upload a game asset</h2>
        <p className="text-sm text-zinc-400">Stored on Shelby, indexed on Aptos.</p>
      </div>

      <WalletBar />

      <FileDrop accept={ACCEPTED} file={file} onPick={onPickFile} />

      <label className="block space-y-1">
        <span className="text-sm text-zinc-400">Asset key (NFT id or unique name)</span>
        <input
          value={assetKey}
          onChange={(e) => setAssetKey(e.target.value)}
          placeholder="studioX::hero_mesh"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <div className="flex items-center gap-3">
        <button className="btn" disabled={!canSubmit} onClick={onSubmit}>
          {phase.status === "uploading"
            ? "Uploading…"
            : phase.status === "registering"
              ? "Signing…"
              : "Upload & Register"}
        </button>
        {phase.status === "uploading" && (
          <button className="btn-ghost" onClick={() => abortRef.current?.abort()}>
            Cancel
          </button>
        )}
      </div>

      <PhaseView phase={phase} />
    </div>
  );
}

function PhaseView({ phase }: { phase: Phase }) {
  switch (phase.status) {
    case "uploading":
      return (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(phase.fraction * 100)}%` }} />
          </div>
          <p className="text-xs text-zinc-500">Chunking + erasure-coding on Shelby… {Math.round(phase.fraction * 100)}%</p>
        </div>
      );
    case "registering":
      return <p className="text-sm text-zinc-400">Writing BlobID to the Aptos registry… sign in your wallet.</p>;
    case "done":
      return (
        <div className="rounded-xl border border-accent2/30 bg-accent2/5 p-4">
          <p className="text-sm font-medium text-accent2">Registered ✔</p>
          <dl className="mt-2 space-y-1 text-sm">
            <Row label="BlobID" value={phase.blobId} mono />
            <Row label="Content hash" value={phase.result.contentHash} mono />
            <Row label="Size" value={formatBytes(phase.result.sizeBytes)} />
            <Row label="Upload time" value={`${phase.result.elapsedMs} ms`} />
            {phase.txHash ? <Row label="Tx hash" value={phase.txHash} mono /> : null}
          </dl>
        </div>
      );
    case "error":
      return <p className="text-sm text-red-400">⚠ {phase.message}</p>;
    default:
      return null;
  }
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-zinc-500">{label}</dt>
      <dd className={mono ? "mono" : ""}>{value}</dd>
    </div>
  );
}

function FileDrop({
  accept,
  file,
  onPick,
}: {
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onPick(e.dataTransfer.files?.[0] ?? null);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-8 text-center transition ${
        dragging ? "border-accent bg-accent/5" : "border-white/15"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <span className="text-sm">
          {file.name} · {formatBytes(file.size)}
        </span>
      ) : (
        <>
          <span className="text-sm">Drop a .glb / .fbx file, or click to browse</span>
          <span className="text-xs text-zinc-500">Heavy meshes welcome — Shelby chunks them automatically</span>
        </>
      )}
    </label>
  );
}
