export type Role = "POSTER" | "EYE";

export type JobStatus =
  | "OPEN"
  | "MATCHED"
  | "LIVE"
  | "COMPLETED"
  | "FLAGGED";

export interface Profile {
  id: string;
  userId: string;
  role: Role;
  displayName: string;
  rating: number;
}

export interface Job {
  id: string;
  posterId: string;
  title: string;
  address: string;
  budget: number;
  status: JobStatus;
  latitude: number;
  longitude: number;
  acceptedBidId?: string;
  channelName?: string;
}

export interface Bid {
  id: string;
  jobId: string;
  eyeUserId: string;
  amount: number;
  note?: string;
  eyeName: string;
  eyeRating: number;
}

export interface JobsBidsResponse {
  jobId: string;
  status: JobStatus;
  bids: Bid[];
}
