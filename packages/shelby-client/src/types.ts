/**
 * Shelby Protocol — shared types for the Meta-Asset CDN.
 *
 * These types model the *contract* our application relies on. They are intentionally
 * decoupled from the concrete `@shelby-protocol/sdk` types so that, when the real SDK
 * surface is confirmed, we only have to adapt one file (`realClient.ts`) — not the
 * entire application.
 */

/**
 * A Shelby blob identifier.
 *
 * Modeled as a *branded* string so a raw `string` can't be passed where a verified
 * BlobID is expected. The on-wire format (CID-like hash, base58, etc.) is not yet
 * publicly documented — treat it as opaque and never construct one by hand outside
 * `asBlobId()`.
 *
 * SHELBY INTEGRATION POINT — confirm the real BlobID encoding against official docs.
 */
export type BlobID = string & { readonly __brand: "ShelbyBlobID" };

/** Narrow an untrusted string into a BlobID. Add real format validation when known. */
export function asBlobId(value: string): BlobID {
  if (value.length === 0) {
    throw new Error("Invalid BlobID: empty string");
  }
  // SHELBY INTEGRATION POINT — validate against the real BlobID format/checksum.
  return value as BlobID;
}

/** Progress callback payload emitted during a chunked upload. */
export interface UploadProgress {
  /** Bytes transferred so far. */
  readonly uploadedBytes: number;
  /** Total bytes to transfer. */
  readonly totalBytes: number;
  /** Convenience ratio in [0, 1]. */
  readonly fraction: number;
}

/** Options accepted by {@link ShelbyClient.upload}. */
export interface UploadOptions {
  /**
   * Logical content type (e.g. "model/gltf-binary"). Helps RPC nodes serve the blob
   * with correct headers on read.
   */
  readonly contentType?: string;
  /**
   * Blob name / path on Shelby (e.g. "studioX/hero_mesh.glb"). On the real network a
   * blob is addressed by (owner account, blobName). Defaults to a hash-derived name.
   */
  readonly blobName?: string;
  /** Invoked as chunks are uploaded and erasure-coded. */
  readonly onProgress?: (progress: UploadProgress) => void;
  /** Abort an in-flight upload. */
  readonly signal?: AbortSignal;
}

/** Result of a successful upload. */
export interface UploadResult {
  readonly blobId: BlobID;
  /** Content hash (e.g. sha256) the registry should pin for integrity verification. */
  readonly contentHash: string;
  readonly sizeBytes: number;
  /** Wall-clock time the upload took, in milliseconds. Useful for the demo UI. */
  readonly elapsedMs: number;
}

/** Options accepted by {@link ShelbyClient.read}. */
export interface ReadOptions {
  readonly signal?: AbortSignal;
  /**
   * A resolved cross-chain identity (Solana/EVM → Shelby-readable principal).
   * Reads are *paid* on Shelby, so the reader's account context may be required.
   *
   * SHELBY INTEGRATION POINT — confirm what (if anything) read auth requires.
   */
  readonly account?: ShelbyAccountContext;
}

/**
 * An opaque account/identity context the Shelby read path can authorize against.
 * Produced by `@shelby-protocol/cross-chain-accounts` for non-Aptos wallets.
 */
export interface ShelbyAccountContext {
  /** Origin chain of the signer. */
  readonly chain: "aptos" | "solana" | "evm";
  /** Address on the origin chain. */
  readonly address: string;
  /**
   * Implementation-defined token/proof the RPC node accepts. Kept as `unknown` on
   * purpose: do not let app code depend on its shape.
   *
   * SHELBY INTEGRATION POINT — type this once the cross-chain auth flow is confirmed.
   */
  readonly authorization?: unknown;
}

/** Result of a read, plus latency we surface in the game-client demo. */
export interface ReadResult {
  readonly blob: Blob;
  readonly blobId: BlobID;
  /** Time-to-first-byte / total fetch time in ms — the headline "sub-second" metric. */
  readonly latencyMs: number;
}

/**
 * The application-facing Shelby client. Everything Meta-Asset needs from Shelby is
 * expressed here. Both the real SDK-backed client and the local mock implement it.
 */
export interface ShelbyClient {
  /** Upload a blob (with automatic chunking + erasure coding handled by Shelby). */
  upload(data: Blob | File, options?: UploadOptions): Promise<UploadResult>;

  /** Fetch a blob by id from the nearest Shelby RPC node. */
  read(blobId: BlobID, options?: ReadOptions): Promise<ReadResult>;

  /**
   * Build a direct, cacheable URL to a blob (e.g. for `<img>`/`<model-viewer>` or a
   * CDN edge). May embed a short-lived read token.
   */
  getReadUrl(blobId: BlobID): string;
}
