-- CreateTable
CREATE TABLE "WaitingVerification" (
    "fileId" TEXT NOT NULL,
    "groupId" TEXT,
    "tempFilename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "animated" BOOLEAN NOT NULL,
    "compressed" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitingVerification_pkey" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "ExpireFile" (
    "fileId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpireFile_pkey" PRIMARY KEY ("fileId")
);
