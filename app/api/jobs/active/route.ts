import { JobStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { toJobDto } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "EYE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return jobs where the poster has accepted this eye's bid and the job is
  // ready for a live session (MATCHED or LIVE).
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: [JobStatus.MATCHED, JobStatus.LIVE] },
      acceptedBid: {
        eyeUserId: profile.userId,
      },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({
    jobs: jobs.map((j) => toJobDto(j)),
  });
}

