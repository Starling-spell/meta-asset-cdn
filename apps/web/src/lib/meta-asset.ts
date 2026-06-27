/**
 * App-level wiring of the Meta-Asset packages. Keeps env reads + client construction
 * in one place so components stay declarative.
 */
import { AssetRegistryClient, Network } from "@meta-asset/registry-sdk";
import { createShelbyClient, type ShelbyClient } from "@meta-asset/shelby-client";

/** Singleton Shelby client (mock by default; real when NEXT_PUBLIC_SHELBY_MODE=real). */
let shelbySingleton: ShelbyClient | null = null;
export function getShelby(): ShelbyClient {
  shelbySingleton ??= createShelbyClient();
  return shelbySingleton;
}

/** Registry client pointed at the deployed module address. */
export function getRegistry(): AssetRegistryClient {
  const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!registryAddress) {
    throw new Error(
      "NEXT_PUBLIC_REGISTRY_ADDRESS is not set. Deploy contracts/asset_registry and set it in .env.local (see .env.example).",
    );
  }
  const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) ?? Network.TESTNET;
  return new AssetRegistryClient({ registryAddress, network });
}

/** Human-readable byte size for the UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
