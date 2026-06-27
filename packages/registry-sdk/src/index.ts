/**
 * @meta-asset/registry-sdk
 *
 * Typed client for the `asset_registry` Move module (see contracts/asset_registry).
 * It maps a human/asset key (e.g. an NFT id or "studioX::hero_mesh") to a Shelby BlobID
 * and back. Reads use a `#[view]` function (no gas, no wallet); writes build an entry-
 * function payload the caller signs with their Aptos wallet.
 */
import {
  Aptos,
  AptosConfig,
  Network,
  type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { asBlobId, type BlobID } from "@meta-asset/shelby-client";

/** Where the registry lives on-chain. */
export interface RegistryConfig {
  /** Address that published the `asset_registry` module AND holds the `Registry` resource. */
  readonly registryAddress: string;
  /** Aptos network to read from. */
  readonly network?: Network;
  /** Module name as published. Override only if you renamed it. */
  readonly moduleName?: string;
}

/** A decoded on-chain asset record. Mirrors `AssetRecord` in the Move module. */
export interface AssetRecord {
  readonly key: string;
  readonly blobId: BlobID;
  readonly contentHash: string;
  readonly sizeBytes: number;
  readonly owner: string;
}

const DEFAULT_MODULE = "asset_registry";

/**
 * Read/write client for the Asset Registry.
 *
 * Reads are performed directly against the Aptos fullnode (`view` calls). Writes are
 * returned as *payloads* — this package deliberately does NOT hold private keys or
 * wallets; the UI layer signs and submits with the user's connected Aptos wallet.
 */
export class AssetRegistryClient {
  private readonly aptos: Aptos;
  private readonly registryAddress: string;
  private readonly moduleName: string;

  constructor(config: RegistryConfig) {
    this.aptos = new Aptos(new AptosConfig({ network: config.network ?? Network.TESTNET }));
    this.registryAddress = config.registryAddress;
    this.moduleName = config.moduleName ?? DEFAULT_MODULE;
  }

  private fn(name: string): `${string}::${string}::${string}` {
    return `${this.registryAddress}::${this.moduleName}::${name}`;
  }

  /**
   * Resolve the Shelby BlobID for an asset key via the on-chain `#[view] get_blob_id`.
   * Returns `null` if the key isn't registered.
   */
  async getBlobId(key: string): Promise<BlobID | null> {
    const result = await this.aptos.view<[string]>({
      payload: {
        function: this.fn("get_blob_id"),
        functionArguments: [this.registryAddress, key],
      },
    });

    const raw = result[0];
    return raw && raw.length > 0 ? asBlobId(raw) : null;
  }

  /**
   * Build the entry-function payload to register (upsert) an asset. The caller signs
   * and submits this with their Aptos wallet — see UploadAsset.tsx for the wiring.
   */
  buildRegisterAssetPayload(record: {
    key: string;
    blobId: BlobID;
    contentHash: string;
    sizeBytes: number;
  }): InputGenerateTransactionPayloadData {
    return {
      function: this.fn("register_asset"),
      functionArguments: [record.key, record.blobId, record.contentHash, record.sizeBytes],
    };
  }

  /** Build the entry-function payload to point an existing key at a new BlobID. */
  buildUpdateBlobPayload(key: string, blobId: BlobID): InputGenerateTransactionPayloadData {
    return {
      function: this.fn("update_blob"),
      functionArguments: [key, blobId],
    };
  }

  /** Build the one-time payload that initializes the `Registry` resource. */
  buildInitRegistryPayload(): InputGenerateTransactionPayloadData {
    return {
      function: this.fn("init_registry"),
      functionArguments: [],
    };
  }
}

export { Network } from "@aptos-labs/ts-sdk";
export type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
