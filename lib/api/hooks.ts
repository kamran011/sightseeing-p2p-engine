"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Bid, Job, JobStatus } from "@/lib/types";

export type JobWithBids = Job & { bidCount: number };

export function usePosterJobs() {
  return useQuery({
    queryKey: ["jobs", "poster"],
    queryFn: () => apiFetch<{ jobs: JobWithBids[] }>("/api/jobs"),
    select: (d) => d.jobs,
  });
}

export function useJobBids(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", jobId, "bids"],
    queryFn: () =>
      apiFetch<{ jobId: string; status: JobStatus; bids: Bid[] }>(
        `/api/jobs/${jobId}/bids`,
      ),
    enabled: !!jobId,
    staleTime: 0,
    refetchInterval: (query) => {
      if (typeof document === "undefined") return false;
      if (document.visibilityState !== "visible") return false;
      return query.state.data?.status === "OPEN" ? 3000 : false;
    },
    refetchOnWindowFocus: true,
  });
}

export function useNearbyJobs(lat: number, lng: number) {
  return useQuery({
    queryKey: ["jobs", "nearby", lat, lng],
    queryFn: () =>
      apiFetch<{
        jobs: {
          id: string;
          title: string;
          address: string;
          budget: number;
          distanceMiles: number;
        }[];
      }>(`/api/jobs/nearby?lat=${lat}&lng=${lng}`),
    select: (d) => d.jobs,
  });
}

export function useEyeActiveJobs() {
  return useQuery({
    queryKey: ["jobs", "eye", "active"],
    queryFn: () => apiFetch<{ jobs: Job[] }>("/api/jobs/active"),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      if (typeof document === "undefined") return false;
      if (document.visibilityState !== "visible") return false;
      const jobs = query.state.data?.jobs ?? [];
      // Poll when:
      // - We have MATCHED jobs (might transition MATCHED -> LIVE)
      // - We currently have no active jobs (so we don't miss a session that
      //   starts after the page loaded).
      if (jobs.length === 0) return 2000;
      return jobs.some((j) => j.status === "MATCHED") ? 2000 : false;
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      address: string;
      budget: number;
      latitude?: number;
      longitude?: number;
    }) =>
      apiFetch<{ job: Job }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs", "poster"] }),
  });
}

export function usePlaceBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jobId: string; amount: number; note?: string }) =>
      apiFetch<{ bid: Bid }>("/api/bids", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jobId: string; bidId: string }) =>
      apiFetch<{ jobId: string; status: JobStatus }>(
        `/api/jobs/${body.jobId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            bidId: body.bidId,
            status: "MATCHED",
          }),
        },
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["jobs", "poster"] });
      qc.invalidateQueries({ queryKey: ["jobs", variables.jobId, "bids"] });
    },
  });
}

export function useMarkJobLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{ jobId: string; status: JobStatus }>(
        `/api/jobs/${jobId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "LIVE" }),
        },
      ),
    onSuccess: () => {
      // Poster dashboard consumes `["jobs","poster"]`
      qc.invalidateQueries({ queryKey: ["jobs", "poster"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useCompleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      jobId: string;
      rating: number;
      review: string;
    }) =>
      apiFetch<{ ok: boolean }>(
        `/api/jobs/${body.jobId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "COMPLETED",
            rating: body.rating,
            review: body.review,
          }),
        },
      ),
    onSuccess: () => {
      // Poster dashboard consumes `["jobs","poster"]`
      qc.invalidateQueries({ queryKey: ["jobs", "poster"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", "status", jobId],
    enabled: !!jobId,
    queryFn: () =>
      apiFetch<{ status: JobStatus }>(`/api/jobs/${jobId}/status`),
  });
}

export function useReportJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { jobId: string }) =>
      apiFetch<{ ok: boolean }>(`/api/jobs/${body.jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "FLAGGED" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs", "poster"] });
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ profile: any }>("/api/me"),
    staleTime: 0,
  });
}

export function useEyeOpenBidJobIds() {
  return useQuery({
    queryKey: ["bids", "me", "openJobIds"],
    queryFn: () => apiFetch<{ jobIds: string[] }>("/api/bids/me"),
    staleTime: 0,
  });
}

export type SessionToken = {
  appId: string | null;
  channel: string;
  token: string | null;
  uid: number;
};

export function useSessionToken(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["sessions", "token", jobId],
    queryFn: () =>
      apiFetch<SessionToken>("/api/sessions/token", {
        method: "POST",
        body: JSON.stringify({ jobId }),
      }),
    enabled: !!jobId && enabled,
    staleTime: 50 * 60 * 1000,
  });
}
