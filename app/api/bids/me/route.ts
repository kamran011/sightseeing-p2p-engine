import { JobStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "EYE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Used by the Eye feed to decide whether to show "Place bid" or the
  // "Await acceptance" badge for each nearby OPEN job.
  const bids = await prisma.bid.findMany({
    where: {
      eyeUserId: profile.userId,
      job: {
        status: JobStatus.OPEN,
      },
    },
    select: { jobId: true },
  });

  return NextResponse.json({
    jobIds: bids.map((b) => b.jobId),
  });
}

