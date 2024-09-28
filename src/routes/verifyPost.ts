import { Server } from "hyper-express";
import { isValidGroupId } from "../middlewares/validGroupIdCheck.middleware";
import {
  findAndDeleteWaitingVerification,
  VerificationType,
} from "../VerificationService";
import { Request, Response } from "hyper-express";
import path, { ParsedPath } from "path";
import {
  attachmentsDirPath,
  avatarsDirPath,
  bannersDirPath,
  emojisDirPath,
  tempDirPath,
} from "../utils/Folders";
import { WaitingVerification } from "@prisma/client";
import fs from "fs";

export function handleVerifyPostRoute(server: Server) {
  server.post("/verify/:groupId/:fileId", route);
}

const route = async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const fileId = req.params.fileId as string;
  const type = req.query.type as VerificationType;
  if (!type) {
    res.status(400).json({
      error: "Missing type query parameter",
    });
    return;
  }

  if (!isValidGroupId(groupId) || !isValidGroupId(fileId)) {
    res.status(400).json({
      error: "Invalid groupId or fileId",
    });
    return;
  }

  const waitingVerification = await findAndDeleteWaitingVerification(
    fileId,
    groupId,
    type
  );
  if (!waitingVerification) {
    res.status(404).json({
      error: "Not found",
    });
    return;
  }
  const tempPath = path.join(tempDirPath, waitingVerification.tempFilename);
  const newPath = getFilePathFromVerificationType(waitingVerification);

  const fullPath = path.join(
    newPath.dirPath,
    newPath.parsedFilePath.name + newPath.parsedFilePath.ext
  );

  try {
    await fs.promises.mkdir(newPath.dirPath, { recursive: true });
    await fs.promises.rename(tempPath, fullPath);
  } catch {
    fs.promises.unlink(tempPath).catch(() => {});
    fs.promises.unlink(fullPath).catch(() => {});

    res.status(500).json({
      error: "Internal server error.",
    });
  }

  res.status(200).json({
    success: true,
    path: path.join(
      newPath.relativeDirPath,
      encodeURI(newPath.parsedFilePath.name) + newPath.parsedFilePath.ext
    ),
    filesize: waitingVerification.filesize,
    animated: waitingVerification.animated,
    mimetype: waitingVerification.mimetype,
  });
};

function getFilePathFromVerificationType(
  waitingVerification: WaitingVerification
) {
  let dirPath: string | undefined;
  switch (waitingVerification.type as VerificationType) {
    case VerificationType.ATTACHMENT:
      dirPath = attachmentsDirPath;
      break;
    case VerificationType.AVATAR:
      dirPath = avatarsDirPath;
      break;
    case VerificationType.BANNER:
      dirPath = bannersDirPath;
      break;
    case VerificationType.EMOJI:
      dirPath = emojisDirPath;
      break;
  }

  let relativeDirPath: string;
  let parsedFilePath: ParsedPath;

  if (waitingVerification.type === VerificationType.ATTACHMENT) {
    relativeDirPath = path.join(
      waitingVerification.groupId,
      waitingVerification.id
    );
    parsedFilePath = path.parse(waitingVerification.originalFilename);
  } else {
    relativeDirPath = path.join(waitingVerification.groupId);
    parsedFilePath = path.parse(waitingVerification.tempFilename);
  }

  let fullDirPath = path.join(dirPath, relativeDirPath);

  return {
    dirPath: fullDirPath,
    relativeDirPath,
    parsedFilePath,
  };
}
