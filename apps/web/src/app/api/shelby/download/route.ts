import type { NextRequest } from "next/server";
import { getServerShelby } from "@/server/shelby";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/shelby/download?owner=<addr>&blobName=<name>
 * Streams a blob back from the nearest Shelby RPC node.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const owner = req.nextUrl.searchParams.get("owner");
    const blobName = req.nextUrl.searchParams.get("blobName");
    if (!owner || !blobName) {
      return new Response("'owner' and 'blobName' query params are required", { status: 400 });
    }

    const { client } = getServerShelby();
    const blob = await client.download({ account: owner, blobName });

    return new Response(blob.readable, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(blob.contentLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
}
