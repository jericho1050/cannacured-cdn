import { config } from "./config";
import { prisma } from "./db";

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