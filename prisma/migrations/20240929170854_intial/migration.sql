-- CreateTable
CREATE TABLE "WaitingVerification" (
    "fileId" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "tempFilename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "animated" BOOLEAN NOT NULL,
    "compressed" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExpireFile" (
    "fileId" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
