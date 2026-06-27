import type { ShelbyConfig } from "./config";
import {
  asBlobId,
  type BlobID,
  type ReadOptions,
  type ReadResult,
  type ShelbyClient,
  type UploadOptions,
  type UploadResult,
} from "./types";

/**
 * ============================================================================
 *  THE Shelby integration boundary.
 * ============================================================================
 *
 * This is the ONLY file that talks to `@shelby-protocol/sdk`. Everything below the
 * line marked "SHELBY INTEGRATION POINT" is our best-effort mapping from the public
 * Shelby docs onto a plausible SDK surface. The exact method names, argument shapes,
 * and return types are **not yet publicly verifiable** — when you have the real SDK,
 * adjust *this file only*. The rest of Meta-Asset depends solely on {@link ShelbyClient}.
 *
 * To keep the monorepo compiling whether or not the package is installed, we:
 *   1. declare a minimal structural type for the SDK we expect, and
 *   2. import it dynamically (so it's an optional peer dependency).
 */

/**
 * Minimal *expected* shape of the Shelby SDK. Replace with `import type` from
 * `@shelby-protocol/sdk` once the real types are published and confirmed.
 *
 * SHELBY INTEGRATION POINT — verify every member against official docs.
 */
interface ExpectedShelbySdk {
  createClient(opts: { rpcUrl: string; apiKey?: string }): ExpectedShelbySdkClient;
}

interface ExpectedShelbySdkClient {
  /** Upload bytes; expected to chunk + erasure-code internally and return a blob id. */
  putBlob(
    data: Uint8Array | Blob,
    opts?: { contentType?: string; onProgress?: (uploaded: number, total: number) => void; signal?: AbortSignal },
  ): Promise<{ blobId: string; contentHash: string; size: number }>;

  /** Fetch bytes for a blob id from the nearest RPC node. */
  getBlob(blobId: string, opts?: { signal?: AbortSignal; authorization?: unknown }): Promise<Blob>;

  /** Build a direct/edge-cacheable read URL (may embed a short-lived token). */
  blobUrl(blobId: string): string;
}

export class RealShelbyClient implements ShelbyClient {
  private clientPromise: Promise<ExpectedShelbySdkClient> | null = null;

  constructor(private readonly config: ShelbyConfig) {
    if (!config.rpcUrl) {
      throw new Error(
        "RealShelbyClient requires NEXT_PUBLIC_SHELBY_RPC_URL. Set SHELBY_MODE=mock to run without it.",
      );
    }
  }

  /** Lazily load + construct the SDK client so it's a truly optional dependency. */
  private async getSdkClient(): Promise<ExpectedShelbySdkClient> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        // SHELBY INTEGRATION POINT — confirm the package name + named exports.
        // Using a variable specifier keeps the type-checker from requiring the
        // package to be installed at build time of this scaffold.
        const specifier = "@shelby-protocol/sdk";
        const sdk = (await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier)) as unknown as ExpectedShelbySdk;
        return sdk.createClient({ rpcUrl: this.config.rpcUrl!, apiKey: this.config.apiKey });
      })();
    }
    return this.clientPromise;
  }

  async upload(data: Blob | File, options?: UploadOptions): Promise<UploadResult> {
    const start = performance.now();
    const client = await this.getSdkClient();

    // SHELBY INTEGRATION POINT — map our UploadOptions onto the real putBlob signature.
    const res = await client.putBlob(data, {
      contentType: options?.contentType ?? (data instanceof File ? data.type : undefined),
      signal: options?.signal,
      onProgress: (uploaded, total) =>
        options?.onProgress?.({ uploadedBytes: uploaded, totalBytes: total, fraction: total ? uploaded / total : 0 }),
    });

    return {
      blobId: asBlobId(res.blobId),
      contentHash: res.contentHash,
      sizeBytes: res.size,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  async read(blobId: BlobID, options?: ReadOptions): Promise<ReadResult> {
    const start = performance.now();
    const client = await this.getSdkClient();

    // SHELBY INTEGRATION POINT — paid reads may require passing the resolved
    // cross-chain account/authorization here. Confirm the read-auth contract.
    const blob = await client.getBlob(blobId, {
      signal: options?.signal,
      authorization: options?.account?.authorization,
    });

    return { blob, blobId, latencyMs: Math.round(performance.now() - start) };
  }

  getReadUrl(blobId: BlobID): string {
    // NOTE: synchronous by contract; if the real SDK needs async URL signing,
    // precompute/caches the URL after upload instead of here.
    // SHELBY INTEGRATION POINT — confirm whether read URLs are signed/expiring.
    if (!this.config.rpcUrl) return `shelby://blob/${blobId}`;
    return `${this.config.rpcUrl.replace(/\/$/, "")}/blobs/${blobId}`;
  }
}
