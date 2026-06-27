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
 * Real Shelby client (browser side).
 *
 * On the real network, uploads are signed and paid for by a funded Aptos account — that
 * private key must never reach the browser. So this client does NOT import
 * `@shelby-protocol/sdk` directly. Instead it calls the app's own server routes
 * (`/api/shelby/*`), which run the real SDK with a server-held service account. See
 * `apps/web/src/app/api/shelby/*` and `apps/web/src/server/shelby.ts`.
 *
 * A Shelby blob is addressed by (owner account address, blobName). We encode that pair
 * into our opaque {@link BlobID} as `"<owner>/<blobName>"` (owner is a 0x-hex address with
 * no slash, so the first "/" is the delimiter; blobName may itself contain slashes).
 */
export class RealShelbyClient implements ShelbyClient {
  private readonly base: string;

  constructor(config: ShelbyConfig) {
    this.base = (config.apiBaseUrl ?? "/api/shelby").replace(/\/$/, "");
  }

  async upload(data: Blob | File, options?: UploadOptions): Promise<UploadResult> {
    const start = performance.now();

    const form = new FormData();
    form.append("file", data);
    if (options?.blobName) form.append("blobName", options.blobName);
    if (options?.contentType) form.append("contentType", options.contentType);

    const res = await fetch(`${this.base}/upload`, {
      method: "POST",
      body: form,
      signal: options?.signal,
    });
    if (!res.ok) throw new Error(await errorText(res, "upload"));

    const json = (await res.json()) as {
      owner: string;
      blobName: string;
      contentHash: string;
      sizeBytes: number;
    };

    // The progress API can't reflect a single server round-trip; emit a final tick.
    options?.onProgress?.({ uploadedBytes: json.sizeBytes, totalBytes: json.sizeBytes, fraction: 1 });

    return {
      blobId: encodeBlobId(json.owner, json.blobName),
      contentHash: json.contentHash,
      sizeBytes: json.sizeBytes,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  async read(blobId: BlobID, options?: ReadOptions): Promise<ReadResult> {
    const start = performance.now();
    const res = await fetch(this.getReadUrl(blobId), { signal: options?.signal });
    if (!res.ok) throw new Error(await errorText(res, "download"));

    const blob = await res.blob();
    return { blob, blobId, latencyMs: Math.round(performance.now() - start) };
  }

  getReadUrl(blobId: BlobID): string {
    const { owner, blobName } = decodeBlobId(blobId);
    const qs = new URLSearchParams({ owner, blobName });
    return `${this.base}/download?${qs.toString()}`;
  }
}

function encodeBlobId(owner: string, blobName: string): BlobID {
  return asBlobId(`${owner}/${blobName}`);
}

function decodeBlobId(blobId: BlobID): { owner: string; blobName: string } {
  const slash = blobId.indexOf("/");
  if (slash <= 0) throw new Error(`Malformed Shelby BlobID: "${blobId}" (expected "<owner>/<blobName>")`);
  return { owner: blobId.slice(0, slash), blobName: blobId.slice(slash + 1) };
}

async function errorText(res: Response, op: string): Promise<string> {
  let detail = "";
  try {
    detail = await res.text();
  } catch {
    /* ignore */
  }
  return `Shelby ${op} failed (${res.status} ${res.statusText})${detail ? `: ${detail}` : ""}`;
}
