import { JobStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { toBidDto } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "EYE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    jobId?: string;
    amount?: number;
    note?: string;
  };
  if (!body.jobId || typeof body.amount !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: body.jobId } });
  if (!job || job.status !== JobStatus.OPEN) {
    return NextResponse.json({ error: "Job not available" }, { status: 409 });
  }

  try {
    const bid = await prisma.bid.create({
      data: {
        jobId: body.jobId,
        eyeUserId: profile.userId,
        amount: body.amount,
        note: body.note,
      },
      include: { eye: true },
    });
    return NextResponse.json({ bid: toBidDto(bid) });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You already placed a bid on this job" },
        { status: 409 },
      );
    }
    throw e;
  }
}
