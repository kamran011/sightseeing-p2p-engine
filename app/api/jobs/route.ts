import { JobStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { toJobDto } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "POSTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.job.findMany({
    where: { posterId: profile.userId },
    orderBy: { id: "desc" },
    include: {
      _count: { select: { bids: true } },
    },
  });

  const jobs = rows.map((j) =>
    toJobDto(j, j._count.bids),
  );
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "POSTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as {
    title?: string;
    address?: string;
    budget?: number;
    latitude?: number;
    longitude?: number;
  };
  if (!body.title || !body.address || typeof body.budget !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const created = await prisma.job.create({
    data: {
      posterId: profile.userId,
      title: body.title,
      address: body.address,
      budget: body.budget,
      status: JobStatus.OPEN,
      latitude: typeof body.latitude === "number" ? body.latitude : 31.52,
      longitude: typeof body.longitude === "number" ? body.longitude : 74.35,
    },
  });

  return NextResponse.json({ job: toJobDto(created) });
}
