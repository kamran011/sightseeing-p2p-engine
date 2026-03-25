"use client";

// agora-rtc-react bundles its own copy of agora-rtc-sdk-ng internally.
// We MUST use that same bundled instance to create the Agora client so that
// the tracks created by useLocalCameraTrack / useLocalMicrophoneTrack and the
// client used in useJoin / usePublish all come from the SAME SDK instance.
//
// Loading agora-rtc-react (or its bundled SDK) at module-eval time crashes the
// server with "window is not defined", so we lazy-require it only in the browser.
const AgoraRTCReactLib: any =
  typeof window === "undefined" ? null : require("agora-rtc-react");

// The default export of agora-rtc-react IS the bundled AgoraRTC factory.
// We use this (not the separate agora-rtc-sdk-ng package) for createClient
// and getCameras so everything shares one SDK instance.
function getInternalAgoraRTC() {
  return AgoraRTCReactLib?.default ?? null;
}

import type { IAgoraRTCClient } from "agora-rtc-react";
import {
  AlertCircle,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Video,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useCompleteJob,
  useJobStatus,
  useMarkJobLive,
  useReportJob,
} from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { ReviewModal } from "@/components/poster/review-modal";

type Role = "eye" | "poster";

function LiveRoomInner({ jobId, role }: { jobId: string; role: Role }) {
  const {
    LocalUser,
    RemoteUser,
    useJoin,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
  } = AgoraRTCReactLib as any;

  const router = useRouter();
  const markLive = useMarkJobLive();
  const complete = useCompleteJob();
  const report = useReportJob();
  const { data: jobStatusData } = useJobStatus(jobId);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camList, setCamList] = useState<MediaDeviceInfo[]>([]);
  const [camIdx, setCamIdx] = useState(0);

  useEffect(() => {
    if (role === "poster") {
      markLive.mutate(jobId);
    }
  }, [jobId, role, markLive.mutate]);

  const { isConnected, error: joinError } = useJoin(
    async () => {
      const res = await fetch("/api/sessions/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, role }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not join session");
      }
      const j = (await res.json()) as {
        appId: string | null;
        channel: string;
        token: string | null;
        uid: number;
      };
      if (!j.appId) {
        throw new Error("Set NEXT_PUBLIC_AGORA_APP_ID in .env.local");
      }
      // uid=0 → Agora auto-assigns a unique UID, preventing UID_CONFLICT on
      // hot-reload / StrictMode double-mount / fast re-navigation.
      return {
        appid: j.appId,
        channel: j.channel,
        token: j.token,
        uid: 0,
      };
    },
    !!jobId,
  );

  // Eye publishes; Poster only receives.
  const eyeReady = role === "eye" && isConnected;
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(eyeReady);
  const { localCameraTrack } = useLocalCameraTrack(isConnected);

  // Publish the Eye's tracks using agora-rtc-react's usePublish hook.
  // This works because both tracks and client come from the same bundled SDK.
  const tracksToPublish = [localMicrophoneTrack, localCameraTrack].filter(
    (t): t is NonNullable<typeof t> => !!t,
  );
  usePublish(tracksToPublish, eyeReady && tracksToPublish.length > 0);

  useEffect(() => {
    if (!eyeReady || !localCameraTrack) return;
    const AgoraRTC = getInternalAgoraRTC();
    if (!AgoraRTC) return;
    void AgoraRTC.getCameras().then(setCamList);
  }, [eyeReady, localCameraTrack]);

  useEffect(() => {
    if (!localMicrophoneTrack) return;
    void localMicrophoneTrack.setEnabled(!muted);
  }, [muted, localMicrophoneTrack]);

  const remoteUsers = useRemoteUsers();
  const remote = remoteUsers[0];
  const eyeConnected = role === "poster" && remoteUsers.length > 0;

  // When the Eye is connected and the Poster (remote user) leaves, auto-redirect.
  const [posterLeft, setPosterLeft] = useState(false);
  const hadRemoteRef = useRef(false);

  // Effect 1: detect when the Poster disconnects.
  useEffect(() => {
    if (role !== "eye") return;
    if (remoteUsers.length > 0) {
      hadRemoteRef.current = true;
    } else if (hadRemoteRef.current && !posterLeft) {
      setPosterLeft(true);
    }
  }, [role, remoteUsers.length, posterLeft]);

  // Effect 2: once posterLeft is true, redirect after 3 s.
  // Kept separate so the timer is never cancelled by unrelated dependency changes.
  useEffect(() => {
    if (!posterLeft) return;
    const t = setTimeout(() => router.push("/eye"), 3000);
    return () => clearTimeout(t);
  }, [posterLeft, router]);

  async function switchCamera() {
    const track = localCameraTrack;
    if (!track || camList.length < 2) return;
    const next = (camIdx + 1) % camList.length;
    const device = camList[next];
    if (device?.deviceId) {
      await track.setDevice(device.deviceId);
      setCamIdx(next);
    }
  }

  function endSession() {
    router.push(role === "poster" ? "/poster" : "/eye");
  }

  if (joinError) {
    const msg = joinError.message || String(joinError);
    const notReady =
      msg.toLowerCase().includes("not ready") ||
      msg.toLowerCase().includes("session");
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-slate-900 p-6 text-center">
        <AlertCircle className="h-14 w-14 text-amber-400" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">
            {notReady ? "Session not ready yet" : "Could not join session"}
          </p>
          <p className="max-w-xs text-sm text-slate-400">
            {notReady
              ? "The Poster hasn't accepted a bid for this job yet. Once accepted, you'll be able to join the live room."
              : msg}
          </p>
        </div>
        <Button onClick={endSession} variant="secondary">
          <PhoneOff className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-slate-900">
      <div className="flex flex-1 items-center justify-center p-3">
        <div
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-xl",
            "aspect-[9/16] max-h-[min(85dvh,720px)]",
          )}
        >
          {eyeConnected ? (
            <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
              Eye joined
            </div>
          ) : null}
          {role === "poster" && localCameraTrack ? (
            <div className="absolute right-3 top-3 z-20 h-24 w-24 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/60">
              <LocalUser
                audioTrack={localMicrophoneTrack}
                cameraOn
                className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                micOn={false}
                playAudio={false}
                playVideo
                videoTrack={localCameraTrack}
              />
            </div>
          ) : null}
          {posterLeft ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <PhoneOff className="h-12 w-12 text-slate-400" />
              <p className="text-base font-semibold text-white">
                Session ended
              </p>
              <p className="text-sm text-slate-400">
                The Poster ended the call. Redirecting you back…
              </p>
            </div>
          ) : role === "eye" ? (
            <LocalUser
              audioTrack={localMicrophoneTrack}
              cameraOn
              className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              micOn={!muted}
              playAudio={false}
              playVideo
              videoTrack={localCameraTrack}
            />
          ) : (
            <>
              {remote ? (
                <RemoteUser
                  className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                  playAudio
                  playVideo
                  user={remote}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
                  <Video className="h-12 w-12 opacity-60" />
                  <p className="text-sm">Waiting for the Eye to connect…</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-slate-800/80 bg-slate-900/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div
          className={cn(
            "mx-auto flex max-w-md items-center justify-center gap-2",
            role === "eye" ? "flex-nowrap" : "flex-wrap",
          )}
        >
          {role === "eye" ? (
            <>
              <Button
                className="flex-1 min-w-0 px-2 text-xs whitespace-nowrap sm:flex-none sm:px-3"
                onClick={() => void switchCamera()}
                type="button"
                variant="secondary"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Switch
              </Button>
              <Button
                className="flex-1 min-w-0 px-2 text-xs whitespace-nowrap sm:flex-none sm:px-3"
                onClick={() => setMuted((m) => !m)}
                type="button"
                variant="secondary"
              >
                {muted ? (
                  <MicOff className="mr-1 h-4 w-4" />
                ) : (
                  <Mic className="mr-1 h-4 w-4" />
                )}
                {muted ? "Unmute" : "Mute"}
              </Button>
            </>
          ) : null}
          <Button
            className="flex-1 min-w-0 px-2 text-xs whitespace-nowrap sm:flex-none sm:px-3"
            onClick={endSession}
            type="button"
            variant="destructive"
          >
            <PhoneOff className="mr-1 h-4 w-4" />
            End
          </Button>
          <Button
            className="flex-1 min-w-0 px-2 text-xs whitespace-nowrap sm:flex-none sm:px-3"
            onClick={() => {
              report.mutate(
                { jobId },
                {
                  onSuccess: () => {
                    window.alert("Reported stream");
                  },
                },
              );
            }}
            disabled={report.isPending}
            type="button"
            variant="secondary"
          >
            <span className="sm:hidden">Report</span>
            <span className="hidden sm:inline">Report Stream</span>
          </Button>

          {role === "poster" &&
          (jobStatusData?.status === "MATCHED" ||
            jobStatusData?.status === "LIVE") ? (
            <Button
              className="flex-1 basis-full px-2 sm:basis-auto"
              disabled={complete.isPending}
              type="button"
              onClick={() => setReviewOpen(true)}
            >
              <Wallet className="mr-1 h-4 w-4" />
              Complete Job &amp; Rate
            </Button>
          ) : null}
        </div>
      </div>

      <ReviewModal
        open={reviewOpen}
        pending={complete.isPending}
        onClose={() => setReviewOpen(false)}
        onSubmit={({ rating, review }) => {
          complete.mutate(
            { jobId, rating, review },
            {
              onSuccess: () => {
                setReviewOpen(false);
                router.push("/poster");
              },
            },
          );
        }}
      />
    </div>
  );
}

export function LiveRoom({ jobId, role }: { jobId: string; role: Role }) {
  // Avoid SSR hydration mismatch: Agora libs reference `window` at module-eval
  // time, so we only render the RTC tree after mount (client-only).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const client = useMemo(() => {
    // Use the AgoraRTC factory that is BUNDLED INSIDE agora-rtc-react (its
    // default export). This is critical: if we used the separate agora-rtc-sdk-ng
    // package to create the client, the client and the tracks created by
    // useLocalCameraTrack / useLocalMicrophoneTrack would come from different
    // SDK instances and publish would fail with "parameter is not local track".
    const InternalAgoraRTC = getInternalAgoraRTC();
    if (!InternalAgoraRTC) return null;
    const c = InternalAgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    return c as unknown as IAgoraRTCClient;
  }, []);

  const AgoraRTCProvider = (AgoraRTCReactLib as any)?.AgoraRTCProvider;

  if (!mounted || !AgoraRTCReactLib || !AgoraRTCProvider || !client) return null;

  return (
    <AgoraRTCProvider client={client}>
      <LiveRoomInner jobId={jobId} role={role} />
    </AgoraRTCProvider>
  );
}
