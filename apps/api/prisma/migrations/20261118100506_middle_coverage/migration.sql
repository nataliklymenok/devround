-- CreateEnum
CREATE TYPE "TaskMode" AS ENUM ('tests', 'self_check');

-- CreateEnum
CREATE TYPE "TaskDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('solved_own', 'solved_with_hints', 'revisit');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "references" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "reviewedAt" DATE,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Technology" ADD COLUMN     "recommends" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CodingTask" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "levels" TEXT[],
    "difficulty" "TaskDifficulty" NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "mode" "TaskMode" NOT NULL,
    "statement" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL,
    "entry" TEXT,
    "tests" JSONB,
    "acceptanceCriteria" JSONB,
    "hints" JSONB NOT NULL,
    "solution" TEXT NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "references" JSONB NOT NULL DEFAULT '[]',
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" DATE,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignExercise" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "levels" TEXT[],
    "timeboxMinutes" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "checklist" JSONB NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "references" JSONB NOT NULL DEFAULT '[]',
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" DATE,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanTask" (
    "planId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("planId","taskId")
);

-- CreateTable
CREATE TABLE "PlanExercise" (
    "planId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PlanExercise_pkey" PRIMARY KEY ("planId","exerciseId")
);

-- CreateTable
CREATE TABLE "TaskProgress" (
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "TaskStatus",
    "hintsRevealed" INTEGER NOT NULL DEFAULT 0,
    "solutionRevealed" BOOLEAN NOT NULL DEFAULT false,
    "draftCode" TEXT,
    "draftContentHash" TEXT,
    "lastCheckPassed" INTEGER,
    "lastCheckTotal" INTEGER,
    "attemptStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskProgress_pkey" PRIMARY KEY ("userId","taskId")
);

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sectionsRevealed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestScore" INTEGER,
    "lastCovered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("userId","exerciseId")
);

-- CreateIndex
CREATE INDEX "CodingTask_technologyId_order_idx" ON "CodingTask"("technologyId", "order");

-- CreateIndex
CREATE INDEX "DesignExercise_trackId_order_idx" ON "DesignExercise"("trackId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTask_planId_order_key" ON "PlanTask"("planId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PlanExercise_planId_order_key" ON "PlanExercise"("planId", "order");

-- AddForeignKey
ALTER TABLE "CodingTask" ADD CONSTRAINT "CodingTask_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignExercise" ADD CONSTRAINT "DesignExercise_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CodingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "DesignExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CodingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "DesignExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
