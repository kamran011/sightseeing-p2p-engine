/*
  Warnings:

  - Added the required column `title` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled';
ALTER TABLE "Job" ALTER COLUMN "title" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agoraChannel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_jobId_key" ON "Session"("jobId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
