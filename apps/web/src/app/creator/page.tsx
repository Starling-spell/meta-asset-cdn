import Link from "next/link";
import { UploadAsset } from "@/components/UploadAsset";

export default function CreatorPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="badge badge-accent">For studios</span>
        <h1 className="text-3xl font-bold">Creator Portal</h1>
        <p className="text-zinc-400">
          Upload a 3D asset to Shelby and register it on Aptos. New here?{" "}
          <Link href="/guide#creator" className="text-accent hover:underline">
            Read the guide
          </Link>
          .
        </p>
      </header>
      <UploadAsset />
    </div>
  );
}
