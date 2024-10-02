import { Server } from "hyper-express";
import { Request, Response } from "hyper-express";
import { checkSecretMiddleware } from "../middlewares/checkSecret.middleware";
import { attachmentsDirPath } from "../utils/Folders";
import path from "path";
import fs from 'fs';
import { deleteExpiringFilesByGroupId } from "../ExpireFileService";


export function handleDeleteAttachmentByGroupIdRoute(server: Server) {
  server.delete("/attachments/:groupId/batch", checkSecretMiddleware, route);
}

// This runs in a interval in nerimity-server when a server channel is deleted.
const route = async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const DELETE_BATCH = 1000;
  const groupPath = path.join(attachmentsDirPath, groupId);

  if (!fs.existsSync(groupPath)) {
    return res.status(404).json({ error: "Invalid Path" });
  }

  const dir = await fs.promises.opendir(groupPath);

  const filesToDelete = [];

  let i = 0;
  for await (const dirent of dir) {
    if (i === DELETE_BATCH) break;
    const filePath = path.join(groupPath, dirent.name);
    filesToDelete.push(filePath);
    i++;
  }


  if (groupId) {
    await deleteExpiringFilesByGroupId(groupId).catch((err) => {
      console.error(err)
    })
  }

  const promises = filesToDelete.map((filePath) =>
    fs.promises.rm(filePath, { recursive: true, force: true }).catch(() => { })
  );

  await Promise.all(promises);

  if (filesToDelete.length < DELETE_BATCH) {
    await fs.promises.rm(groupPath, { recursive: true, force: true });
  }

  console.log("Deleted", filesToDelete.length, "image(s).");
  return res
    .status(200)
    .json({ status: "deleted", count: filesToDelete.length });
}

