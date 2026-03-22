import { NextResponse } from "next/server";

import { loadBootstrapPayload } from "@/lib/data/loaders";

export const runtime = "nodejs";

export async function GET() {
  const payload = await loadBootstrapPayload();
  return NextResponse.json(payload);
}
