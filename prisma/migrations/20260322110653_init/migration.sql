-- CreateEnum
CREATE TYPE "Role" AS ENUM ('POSTER', 'EYE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'MATCHED', 'LIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "displayName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "acceptedBidId" TEXT,
    "channelName" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eyeUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_acceptedBidId_key" ON "Job"("acceptedBidId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_jobId_eyeUserId_key" ON "Bid"("jobId", "eyeUserId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_acceptedBidId_fkey" FOREIGN KEY ("acceptedBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_eyeUserId_fkey" FOREIGN KEY ("eyeUserId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
