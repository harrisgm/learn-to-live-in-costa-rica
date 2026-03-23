import { NextResponse } from "next/server";

import { getSessionStore } from "@/lib/server/session-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get("learnerId");

  if (!learnerId) {
    return NextResponse.json(
      { error: "learnerId query parameter is required." },
      { status: 400 }
    );
  }

  const store = getSessionStore();
  const [sessions, review] = await Promise.all([
    store.listSessions(learnerId),
    store.getLearnerReview(learnerId)
  ]);

  return NextResponse.json({ sessions, review });
}
