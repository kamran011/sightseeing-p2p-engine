"use client";

import { MapPin, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBrowserGeolocation } from "@/hooks/use-browser-geolocation";
import {
  useEyeActiveJobs,
  useEyeOpenBidJobIds,
  useMe,
  useNearbyJobs,
  usePlaceBid,
} from "@/lib/api/hooks";

type LiveAlert = { jobId: string; title: string };

export function EyeFeed() {
  const router = useRouter();
  const geo = useBrowserGeolocation();
  const { data: jobs, isLoading } = useNearbyJobs(geo.lat, geo.lng);
  const {
    data: activeJobsData,
    isLoading: activeJobsLoading,
  } = useEyeActiveJobs();
  const { data: meData } = useMe();
  const activeJobs = activeJobsData?.jobs ?? [];
  const placeBid = usePlaceBid();
  const [bidForId, setBidForId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: myOpenBidIdsData } = useEyeOpenBidJobIds();
  const placedBidJobIds = myOpenBidIdsData?.jobIds ?? [];

  // Detect when a job transitions to LIVE and show an incoming-call banner.
  const prevStatusRef = useRef<Record<string, string>>({});
  const [liveAlert, setLiveAlert] = useState<LiveAlert | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeJobs.forEach((job) => {
      const prev = prevStatusRef.current[job.id];
      if (prev && prev !== "LIVE" && job.status === "LIVE" && !liveAlert) {
        setLiveAlert({ jobId: job.id, title: job.title });
        // Auto-dismiss after 12 s if the Eye ignores it.
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setLiveAlert(null), 12000);
      }
      prevStatusRef.current[job.id] = job.status;
    });
  }, [activeJobs, liveAlert]);

  function dismissAlert() {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setLiveAlert(null);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col gap-4 p-4 pb-28 md:pb-8">
      {/* Incoming-call banner — shown when a job flips MATCHED → LIVE */}
      {liveAlert ? (
        <div className="fixed inset-x-0 top-0 z-50 flex items-start justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center gap-4 p-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600">
                <Video className="h-6 w-6 text-white" />
                {/* pulsing ring */}
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  Session is live!
                </p>
                <p className="truncate text-xs text-slate-400">
                  {liveAlert.title} — Poster is waiting for you
                </p>
              </div>
              <button
                aria-label="Dismiss"
                className="shrink-0 rounded-full p-1 text-slate-400 hover:text-white"
                onClick={dismissAlert}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 border-t border-white/10 px-4 py-3">
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-500"
                onClick={dismissAlert}
                size="sm"
                variant="ghost"
              >
                Ignore
              </Button>
              <Button
                className="flex-1"
                size="sm"
                onClick={() => {
                  dismissAlert();
                  router.push(`/live/${liveAlert.jobId}?role=eye`);
                }}
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Nearby jobs
        </h1>
        {meData?.profile?.displayName ? (
          <p className="text-xs text-slate-600">
            {meData.profile.displayName} · ⭐{" "}
            {Number(meData.profile.rating).toFixed(1)}
          </p>
        ) : null}
        <p className="text-sm text-slate-600">
          Discover paid sightseeing gigs around you.
        </p>
        {geo.status !== "ok" ? (
          <p className="text-xs text-slate-500">
            {geo.status === "loading"
              ? "Finding your location…"
              : geo.status === "denied"
                ? "Location blocked — using a default area."
                : "Location unavailable — using a default area."}
          </p>
        ) : null}
      </header>

      {activeJobsLoading ? (
        <p className="text-sm text-slate-500">Checking live sessions…</p>
      ) : activeJobs.length ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            My active sessions
          </h2>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {job.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="text-xs">
                      {job.status === "LIVE"
                        ? "Live"
                        : job.status === "MATCHED"
                          ? "Await acceptance to go live"
                          : job.status}
                    </Badge>
                  </div>
                  <Button asChild size="sm" variant="default">
                    <Link href={`/live/${job.id}?role=eye`}>Join</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {jobs?.map((j) => (
            <Card key={j.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">
                  {j.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {j.address} · {j.distanceMiles.toFixed(1)} mi · ${j.budget}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {placedBidJobIds.includes(j.id) ? (
                  <Badge variant="secondary" className="text-xs">
                    Await acceptance to go live
                  </Badge>
                ) : (
                  <Dialog
                    onOpenChange={(o) => {
                      if (o) {
                        setBidForId(j.id);
                        setSubmitError(null);
                      } else {
                        setBidForId(null);
                        setAmount("");
                        setNote("");
                        setSubmitError(null);
                      }
                    }}
                    open={bidForId === j.id}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setBidForId(j.id)}
                        size="sm"
                        variant="default"
                      >
                        Place bid
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Place bid</DialogTitle>
                      </DialogHeader>
                      <form
                        className="space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!bidForId) return;
                          setSubmitError(null);
                          const n = Number(amount);
                          if (Number.isNaN(n)) return;

                          const jobId = bidForId;
                          placeBid.mutate(
                            {
                              jobId,
                              amount: n,
                              note: note || undefined,
                            },
                            {
                              onSuccess: () => {
                                setBidForId(null);
                                setAmount("");
                                setNote("");
                                setSubmitError(null);
                              },
                              onError: (err) => {
                                const msg =
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to submit bid";
                                setSubmitError(msg);
                              },
                            },
                          );
                        }}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="amt">Your bid ($)</Label>
                          <Input
                            id="amt"
                            inputMode="decimal"
                            min={1}
                            onChange={(e) => setAmount(e.target.value)}
                            type="number"
                            value={amount}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="note">Note (optional)</Label>
                          <Textarea
                            id="note"
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Short intro or gear you use"
                            value={note}
                          />
                        </div>
                        <Button
                          className="w-full"
                          disabled={placeBid.isPending}
                          type="submit"
                        >
                          Submit bid
                        </Button>

                        {submitError ? (
                          <p className="text-center text-xs text-red-600">
                            {submitError}
                          </p>
                        ) : null}
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
          {!jobs?.length && !activeJobs.length ? (
            <p className="text-sm text-slate-500">No open jobs nearby.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
