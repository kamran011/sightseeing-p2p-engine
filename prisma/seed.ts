import { PrismaClient, Role, JobStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean slate for predictable local auth testing.
  await prisma.bid.deleteMany();
  await prisma.session.deleteMany();
  await prisma.job.deleteMany();

  const posterUserId = "poster_1";
  const eyeUserId = "eye_1";

  const posterPassword = "poster123";
  const eyePassword = "eye123";

  const posterPasswordHash = await bcrypt.hash(posterPassword, 10);
  const eyePasswordHash = await bcrypt.hash(eyePassword, 10);

  const poster = await prisma.user.upsert({
    where: { userId: posterUserId },
    create: {
      userId: posterUserId,
      role: Role.POSTER,
      displayName: "Alex (Poster)",
      rating: 4.9,
      totalRating: 49,
      jobsCompleted: 10,
      email: "poster@example.com",
      passwordHash: posterPasswordHash,
    },
    update: {
      email: "poster@example.com",
      passwordHash: posterPasswordHash,
      displayName: "Alex (Poster)",
      rating: 4.9,
      totalRating: 49,
      jobsCompleted: 10,
      role: Role.POSTER,
    },
  });

  const eye = await prisma.user.upsert({
    where: { userId: eyeUserId },
    create: {
      userId: eyeUserId,
      role: Role.EYE,
      displayName: "Sam (Eye)",
      rating: 4.8,
      totalRating: 48,
      jobsCompleted: 10,
      email: "eye@example.com",
      passwordHash: eyePasswordHash,
    },
    update: {
      email: "eye@example.com",
      passwordHash: eyePasswordHash,
      displayName: "Sam (Eye)",
      rating: 4.8,
      totalRating: 48,
      jobsCompleted: 10,
      role: Role.EYE,
    },
  });

  const job = await prisma.job.create({
    data: {
      posterId: poster.userId,
      title: "Tour Liberty Market",
      address: "Liberty Market, Lahore",
      budget: 45,
      status: JobStatus.OPEN,
      latitude: 31.52,
      longitude: 74.35,
    },
  });

  await prisma.bid.create({
    data: {
      jobId: job.id,
      eyeUserId: eye.userId,
      amount: 40,
      note: "Testing the live flow",
    },
    include: { eye: true },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
