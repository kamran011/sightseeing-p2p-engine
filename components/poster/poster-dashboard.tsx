"use client";

import { CheckCircle, Map as MapIcon, MapPin, Plus } from "lucide-react";
import { Map, Marker } from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useAcceptBid,
  useCreateJob,
  useJobBids,
  usePosterJobs,
} from "@/lib/api/hooks";
import type { Bid } from "@/lib/types";
import { AddressAutocompleteField } from "@/components/poster/address-autocomplete-field";

function statusLabel(s: string) {
  switch (s) {
    case "OPEN":
      return "Open";
    case "MATCHED":
      return "Matched";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Done";
    case "FLAGGED":
      return "Flagged";
    default:
      return s;
  }
}

export function PosterDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: jobs, isLoading } = usePosterJobs();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => jobs?.find((j) => j.id === selectedId) ?? null,
    [jobs, selectedId],
  );
  const bidsQuery = useJobBids(selected?.id ?? null);
  const createJob = useCreateJob();
  const accept = useAcceptBid();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // When the Places Autocomplete modal is open we keep background scrolling locked.
  // (Radix `modal={false}` disables its built-in scroll lock.)
  useEffect(() => {
    if (searchParams.get("postJob") === "1") {
      setOpen(true);
      router.replace("/poster", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscrollBehavior;
    };
  }, [open]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col gap-4 p-4 pb-28 md:pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Poster dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Post sightseeing requests and review bids in near real time.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <MapIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Map selector</p>
            <p className="text-xs text-slate-500">
              Placeholder — connect Mapbox or Google Maps in production.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Your jobs</h2>
        <Dialog onOpenChange={setOpen} open={open} modal={false}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Post job
            </Button>
          </DialogTrigger>
          <DialogContent
            onInteractOutside={(e) => {
              const t = e.target as HTMLElement | null;
              // Google Places Autocomplete renders its dropdown into a portal
              // attached to `document.body` (class: `.pac-container`).
              // If Radix treats that as "outside", it closes the dialog before
              // the user can actually select a suggestion.
              if (t?.closest?.(".pac-container")) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Post a request</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const b = Number(budget);
                if (
                  !title.trim() ||
                  !address.trim() ||
                  latitude === null ||
                  longitude === null ||
                  Number.isNaN(b)
                ) {
                  return;
                }
                createJob.mutate(
                  {
                    title: title.trim(),
                    address: address.trim(),
                    budget: b,
                    latitude,
                    longitude,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setTitle("");
                      setAddress("");
                      setLatitude(null);
                      setLongitude(null);
                      setBudget("");
                    },
                  },
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="title">Job title</Label>
                <Input
                  id="title"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tour the old city bazaar"
                  value={title}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr">Address / area</Label>
                <AddressAutocompleteField
                  id="addr"
                  disabled={createJob.isPending}
                  value={address}
                  onValueChange={(v) => {
                    setAddress(v);
                    setLatitude(null);
                    setLongitude(null);
                  }}
                  onPlaceSelected={(p) => {
                    setAddress(p.address);
                    setLatitude(p.latitude);
                    setLongitude(p.longitude);
                  }}
                  placeholder="e.g. Liberty Market, Lahore"
                />
                {latitude !== null && longitude !== null ? (
                  <div className="mt-2 h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <Map zoom={14} center={{ lat: latitude, lng: longitude }}>
                      <Marker position={{ lat: latitude, lng: longitude }} />
                    </Map>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input
                  id="budget"
                  inputMode="decimal"
                  min={1}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="45"
                  type="number"
                  value={budget}
                />
              </div>
              <Button
                className="w-full"
                disabled={
                  createJob.isPending ||
                  latitude === null ||
                  longitude === null ||
                  !title.trim() ||
                  !address.trim()
                }
                type="submit"
              >
                Publish request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading jobs…</p>
      ) : (
        <div className="h-[220px] w-full overflow-y-auto pr-1 md:h-[280px]">
          <div className="space-y-2">
            {jobs?.map((j) => (
              <button
                className={`w-full min-w-0 max-w-full rounded-xl border p-3 text-left transition ${
                  selected?.id === j.id
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                type="button"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="flex min-w-0 items-center gap-1 text-sm font-medium text-slate-900">
                      <MapPin className="h-4 w-4 shrink-0 text-indigo-600" />
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={j.address}
                        aria-label={j.address}
                      >
                        {j.address}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ${j.budget} · {statusLabel(j.status)}
                    </p>
                  </div>
                  <Badge className="shrink-0" variant="secondary">
                    {j.bidCount ?? 0} bids
                  </Badge>
                </div>
              </button>
            ))}
            {!jobs?.length ? (
              <p className="text-sm text-slate-500">No jobs yet.</p>
            ) : null}
          </div>
        </div>
      )}

      {selected ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bids received</CardTitle>
            <CardDescription
              className="line-clamp-2"
              title={selected.address}
            >
              {selected.address}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bidsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading bids…</p>
            ) : null}
            {bidsQuery.data?.bids.map((b: Bid) => (
              <BidRow
                accept={accept}
                bid={b}
                jobId={selected.id}
                key={b.id}
                status={
                  bidsQuery.data?.status ?? selected.status
                }
              />
            ))}
            {!bidsQuery.data?.bids.length ? (
              <p className="text-sm text-slate-500">No bids yet.</p>
            ) : null}
            <Separator />
            {selected.status === "MATCHED" || selected.status === "LIVE" ? (
              <Button asChild className="w-full" variant="default">
                <Link href={`/live/${selected.id}?role=poster`}>
                  Enter live session
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function BidRow({
  bid,
  jobId,
  status,
  accept,
}: {
  bid: Bid;
  jobId: string;
  status: string;
  accept: ReturnType<typeof useAcceptBid>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-900">{bid.eyeName}</p>
        <p className="text-xs text-slate-500">
          Rating {bid.eyeRating.toFixed(1)} · ${bid.amount}
        </p>
        {bid.note ? (
          <p className="mt-1 text-xs text-slate-600">{bid.note}</p>
        ) : null}
      </div>
      {status === "OPEN" ? (
        <Button
          disabled={accept.isPending}
          onClick={() =>
            accept.mutate(
              { jobId, bidId: bid.id },
              {
                onSuccess: () => {
                  /* query invalidation refreshes list */
                },
              },
            )
          }
          size="sm"
        >
          <CheckCircle className="mr-1 h-4 w-4" />
          Accept
        </Button>
      ) : (
        <Badge variant="outline">Reviewed</Badge>
      )}
    </div>
  );
}
