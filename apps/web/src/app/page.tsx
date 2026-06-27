import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          The decentralized CDN for <span className="text-accent">Web3 games</span>
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Meta-Asset stores heavy 3D game assets (<code>.glb</code>, <code>.fbx</code>) as blobs on the{" "}
          <span className="text-accent2">Shelby Protocol</span> and maps them to an on-chain registry on Aptos.
          Players on any chain — Solana, EVM, or Aptos — fetch assets with Web2-grade read speeds.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/creator" className="card transition hover:border-accent/50">
          <h2 className="text-xl font-semibold">① Creator Portal</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Upload a 3D asset to Shelby, get a BlobID, and log it into the Aptos registry contract.
          </p>
        </Link>
        <Link href="/play" className="card transition hover:border-accent/50">
          <h2 className="text-xl font-semibold">② Game Client</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Connect a Solana/EVM wallet, prove NFT ownership, and stream the asset from Shelby RPC nodes.
          </p>
        </Link>
      </section>

      <section className="card">
        <h3 className="font-semibold">Architecture</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>Registry Contract (Aptos Move): asset key → Shelby BlobID.</li>
          <li>Upload client: Shelby SDK upload → registry write.</li>
          <li>Cross-chain reader: non-Aptos wallet → resolve BlobID → Shelby read.</li>
        </ol>
      </section>
    </div>
  );
}
