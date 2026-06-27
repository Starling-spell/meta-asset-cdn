import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { defaultExpirationMicros, getServerShelby } from "@/server/shelby";

// Node runtime: the Shelby SDK uses node crypto + native erasure-coding libs.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/shelby/upload  (multipart: file, blobName?, contentType?)
 * Uploads the blob to Shelby on-chain via the server service account, returns the
 * (owner, blobName) pair plus integrity metadata for the registry.
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response("missing 'file'", { status: 400 });
    }

    const blobName = (form.get("blobName") as string | null)?.trim() || file.name || `blob-${Date.now()}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentHash = createHash("sha256").update(bytes).digest("hex");

    const { client, account, ownerAddress } = getServerShelby();
    await client.upload({
      blobData: bytes,
      signer: account,
      blobName,
      expirationMicros: defaultExpirationMicros(),
    });

    return Response.json({ owner: ownerAddress, blobName, contentHash, sizeBytes: bytes.byteLength });
  } catch (err) {
    console.error("[shelby upload] failed:", err);
    return new Response(err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err), { status: 500 });
  }
}
