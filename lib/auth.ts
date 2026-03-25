import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Profile } from "./types";

/**
 * Auth helper used by API routes.
 * We resolve the current user from the Auth.js JWT (credentials provider).
 */
export async function getProfile(req: NextRequest): Promise<Profile | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userId = token?.id;
  if (!userId || typeof userId !== "string") return null;

  const row = await prisma.user.findUnique({
    where: { userId },
  });
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    role: row.role as Profile["role"],
    displayName: row.displayName,
    rating: row.rating,
  };
}
