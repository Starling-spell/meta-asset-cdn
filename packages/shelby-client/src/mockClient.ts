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
 * In-memory Shelby client. Implements the exact same {@link ShelbyClient} contract as
 * the real SDK-backed client, but stores blobs in a `Map` and serves them via
 * `URL.createObjectURL`. This lets the whole Meta-Asset app run end-to-end — upload,
 * register, cross-chain fetch — with **zero external dependencies or credentials**.
 *
 * Swap to the real client by setting NEXT_PUBLIC_SHELBY_MODE=real (see ./index.ts).
 */
export class MockShelbyClient implements ShelbyClient {
  private readonly store = new Map<string, Blob>();

  async upload(data: Blob | File, options?: UploadOptions): Promise<UploadResult> {
    const start = performance.now();
    const buffer = await data.arrayBuffer();
    const contentHash = await sha256Hex(buffer);

    // Derive a deterministic, content-addressed id — mirrors how a real content-
    // addressed store behaves (same bytes => same id).
    const blobId = asBlobId(`mock-blob-${contentHash.slice(0, 32)}`);
    this.store.set(blobId, data instanceof Blob ? data : new Blob([buffer]));

    // Simulate chunked-upload progress so the UI progress bar is exercised.
    await simulateProgress(buffer.byteLength, options);

    return {
      blobId,
      contentHash,
      sizeBytes: buffer.byteLength,
      elapsedMs: Math.round(performance.now() - start),
    };
  }

  async read(blobId: BlobID, options?: ReadOptions): Promise<ReadResult> {
    const start = performance.now();
    options?.signal?.throwIfAborted();

    const blob = this.store.get(blobId);
    if (!blob) {
      throw new Error(
        `MockShelbyClient: unknown BlobID "${blobId}". In mock mode, blobs only exist for the lifetime of the page session — upload one first via /creator.`,
      );
    }

    // Pretend a fast fiber fetch took a few ms.
    await delay(15);
    return { blob, blobId, latencyMs: Math.round(performance.now() - start) };
  }

  getReadUrl(blobId: BlobID): string {
    const blob = this.store.get(blobId);
    return blob ? URL.createObjectURL(blob) : `mock://blob/${blobId}`;
  }
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function simulateProgress(totalBytes: number, options?: UploadOptions): Promise<void> {
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    options?.signal?.throwIfAborted();
    await delay(40);
    const uploadedBytes = Math.round((totalBytes * i) / steps);
    options?.onProgress?.({ uploadedBytes, totalBytes, fraction: i / steps });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
