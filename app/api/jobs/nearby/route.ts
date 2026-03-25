import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NearbyRow = {
  id: string;
  title: string;
  address: string;
  budget: number;
  distance_km: number;
};

export async function GET(req: NextRequest) {
  const profile = await getProfile(req);
  if (!profile || profile.role !== "EYE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat")) || 31.52;
  const lng = Number(searchParams.get("lng")) || 74.35;

  const rows = await prisma.$queryRaw<NearbyRow[]>`
    SELECT
      id,
      title,
      address,
      budget,
      (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude))
          * cos(radians(longitude) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(latitude))
        )
      ) AS distance_km
    FROM "Job"
    WHERE status = 'OPEN'
      AND (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude))
          * cos(radians(longitude) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(latitude))
        )
      ) < 10
    ORDER BY distance_km ASC
  `;

  return NextResponse.json({
    jobs: rows.map((r) => ({
      id: r.id,
      title: r.title,
      address: r.address,
      budget: Number(r.budget),
      distanceMiles: Number(r.distance_km) * 0.621371,
    })),
  });
}
