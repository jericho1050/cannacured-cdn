import path from "path";
import { config } from "./config";
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
  const expireAt = data.createdAt.getTime() + config.expireFileMS;
  return { expireAt };
}


export const removeExpiredFiles = async () => {
  // 5 minutes
  const expired = new Date(Date.now() - config.expireFileMS);

  const results = await prisma.expireFile.findMany({
    take: 1000,
    where: {
      createdAt: {
        lt: expired,
      },
    },
  });

  const deletedResults = await Promise.all(results.map(async (item) => {
    const filePath = path.join(attachmentsDirPath, item.groupId, item.fileId);
    const res = await fs.promises.rm(filePath, { recursive: true }).then(() => true).catch(err => {
      if (err.code === "ENOENT") {
        return true;
      }
      console.error(err);
      return false;
    })
    if (res) {
      return item;
    }
  }));

  const fileIds = deletedResults.filter((item) => item).map((item) => item!.fileId);


  await prisma.expireFile.deleteMany({
    where: {
      fileId: {
        in: fileIds,
      },
    },
  });

  return fileIds;
};