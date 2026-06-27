import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why MetaAsset — a 0→100 example",
  description:
    "A worked example: shipping a heavy 3D game asset to players on Solana and EVM with MetaAsset, from the problem to a sub-second cross-chain load.",
};

/** A small labelled milestone marker for the 0→100 progression. */
function Milestone({ pct, title, children }: { pct: number; title: string; children: React.ReactNode }) {
  return (
    <section className="relative border-l border-white/10 pl-6">
      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border border-accent bg-ink" />
      <div className="mb-1 flex items-baseline gap-3">
        <span className="font-mono text-sm text-accent">{pct}%</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-3 text-sm text-zinc-400">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-zinc-200">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-medium text-accent2">Case study</p>
        <h1 className="text-4xl font-bold tracking-tight">
          From 0 to 100: shipping a 48&nbsp;MB mech to players on every chain
        </h1>
        <p className="max-w-2xl text-zinc-400">
          Meet <span className="text-zinc-200">Pixel Forge</span>, a small studio launching a Web3 mech
          game. Their hero model <code>hero_mech.glb</code> is 48&nbsp;MB. Players hold the game&apos;s
          access NFT on <span className="text-zinc-200">Solana</span> and{" "}
          <span className="text-zinc-200">Ethereum</span> — not Aptos. Here is the whole journey, and
          why MetaAsset exists.
        </p>
      </header>

      {/* The problem */}
      <section className="card space-y-4">
        <h2 className="text-xl font-semibold">The wall they hit (the &quot;0&quot;)</h2>
        <p className="text-sm text-zinc-400">
          Pixel Forge tried the obvious options. Each one breaks for a read-heavy game asset:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-medium">Option</th>
                <th className="py-2 pr-4 font-medium">Problem</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">Store the bytes on-chain</td>
                <td className="py-2 pr-4">48&nbsp;MB on a smart-contract chain costs a fortune in gas. Non-starter.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">IPFS / Arweave</td>
                <td className="py-2 pr-4">Cold storage. Cache-miss loads of tens of seconds — players stare at a spinner.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4">AWS S3 + CloudFront</td>
                <td className="py-2 pr-4">Fast, but centralized + a single point of takedown; no on-chain provenance.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Put assets behind their own API</td>
                <td className="py-2 pr-4">Now players on Solana/EVM can&apos;t prove access without a custom backend per chain.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-zinc-400">
          They need <span className="text-accent2">hot, decentralized storage</span> with{" "}
          <span className="text-accent2">on-chain provenance</span> that{" "}
          <span className="text-accent2">any chain&apos;s wallet</span> can read. That is MetaAsset.
        </p>
      </section>

      {/* The 0 -> 100 progression */}
      <div className="space-y-8">
        <Milestone pct={0} title="Deploy the registry (one-time)">
          <p>
            A tiny Aptos Move module is the source of truth: <code>asset_key → BlobID</code>. It stores
            only the mapping — never the 48&nbsp;MB.
          </p>
          <Code>{`aptos move publish --named-addresses meta_asset=0x<studio>
# then, once:
aptos move run --function-id 0x<studio>::asset_registry::init_registry`}</Code>
        </Milestone>

        <Milestone pct={25} title="Upload the mech to Shelby">
          <p>
            In the Creator Portal the dev drops <code>hero_mech.glb</code>. The browser posts it to the
            app&apos;s server route, which runs <code>@shelby-protocol/sdk</code> with a funded Aptos
            account — chunking + erasure-coding happen automatically, on-chain.
          </p>
          <Code>{`// apps/web/src/app/api/shelby/upload/route.ts (server)
await client.upload({
  blobData,                       // the 48 MB, as bytes
  signer: account,                // funded service account, pays storage
  blobName: "pixelforge/hero_mech.glb",
  expirationMicros: defaultExpirationMicros(),
});
// → BlobID = "<owner>/pixelforge/hero_mech.glb"`}</Code>
          <p className="text-zinc-500">
            Measured on shelbynet in testing: a small blob round-trips in ~0.7&nbsp;s. The key is paid
            reads — storage providers are incentivised to serve fast.
          </p>
        </Milestone>

        <Milestone pct={50} title="Log the BlobID on Aptos">
          <p>
            The portal writes the mapping to the registry. The dev signs with their own Aptos wallet —
            no keys held by the app.
          </p>
          <Code>{`const payload = registry.buildRegisterAssetPayload({
  key: "pixelforge::hero_mech",
  blobId, contentHash, sizeBytes,
});
await signAndSubmitTransaction({ data: payload });`}</Code>
          <p>
            Now <code>pixelforge::hero_mech</code> resolves to the Shelby blob forever — verifiable by
            anyone, on any chain, with a gas-free view call.
          </p>
        </Milestone>

        <Milestone pct={75} title="A player on Solana shows up">
          <p>
            A Phantom user opens the game. They never touch Aptos. The client connects their wallet and
            asks the server to verify they hold the access NFT — the on-chain read runs server-side
            (no browser CORS, RPC stays private).
          </p>
          <Code>{`// browser → POST /api/nft/verify
{ "chain": "solana",
  "address": "<phantom address>",
  "assetKey": "pixelforge::hero_mech" }
// server checks the SPL mint balance → { "owns": true }`}</Code>
        </Milestone>

        <Milestone pct={100} title="The mech streams in, sub-second">
          <p>
            Ownership proven, the client resolves the registry to the <code>BlobID</code> and streams
            the asset back through Shelby — at S3-like speed, fully decentralized.
          </p>
          <Code>{`const blobId = await registry.getBlobId("pixelforge::hero_mech");
const { blob, latencyMs } = await shelby.read(blobId, { account });
loadIntoEngine(URL.createObjectURL(blob));  // three.js / model-viewer
// latencyMs: ~700 — no spinner, no lag`}</Code>
          <p className="text-accent2">
            Same flow works unchanged for an EVM (MetaMask) player. One asset, every chain.
          </p>
        </Milestone>
      </div>

      {/* Before / after */}
      <section className="card space-y-4">
        <h2 className="text-xl font-semibold">Why it matters</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-300">Without MetaAsset</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              <li>Pick: cheap+slow (IPFS) or fast+centralized (S3)</li>
              <li>Custom access backend per chain</li>
              <li>No verifiable on-chain link to the asset</li>
              <li>Spinners and takedown risk</li>
            </ul>
          </div>
          <div className="rounded-xl border border-accent2/30 bg-accent2/5 p-4">
            <p className="text-sm font-medium text-accent2">With MetaAsset</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              <li>Hot, decentralized storage (Shelby)</li>
              <li>One registry, read by any chain&apos;s wallet</li>
              <li>Verifiable <code>asset_key → BlobID</code> on Aptos</li>
              <li>Sub-second loads, no single point of failure</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/creator" className="btn">
          Try the Creator Portal
        </Link>
        <Link href="/play" className="btn-ghost">
          Try the Game Client
        </Link>
        <a
          className="btn-ghost"
          href="https://github.com/Starling-spell/meta-asset-cdn/blob/main/docs/ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          Read the architecture
        </a>
      </section>
    </article>
  );
}
