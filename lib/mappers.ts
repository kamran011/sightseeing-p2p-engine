import type { Bid as PrismaBid, Job as PrismaJob } from "@prisma/client";
import type { Bid, Job, JobStatus } from "./types";

type BidWithEye = PrismaBid & {
  eye: { displayName: string; rating: number };
};

export function toJobDto(j: PrismaJob, bidCount?: number): Job & { bidCount?: number } {
  return {
    id: j.id,
    posterId: j.posterId,
    title: j.title,
    address: j.address,
    budget: j.budget,
    status: j.status as JobStatus,
    latitude: j.latitude,
    longitude: j.longitude,
    acceptedBidId: j.acceptedBidId ?? undefined,
    channelName: j.channelName ?? undefined,
    ...(bidCount !== undefined ? { bidCount } : {}),
  };
}

export function toBidDto(b: BidWithEye): Bid {
  return {
    id: b.id,
    jobId: b.jobId,
    eyeUserId: b.eyeUserId,
    amount: b.amount,
    note: b.note ?? undefined,
    eyeName: b.eye.displayName,
    eyeRating: b.eye.rating,
  };
}
