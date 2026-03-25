import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ profile });
}

