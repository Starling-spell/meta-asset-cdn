import Link from "next/link";
import { CrossChainFetch } from "@/components/CrossChainFetch";

export default function PlayPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="badge badge-accent2">For players</span>
        <h1 className="text-3xl font-bold">Game Client</h1>
        <p className="text-zinc-400">
          Connect a Solana or EVM wallet and stream an asset from Shelby. New here?{" "}
          <Link href="/guide#play" className="text-accent hover:underline">
            Read the guide
          </Link>
          .
        </p>
      </header>
      <CrossChainFetch />
    </div>
  );
}
