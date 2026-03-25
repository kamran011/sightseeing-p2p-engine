import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role as PrismaRole } from "@prisma/client";
import { randomUUID } from "crypto";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["POSTER", "EYE"]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // `userId` is what Jobs/Bids reference. Keep it URL-safe.
  const userId = `user_${randomUUID()}`;

  const created = await prisma.user.create({
    data: {
      userId,
      role: role as PrismaRole,
      displayName: role === "POSTER" ? "New Poster" : "New Eye",
      rating: 0,
      email,
      passwordHash,
    },
    select: { id: true, userId: true, email: true, role: true },
  });

  return NextResponse.json({ user: created });
}

