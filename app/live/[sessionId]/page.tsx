import { LiveRoom } from "@/components/live/live-room";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function LiveSessionPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { role: roleParam } = await searchParams;
  const role = roleParam === "poster" ? "poster" : "eye";

  return (
    <LiveRoom jobId={sessionId} role={role} />
  );
}
