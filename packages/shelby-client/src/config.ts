import { z } from "zod";

/**
 * Runtime configuration for the Shelby client, validated with zod so a misconfigured
 * environment fails loudly at startup instead of mysteriously at upload time.
 *
 * NEXT_PUBLIC_* values are exposed to the browser by Next.js — never put secrets there.
 * The real API key (if any) must stay server-side as `SHELBY_API_KEY`.
 */
export const ShelbyConfigSchema = z.object({
  /** "mock" runs fully local (no creds); "real" uses @shelby-protocol/sdk. */
  mode: z.enum(["mock", "real"]).default("mock"),
  /** Base URL of a Shelby RPC server. */
  rpcUrl: z.string().url().optional(),
  /** Server-only API key, if the RPC requires one. */
  apiKey: z.string().optional(),
});

export type ShelbyConfig = z.infer<typeof ShelbyConfigSchema>;

/**
 * Resolve config from environment. Works in both Node (server) and browser:
 * only NEXT_PUBLIC_* vars are available client-side.
 */
export function resolveConfig(overrides?: Partial<ShelbyConfig>): ShelbyConfig {
  const fromEnv: Partial<ShelbyConfig> = {
    mode: (process.env.NEXT_PUBLIC_SHELBY_MODE as ShelbyConfig["mode"]) ?? undefined,
    rpcUrl: process.env.NEXT_PUBLIC_SHELBY_RPC_URL,
    // Only present server-side; undefined in the browser bundle.
    apiKey: process.env.SHELBY_API_KEY,
  };

  return ShelbyConfigSchema.parse({ ...fromEnv, ...overrides });
}
