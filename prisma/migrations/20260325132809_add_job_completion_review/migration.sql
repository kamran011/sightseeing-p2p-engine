-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'FLAGGED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "review" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRating" INTEGER NOT NULL DEFAULT 0;
