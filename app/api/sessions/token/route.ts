import { NextRequest, NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { jobId?: string; role?: "eye" | "poster" };
  if (!body.jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: body.jobId },
    include: { acceptedBid: true },
  });

  if (!job || !job.channelName) {
    return NextResponse.json({ error: "Job not ready for session" }, { status: 409 });
  }

  if (job.status === "FLAGGED" || job.status === "COMPLETED") {
    return NextResponse.json({ error: "Job unavailable" }, { status: 409 });
  }

  const allowedPoster =
    profile.role === "POSTER" && job.posterId === profile.userId;
  const allowedEye =
    profile.role === "EYE" &&
    job.acceptedBidId &&
    job.acceptedBid?.eyeUserId === profile.userId;

  if (!allowedPoster && !allowedEye) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";
  const channel = job.channelName;

  // uid=0 tells Agora to auto-assign a unique UID to each client that joins.
  // A token built with uid=0 is a wildcard token accepted by any auto-assigned UID.
  // This prevents UID_CONFLICT errors that occur when a stale client hasn't fully
  // left the channel before a new client instance tries to join with the same UID.
  let token: string | null = null;
  if (appId && appCertificate) {
    const expire = Math.floor(Date.now() / 1000) + 3600;
    token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      0,
      RtcRole.PUBLISHER,
      expire,
      expire,
    );
  }

  return NextResponse.json({
    appId: appId || null,
    channel,
    token,
    uid: 0,
  });
}
