import { JobStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Params) {
  const profile = await getProfile(req);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await context.params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { acceptedBid: true },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    job.posterId === profile.userId ||
    (job.acceptedBid?.eyeUserId ?? null) === profile.userId;
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ status: job.status });
}

export async function PATCH(req: NextRequest, context: Params) {
  const profile = await getProfile(req);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await context.params;

  const raw = await req.text().catch(() => "");
  let body: {
    status?: "MATCHED" | "LIVE" | "COMPLETED" | "FLAGGED";
    bidId?: string;
    rating?: number;
    review?: string;
  };

  try {
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON", raw }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { acceptedBid: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPoster = profile.role === "POSTER";
  const isEyeForJob = (job.acceptedBid?.eyeUserId ?? null) === profile.userId;

  // Only Poster can transition lifecycle statuses.
  if (
    body.status === "MATCHED" ||
    body.status === "LIVE" ||
    body.status === "COMPLETED"
  ) {
    if (!isPoster || job.posterId !== profile.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Report can be triggered by either participant.
  if (body.status === "FLAGGED") {
    const allowed = job.posterId === profile.userId || isEyeForJob;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.FLAGGED },
    });

    // For MVP: just log server-side event.
    console.log("Stream flagged", { jobId, flaggedBy: profile.userId });

    return NextResponse.json({ ok: true });
  }

  if (body.status === "MATCHED") {
    if (!body.bidId) {
      return NextResponse.json({ error: "bidId required" }, { status: 400 });
    }
    if (job.status !== JobStatus.OPEN) {
      return NextResponse.json({ error: "Job not open" }, { status: 409 });
    }

    const bid = await prisma.bid.findFirst({
      where: { id: body.bidId, jobId },
    });
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    const channelName = `sightseeing-${job.id}`
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .slice(0, 64);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.MATCHED,
        acceptedBidId: bid.id,
        channelName,
      },
    });

    return NextResponse.json({ jobId: updated.id, status: updated.status });
  }

  if (body.status === "LIVE") {
    if (job.status !== JobStatus.MATCHED) {
      return NextResponse.json({ error: "Job must be matched first" }, { status: 409 });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.LIVE },
    });

    return NextResponse.json({ jobId: updated.id, status: updated.status });
  }

  if (body.status === "COMPLETED") {
    // Allow completion after MATCHED or LIVE, but only Poster can do it (checked above).
    if (job.status !== JobStatus.MATCHED && job.status !== JobStatus.LIVE) {
      return NextResponse.json({ error: "Invalid state" }, { status: 409 });
    }

    const rating = body.rating;
    const review = body.review;
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !review ||
      review.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "rating/review required (rating 1-5; review min 3 chars)" },
        { status: 400 },
      );
    }

    if (!job.acceptedBidId || !job.acceptedBid) {
      return NextResponse.json(
        { error: "accepted bid required" },
        { status: 409 },
      );
    }

    // Atomic reputation + job completion write.
    await prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          rating,
          review: review.trim(),
        },
      });

      const eyeUser = await tx.user.findUnique({
        where: { userId: job.acceptedBid!.eyeUserId },
        select: { id: true, totalRating: true, jobsCompleted: true },
      });

      if (!eyeUser) {
        throw new Error("Eye user not found");
      }

      const nextTotal = eyeUser.totalRating + rating;
      const nextJobs = eyeUser.jobsCompleted + 1;
      const nextAvg = nextJobs > 0 ? nextTotal / nextJobs : 0;

      await tx.user.update({
        where: { userId: job.acceptedBid!.eyeUserId },
        data: {
          totalRating: nextTotal,
          jobsCompleted: nextJobs,
          rating: nextAvg,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}

