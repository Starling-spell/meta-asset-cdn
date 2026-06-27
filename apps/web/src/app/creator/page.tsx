import { UploadAsset } from "@/components/UploadAsset";

export default function CreatorPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Creator Portal</h1>
        <p className="text-zinc-400">Upload a 3D asset to Shelby and register it on Aptos.</p>
      </header>
      <UploadAsset />
    </div>
  );
}
