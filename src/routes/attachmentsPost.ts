import { Server } from "hyper-express";
import { tempFileMiddleware } from "../middlewares/tempFile.middleware";
import { validGroupIdCheckMiddleware } from "../middlewares/validGroupIdCheck.middleware";
import { addToWaitingList, VerificationType } from "../VerificationService";
import { Request, Response } from "hyper-express";
import { config } from "../config";
import { tempDirPath } from "../utils/Folders";
import { compressImageMiddleware } from "../middlewares/compressImage.middleware";

export function handleAttachmentsPostRoute(server: Server) {
  server.post(
    "/attachments/:groupId",
    validGroupIdCheckMiddleware,
    tempFileMiddleware(),
    compressImageMiddleware({
      size: [1920, 1080, "fit"],
    }),
    route,
    { max_body_length: config.attachmentMaxBodyLength }
  );
}

const route = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      error: "Missing file",
    });
    return;
  }

  const result = await addToWaitingList({
    type: VerificationType.ATTACHMENT,
    fileId: req.file.fileId,
    groupId: req.params.groupId as string,
    originalFilename: req.file.originalFilename,
    tempFilename: req.file.tempFilename,
    animated: req.file.animated,
    filesize: req.file.filesize,
    mimetype: req.file.mimetype,
  }).catch((err) => {
    console.error(err);
  });

  if (!result) {
    res.status(500).json({
      error: "Failed to add to waiting list",
    });
    return;
  }

  res.status(200).json({
    fileId: req.file.fileId,
  });
};
