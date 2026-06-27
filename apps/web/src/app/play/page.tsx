import { CrossChainFetch } from "@/components/CrossChainFetch";

export default function PlayPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Game Client</h1>
        <p className="text-zinc-400">Connect a cross-chain wallet and stream an asset from Shelby.</p>
      </header>
      <CrossChainFetch />
    </div>
  );
}
