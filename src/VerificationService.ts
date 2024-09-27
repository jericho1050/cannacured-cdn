import path from "path";
import { prisma } from "./db"
import { tempDirPath } from "./Folders";

export enum VerificationType {
  ATTACHMENT = "ATTACHMENT",
  AVATAR = "AVATAR",
  BANNER = "BANNER"
}

interface Opts {
  fileId: string;
  groupId: string;

  tempFilename: string;
  originalFilename: string;
  userId?: string;
  type: VerificationType

}

export const addToWaitingList = async (opts: Opts) => {
  return prisma.waitingVerification.create({
    data: {
      id: opts.fileId,
      type: opts.type,
      originalFilename: opts.originalFilename,
      tempFilename: opts.tempFilename,
      groupId: opts.groupId,
    }
  })
}

export const removeExpiredVerifications = async () => {
  // 5 minutes
  const expired = new Date(Date.now() - 5 * 60 * 1000)

  const results = await prisma.waitingVerification.findMany({
    where: {
      createdAt: {
        lt: expired
      }
    }
  })
  const ids = results.map(r => r.id)

  await prisma.waitingVerification.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  })

  return results;
}

export const findAndDeleteWaitingVerification = async (fileId: string, groupId: string) => {
  return prisma.waitingVerification.delete({
    where: {
      id: fileId,
      groupId
    }
  }).catch(() => undefined)
}