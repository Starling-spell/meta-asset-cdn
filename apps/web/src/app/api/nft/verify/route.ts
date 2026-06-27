import type { NextRequest } from "next/server";
import { verifyOwnershipServer } from "@/server/nft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/nft/verify  { chain: "evm" | "solana", address, assetKey }  -> { owns }
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { chain, address, assetKey } = (await req.json()) as {
      chain?: "evm" | "solana";
      address?: string;
      assetKey?: string;
    };
    if ((chain !== "evm" && chain !== "solana") || !address || !assetKey) {
      return new Response("chain ('evm'|'solana'), address, and assetKey are required", { status: 400 });
    }

    const owns = await verifyOwnershipServer(chain, address, assetKey);
    return Response.json({ owns });
  } catch (err) {
    console.error("[nft verify] failed:", err);
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
}
