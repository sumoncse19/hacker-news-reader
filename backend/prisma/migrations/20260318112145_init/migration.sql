-- CreateTable
CREATE TABLE "Bookmark" (
    "id" SERIAL NOT NULL,
    "hnStoryId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "author" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "hnCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSummary" (
    "id" SERIAL NOT NULL,
    "hnStoryId" INTEGER NOT NULL,
    "keyPoints" TEXT[],
    "sentiment" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_hnStoryId_key" ON "Bookmark"("hnStoryId");

-- CreateIndex
CREATE INDEX "Bookmark_title_idx" ON "Bookmark"("title");

-- CreateIndex
CREATE UNIQUE INDEX "AiSummary_hnStoryId_key" ON "AiSummary"("hnStoryId");

-- CreateIndex
CREATE INDEX "AiSummary_hnStoryId_idx" ON "AiSummary"("hnStoryId");
