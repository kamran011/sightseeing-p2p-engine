import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { toBidDto } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import type { JobStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Params) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "POSTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: jobId } = await context.params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      bids: {
        include: { eye: true },
        orderBy: { amount: "asc" },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.posterId !== profile.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bids = job.bids.map((b) =>
    toBidDto({
      ...b,
      eye: b.eye,
    }),
  );

  const status = job.status as JobStatus;
  return NextResponse.json({
    jobId,
    status,
    bids,
  });
}
