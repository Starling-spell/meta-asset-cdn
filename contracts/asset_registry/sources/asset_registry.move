/// Meta-Asset — Asset Registry
///
/// A minimal, decentralized registry that maps an *asset key* (an NFT id, or any
/// unique string such as "studioX::hero_mesh") to the Shelby `BlobID` where that
/// asset's bytes are stored, plus integrity metadata.
///
/// This is a SKELETON intended as a starting point:
///   * It uses a single shared `Registry` resource held under the publisher (`meta_asset`)
///     address. A production design might shard per-studio, gate writes with capabilities,
///     or integrate Shelby payment-channel state directly.
///   * NFT-ownership proofs and storage-fee settlement are intentionally out of scope here;
///     the client layer handles those (see CrossChainFetch.tsx / UploadAsset.tsx).
module meta_asset::asset_registry {
    use std::signer;
    use std::string::{Self, String};
    use aptos_std::table::{Self, Table};
    use aptos_framework::event;
    use aptos_framework::timestamp;

    // ----- Errors -------------------------------------------------------------

    /// Caller is not the owner of the record they tried to mutate.
    const E_NOT_AUTHORIZED: u64 = 1;
    /// A record already exists for this key (when strict-create is required).
    const E_ALREADY_EXISTS: u64 = 2;
    /// No record exists for this key.
    const E_NOT_FOUND: u64 = 3;
    /// The Registry has not been initialized at the expected address.
    const E_NOT_INITIALIZED: u64 = 4;
    /// The Registry was already initialized.
    const E_ALREADY_INITIALIZED: u64 = 5;

    // ----- Storage ------------------------------------------------------------

    /// One registered asset: where it lives on Shelby + how to verify it.
    struct AssetRecord has store, copy, drop {
        /// Opaque Shelby blob identifier (format owned by the Shelby protocol).
        blob_id: String,
        /// Content hash (e.g. hex sha256) clients verify after download.
        content_hash: String,
        /// Size in bytes — useful for UI and quota accounting.
        size_bytes: u64,
        /// Account allowed to update/repoint this record.
        owner: address,
        /// Last update time (unix seconds).
        updated_at_secs: u64,
    }

    /// The registry resource. Lives under the `meta_asset` publisher address.
    struct Registry has key {
        assets: Table<String, AssetRecord>,
    }

    // ----- Events -------------------------------------------------------------

    #[event]
    struct AssetRegistered has drop, store {
        key: String,
        blob_id: String,
        owner: address,
        size_bytes: u64,
    }

    #[event]
    struct BlobUpdated has drop, store {
        key: String,
        old_blob_id: String,
        new_blob_id: String,
        owner: address,
    }

    // ----- Lifecycle ----------------------------------------------------------

    /// Initialize the shared registry. Call once, from the `meta_asset` account.
    public entry fun init_registry(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<Registry>(admin_addr), E_ALREADY_INITIALIZED);
        move_to(admin, Registry { assets: table::new<String, AssetRecord>() });
    }

    // ----- Writes -------------------------------------------------------------

    /// Register (upsert) an asset. Anyone may register a *new* key; only the existing
    /// owner may overwrite an existing one.
    public entry fun register_asset(
        owner: &signer,
        key: String,
        blob_id: String,
        content_hash: String,
        size_bytes: u64,
    ) acquires Registry {
        assert!(exists<Registry>(@meta_asset), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<Registry>(@meta_asset);
        let owner_addr = signer::address_of(owner);

        if (table::contains(&registry.assets, key)) {
            let existing = table::borrow(&registry.assets, key);
            assert!(existing.owner == owner_addr, E_NOT_AUTHORIZED);
            table::remove(&mut registry.assets, key);
        };

        let record = AssetRecord {
            blob_id,
            content_hash,
            size_bytes,
            owner: owner_addr,
            updated_at_secs: timestamp::now_seconds(),
        };
        table::add(&mut registry.assets, key, record);

        event::emit(AssetRegistered { key, blob_id, owner: owner_addr, size_bytes });
    }

    /// Repoint an existing key at a new BlobID (e.g. after re-uploading an updated mesh).
    /// Owner-gated.
    public entry fun update_blob(owner: &signer, key: String, blob_id: String) acquires Registry {
        assert!(exists<Registry>(@meta_asset), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<Registry>(@meta_asset);
        assert!(table::contains(&registry.assets, key), E_NOT_FOUND);

        let record = table::borrow_mut(&mut registry.assets, key);
        assert!(record.owner == signer::address_of(owner), E_NOT_AUTHORIZED);

        let old_blob_id = record.blob_id;
        record.blob_id = blob_id;
        record.updated_at_secs = timestamp::now_seconds();

        event::emit(BlobUpdated {
            key,
            old_blob_id,
            new_blob_id: blob_id,
            owner: record.owner,
        });
    }

    // ----- Reads (views) ------------------------------------------------------

    #[view]
    /// Resolve the Shelby BlobID for a key. Returns the empty string if not found,
    /// so callers can branch without aborting a read path. (registry-sdk treats
    /// "" as `null`.)
    public fun get_blob_id(registry_addr: address, key: String): String acquires Registry {
        if (!exists<Registry>(registry_addr)) {
            return string::utf8(b"")
        };
        let registry = borrow_global<Registry>(registry_addr);
        if (!table::contains(&registry.assets, key)) {
            return string::utf8(b"")
        };
        table::borrow(&registry.assets, key).blob_id
    }

    #[view]
    /// Full record for a key. Aborts with E_NOT_FOUND if missing.
    public fun get_record(registry_addr: address, key: String): AssetRecord acquires Registry {
        assert!(exists<Registry>(registry_addr), E_NOT_INITIALIZED);
        let registry = borrow_global<Registry>(registry_addr);
        assert!(table::contains(&registry.assets, key), E_NOT_FOUND);
        *table::borrow(&registry.assets, key)
    }

    #[view]
    /// Whether a key is registered.
    public fun exists_asset(registry_addr: address, key: String): bool acquires Registry {
        if (!exists<Registry>(registry_addr)) {
            return false
        };
        table::contains(&borrow_global<Registry>(registry_addr).assets, key)
    }

    // ----- Tests --------------------------------------------------------------

    #[test(aptos_framework = @aptos_framework, admin = @meta_asset, creator = @0xCAFE)]
    fun test_register_and_read(
        aptos_framework: &signer,
        admin: &signer,
        creator: &signer,
    ) acquires Registry {
        // `timestamp::now_seconds()` needs the framework clock; only @aptos_framework
        // may start it in tests.
        timestamp::set_time_has_started_for_testing(aptos_framework);
        init_registry(admin);

        let key = string::utf8(b"studioX::hero_mesh");
        register_asset(
            creator,
            key,
            string::utf8(b"blob-abc123"),
            string::utf8(b"deadbeef"),
            2048,
        );

        let resolved = get_blob_id(@meta_asset, key);
        assert!(resolved == string::utf8(b"blob-abc123"), 100);
        assert!(exists_asset(@meta_asset, key), 101);
    }
}
