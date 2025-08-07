import path from "path";
import { env } from "./env";
import { prisma } from "./db";
import fs from 'fs';
import { attachmentsDirPath } from "./utils/Folders";

interface AddToExpireListOpts {
  fileId: string;
  groupId: string;
}
export const addToExpireList = async (opts: AddToExpireListOpts) => {
  const data = await prisma.expireFile.create({
    data: {
      fileId: opts.fileId,
      groupId: opts.groupId,
    }
  })
  const expireAt = data.createdAt.getTime() + env.expireFileMS;
  return { expireAt };
}


export const removeExpiredFiles = async () => {
  // 5 minutes
  const expired = new Date(Date.now() - env.expireFileMS);

  const results = await prisma.expireFile.findMany({
    take: 1000,
    where: {
      createdAt: {
        lt: expired,
      },
    },
  });

  if (results.length) {
    console.log('[EXPIRE] about to delete', {
      count: results.length,
      fileIds: results.map(r => r.fileId)
    });
  }

  const deletedResults = await Promise.all(results.map(async (item) => {
    const filePath = path.join(attachmentsDirPath, item.groupId, item.fileId);
    const res = await fs.promises.rm(filePath, { recursive: true }).then(() => {
      console.log('[EXPIRE] deleted directory', { filePath });
      return true;
    }).catch(err => {
      if (err.code === "ENOENT") {
        console.log('[EXPIRE] directory not found (already deleted)', { filePath });
        return true;
      }
      console.error('[EXPIRE] failed to delete', { filePath, error: err });
      return false;
    });
    if (res) return item;
  }));

  const fileIds = deletedResults.filter(Boolean).map((item) => item!.fileId);

  await prisma.expireFile.deleteMany({
    where: {
      fileId: {
        in: fileIds,
      },
    },
  });

  return fileIds;
};


export const deleteExpiringFiles = async (fileIds: string[]) => {
  return await prisma.expireFile.deleteMany({
    where: {
      fileId: {
        in: fileIds,
      }
    }
  })
}

export const deleteExpiringFilesByGroupId = async (groupId: string) => {
  return await prisma.expireFile.deleteMany({
    where: {
      groupId
    }
  })
}