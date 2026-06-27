/**
 * @meta-asset/shelby-client
 *
 * Public surface of the Shelby adapter. App code should import ONLY from here —
 * never from `@shelby-protocol/sdk` directly. That keeps every assumption about the
 * (currently unverified) Shelby SDK isolated to `realClient.ts`.
 */
import { resolveConfig, type ShelbyConfig } from "./config";
import { MockShelbyClient } from "./mockClient";
import { RealShelbyClient } from "./realClient";
import type { ShelbyClient } from "./types";

export type {
  BlobID,
  ReadOptions,
  ReadResult,
  ShelbyAccountContext,
  ShelbyClient,
  UploadOptions,
  UploadProgress,
  UploadResult,
} from "./types";
export { asBlobId } from "./types";
export { ShelbyConfigSchema, resolveConfig } from "./config";
export type { ShelbyConfig } from "./config";

/**
 * Construct a Shelby client. Selects the mock or real implementation based on config
 * (defaults to "mock" so the app boots with zero credentials).
 *
 * @example
 * const shelby = createShelbyClient();
 * const { blobId } = await shelby.upload(file, { onProgress: setProgress });
 */
export function createShelbyClient(overrides?: Partial<ShelbyConfig>): ShelbyClient {
  const config = resolveConfig(overrides);
  return config.mode === "real" ? new RealShelbyClient(config) : new MockShelbyClient();
}
