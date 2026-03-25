import { JobStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { toJobDto } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "POSTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await req.text().catch(() => "");
  let body: {
    jobId?: string;
    bidId?: string;
    status?: "MATCHED" | "LIVE" | "COMPLETED";
  };
  try {
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", raw },
      { status: 400 },
    );
  }
  if (!body.jobId || !body.status) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: body.jobId } });
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.posterId !== profile.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.status === "MATCHED") {
    if (!body.bidId) {
      return NextResponse.json({ error: "bidId required" }, { status: 400 });
    }
    const bid = await prisma.bid.findFirst({
      where: { id: body.bidId, jobId: body.jobId },
    });
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }
    if (job.status !== JobStatus.OPEN) {
      return NextResponse.json({ error: "Job not open" }, { status: 409 });
    }
    const channelName = `sightseeing-${job.id}`
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .slice(0, 64);
    const updated = await prisma.job.update({
      where: { id: body.jobId },
      data: {
        status: JobStatus.MATCHED,
        acceptedBidId: bid.id,
        channelName,
      },
    });
    return NextResponse.json({ job: toJobDto(updated) });
  }

  if (body.status === "LIVE") {
    if (job.status !== JobStatus.MATCHED) {
      return NextResponse.json(
        { error: "Job must be matched first" },
        { status: 409 },
      );
    }
    const updated = await prisma.job.update({
      where: { id: body.jobId },
      data: { status: JobStatus.LIVE },
    });
    return NextResponse.json({ job: toJobDto(updated) });
  }

  if (body.status === "COMPLETED") {
    if (job.status !== JobStatus.LIVE && job.status !== JobStatus.MATCHED) {
      return NextResponse.json({ error: "Invalid state" }, { status: 409 });
    }
    const updated = await prisma.job.update({
      where: { id: body.jobId },
      data: { status: JobStatus.COMPLETED },
    });
    return NextResponse.json({ job: toJobDto(updated) });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
