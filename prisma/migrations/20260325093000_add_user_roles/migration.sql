-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('POSTER', 'EYE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

