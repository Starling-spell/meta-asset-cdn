import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-6 pt-6 text-center">
        <span className="badge badge-accent2 mx-auto">Powered by Shelby Protocol on Aptos</span>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          The decentralized CDN for{" "}
          <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            Web3 games
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-zinc-400">
          Store heavy 3D game assets (<code className="text-zinc-300">.glb</code>,{" "}
          <code className="text-zinc-300">.fbx</code>) on decentralized hot storage, index them on
          Aptos, and serve players on <span className="text-zinc-200">any chain</span> with Web2-grade
          read speeds.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/guide" className="btn">
            Get started →
          </Link>
          <Link href="/creator" className="btn-ghost">
            Open Creator Portal
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          No wallet or sign-up needed to try — runs in <span className="text-accent">Demo mode</span> out
          of the box.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-zinc-500">
          How it works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: 1,
              t: "Upload",
              d: "A studio uploads a 3D asset. It's chunked + erasure-coded onto the Shelby network, returning a BlobID.",
            },
            {
              n: 2,
              t: "Register",
              d: "The BlobID is logged to a tiny Aptos Move registry under a memorable asset key.",
            },
            {
              n: 3,
              t: "Stream",
              d: "Any player — Solana, EVM, or Aptos — proves access, resolves the key, and streams the asset in sub-second.",
            },
          ].map((s) => (
            <div key={s.n} className="card space-y-3">
              <div className="flex items-center gap-3">
                <span className="step-num">{s.n}</span>
                <h3 className="font-semibold">{s.t}</h3>
              </div>
              <p className="prose-doc">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two entry points */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/creator" className="card card-hover space-y-2">
          <span className="badge badge-accent">For studios</span>
          <h2 className="text-xl font-semibold">Creator Portal →</h2>
          <p className="prose-doc">
            Upload a heavy asset, get a BlobID, and log it on-chain. Connect an Aptos wallet to make the
            registry write real.
          </p>
        </Link>
        <Link href="/play" className="card card-hover space-y-2">
          <span className="badge badge-accent2">For players</span>
          <h2 className="text-xl font-semibold">Game Client →</h2>
          <p className="prose-doc">
            Connect a Solana or EVM wallet, prove you own the gating NFT, and stream the asset back from
            Shelby.
          </p>
        </Link>
      </section>

      {/* Why */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Cheap at scale", d: "Heavy files live on purpose-built hot storage — the chain only holds the small key→BlobID map." },
          { t: "Cross-chain", d: "Storage is decoupled from the player's wallet network, so you serve every ecosystem." },
          { t: "Sub-second reads", d: "Erasure-coded, dedicated-fiber delivery loads models at S3-like speed. ~0.7s measured." },
        ].map((f) => (
          <div key={f.t} className="space-y-1">
            <h3 className="font-semibold text-zinc-100">{f.t}</h3>
            <p className="prose-doc">{f.d}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="card flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">New here? Start with the guide.</h2>
        <p className="max-w-xl prose-doc">
          A five-minute walkthrough: try the demo, understand each step, then flip on the real Shelby
          network when you&apos;re ready.
        </p>
        <Link href="/guide" className="btn">
          Read the new-user guide →
        </Link>
      </section>
    </div>
  );
}
