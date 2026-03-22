import { NextResponse } from "next/server";

import { transcribeAudio } from "@/lib/server/speech";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await transcribeAudio(formData);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process audio." },
      { status: 400 }
    );
  }
}
