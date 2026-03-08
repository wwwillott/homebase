-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT', 'READING', 'DISCUSSION', 'OTHER');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assignmentType" "AssignmentType" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Assignment_userId_assignmentType_idx" ON "Assignment"("userId", "assignmentType");
