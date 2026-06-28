import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guide — Getting started with MetaAsset",
  description: "A friendly, five-minute guide for new users: try the demo, understand each step, and go live on Shelby.",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="step-num">{n}</span>
      <div className="space-y-2 pt-0.5">
        <h3 className="font-semibold text-zinc-100">{title}</h3>
        <div className="prose-doc space-y-2">{children}</div>
      </div>
    </div>
  );
}

function Callout({ tone = "accent", title, children }: { tone?: "accent" | "accent2"; title: string; children: React.ReactNode }) {
  const border = tone === "accent2" ? "border-accent2/30 bg-accent2/5" : "border-accent/30 bg-accent/5";
  const text = tone === "accent2" ? "text-accent2" : "text-accent";
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <p className={`text-sm font-medium ${text}`}>{title}</p>
      <div className="prose-doc mt-1">{children}</div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <span className="badge badge-accent">New user guide</span>
        <h1 className="text-4xl font-bold tracking-tight">Get started in five minutes</h1>
        <p className="max-w-2xl text-zinc-400">
          MetaAsset stores heavy 3D game assets on decentralized storage and serves them to players on
          any chain. This guide gets you from zero to a working upload-and-fetch — first in a safe demo,
          then on the real network if you want.
        </p>
      </header>

      {/* TOC */}
      <nav className="card flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {[
          ["#what", "What it is"],
          ["#modes", "Demo vs Live"],
          ["#try", "Try it now"],
          ["#creator", "Upload an asset"],
          ["#play", "Fetch as a player"],
          ["#live", "Go live on Shelby"],
          ["#faq", "Troubleshooting"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="text-zinc-400 hover:text-accent">
            {label}
          </a>
        ))}
      </nav>

      {/* What */}
      <section id="what" className="space-y-3 scroll-mt-24">
        <h2 className="text-2xl font-semibold">What is MetaAsset?</h2>
        <p className="prose-doc max-w-2xl">
          Three pieces working together:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Shelby storage", "Decentralized hot storage that holds the actual asset bytes — fast reads, erasure-coded for safety."],
            ["Aptos registry", "A tiny smart contract mapping a memorable asset key to its Shelby BlobID."],
            ["Cross-chain reader", "Players on Solana / EVM / Aptos prove access and stream the asset — no Aptos account required."],
          ].map(([t, d]) => (
            <div key={t} className="card">
              <h3 className="font-semibold text-zinc-100">{t}</h3>
              <p className="prose-doc mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="space-y-3 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Demo mode vs Live mode</h2>
        <p className="prose-doc max-w-2xl">
          Look at the badge in the top bar — it tells you which mode you&apos;re in.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Callout tone="accent" title="Demo mode (default)">
            Blobs are kept in your browser session. No wallet, no crypto, no sign-up. Perfect for
            understanding the flow. Uploads vanish when you refresh.
          </Callout>
          <Callout tone="accent2" title="Live mode (Shelby)">
            Real uploads land on the Shelby network and persist; reads stream from real storage nodes.
            Requires a funded account (set up by whoever deployed the app).
          </Callout>
        </div>
      </section>

      {/* Try */}
      <section id="try" className="space-y-5 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Try it now (no wallet)</h2>
        <div className="card space-y-5">
          <Step n={1} title="Open the Creator Portal">
            <p>
              Go to <Link href="/creator" className="text-accent hover:underline">Creator</Link>. In demo
              mode you can skip the wallet step.
            </p>
          </Step>
          <Step n={2} title="Drop in a file">
            <p>
              Drag any <code>.glb</code> / <code>.fbx</code> (or any file) onto the upload box. Give it an
              asset key like <code>studioX::hero_mesh</code>.
            </p>
          </Step>
          <Step n={3} title="Upload & copy the BlobID">
            <p>
              Hit <kbd>Upload &amp; Register</kbd>. You&apos;ll get a <strong>BlobID</strong>, content hash,
              size, and upload time.
            </p>
          </Step>
          <Step n={4} title="Fetch it back">
            <p>
              Open <Link href="/play" className="text-accent hover:underline">Play</Link>, use the same
              asset key, connect a wallet (or just fetch in demo), and watch it stream back with a latency
              readout.
            </p>
          </Step>
        </div>
        <Callout tone="accent2" title="That's the whole loop">
          Upload → register → resolve → stream. Everything else is making each step real on-chain.
        </Callout>
      </section>

      {/* Creator */}
      <section id="creator" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Uploading an asset (Creator Portal)</h2>
        <div className="card space-y-5">
          <Step n={1} title="Connect an Aptos wallet (live mode)">
            <p>
              To write the registry on-chain you sign with your own Aptos wallet (Petra, Pontem, Nightly,
              or Google/Apple via Aptos Connect). In demo mode this is optional.
            </p>
          </Step>
          <Step n={2} title="Pick the file + asset key">
            <p>
              The asset key is how players ask for the model later — keep it stable and unique, e.g.
              <code>studioX::hero_mesh</code> or an NFT id.
            </p>
          </Step>
          <Step n={3} title="Upload + register">
            <p>
              The file goes to Shelby; the resulting BlobID is written to the Aptos registry. You sign one
              transaction. Done — the asset is now resolvable by anyone, on any chain.
            </p>
          </Step>
        </div>
      </section>

      {/* Play */}
      <section id="play" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Fetching as a player (Game Client)</h2>
        <div className="card space-y-5">
          <Step n={1} title="Connect a Solana or EVM wallet">
            <p>Phantom for Solana, MetaMask for EVM. No Aptos account needed.</p>
          </Step>
          <Step n={2} title="Prove ownership">
            <p>
              The app checks (server-side) whether your wallet holds the NFT that gates the asset. Assets
              with no gate configured are open to everyone.
            </p>
          </Step>
          <Step n={3} title="Stream the asset">
            <p>
              The app resolves the asset key to a BlobID and streams it from Shelby. A real game client
              would feed those bytes straight into a 3D engine (three.js / model-viewer).
            </p>
          </Step>
        </div>
      </section>

      {/* Live */}
      <section id="live" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Going live on Shelby (for builders)</h2>
        <p className="prose-doc max-w-2xl">
          Running your own deployment? Flip from demo to real with environment variables:
        </p>
        <div className="card space-y-3">
          <Step n={1} title="Fund an Aptos account">
            <p>Create an Aptos account and fund it with APT (gas) and ShelbyUSD (storage) on shelbynet.</p>
          </Step>
          <Step n={2} title="Set environment variables">
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-zinc-200">
              <code>{`NEXT_PUBLIC_SHELBY_MODE=real
SHELBY_NETWORK=shelbynet
SHELBY_SIGNER_PRIVATE_KEY=ed25519-priv-0x…   # server secret, never NEXT_PUBLIC_`}</code>
            </pre>
          </Step>
          <Step n={3} title="Deploy">
            <p>
              Push and deploy (e.g. Vercel). The badge flips to <span className="text-accent2">Live: Shelby</span>{" "}
              and uploads become real on-chain blobs.
            </p>
          </Step>
        </div>
        <Callout tone="accent2" title="Already proven">
          A real upload + byte-verified read on shelbynet is recorded in{" "}
          <a className="underline hover:text-accent2" href="https://github.com/Starling-spell/meta-asset-cdn/blob/main/docs/PROOFS.md" target="_blank" rel="noreferrer">
            docs/PROOFS.md
          </a>
          . Full architecture in{" "}
          <a className="underline hover:text-accent2" href="https://github.com/Starling-spell/meta-asset-cdn/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">
            docs/ARCHITECTURE.md
          </a>
          .
        </Callout>
      </section>

      {/* FAQ */}
      <section id="faq" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Troubleshooting</h2>
        <div className="space-y-3">
          {[
            ["My upload disappeared after refresh.", "You're in demo mode — blobs live only for the session. Switch to live mode to persist them."],
            ["“No Aptos wallet detected.”", "Install Petra, Pontem, or Nightly, or use Google/Apple sign-in via Aptos Connect. In demo mode you can skip the wallet."],
            ["NFT check says I don't own it.", "The asset has a real gate and your wallet doesn't hold the token. Try an asset key with no gate, or use the right wallet."],
            ["“No asset registered under that key.”", "Upload + register that exact key first (Creator Portal), then fetch it with the identical key."],
          ].map(([q, a]) => (
            <div key={q} className="card">
              <p className="font-medium text-zinc-100">{q}</p>
              <p className="prose-doc mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next */}
      <section className="flex flex-wrap gap-3">
        <Link href="/creator" className="btn">
          Start uploading →
        </Link>
        <Link href="/docs" className="btn-ghost">
          See the full example
        </Link>
      </section>
    </article>
  );
}
