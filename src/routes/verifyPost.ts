import { Server } from "hyper-express";
import { isValidGroupId } from "../middlewares/validGroupIdCheck.middleware";
import {
  findAndDeleteWaitingVerification,
  VerificationType,
} from "../VerificationService";
import { Request, Response } from "hyper-express";
import path, { ParsedPath } from "path";
import {
  tempDirPath,
} from "../utils/Folders";
import { WaitingVerification } from "@prisma/client";
import fs from "fs";
import { typeToDir } from "../utils/uploadType";
import { config } from "../config";
import { addToExpireList } from "../ExpireFileService";
import { checkSecretMiddleware } from "../middlewares/checkSecret.middleware";

export function handleVerifyPostRoute(server: Server) {
  server.post("/verify/:groupId/:fileId", checkSecretMiddleware, route);
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
    fs.promises.unlink(tempPath).catch(() => { });
    fs.promises.unlink(fullPath).catch(() => { });

    res.status(500).json({
      error: "Internal server error.",
    });
  }

  let expireAt: number | undefined = undefined;

  if (!waitingVerification.compressed) {
    const expireFile = await addToExpireList({
      fileId: waitingVerification.fileId,
      groupId: waitingVerification.groupId,
    }).catch((err) => {
      console.error(err);
    });

    if (!expireFile) {
      res.status(500).json({
        error: "Failed to add to expire list",
      });
      fs.promises.unlink(tempPath).catch(() => { });
      fs.promises.unlink(fullPath).catch(() => { });
      return;
    };
    expireAt = expireFile.expireAt;
  }


  res.status(200).json({
    path: path.join(
      newPath.relativeDirPath,
      encodeURI(newPath.parsedFilePath.name) + newPath.parsedFilePath.ext
    ).replaceAll("\\", "/"),
    filesize: waitingVerification.filesize,
    animated: waitingVerification.animated,
    mimetype: waitingVerification.mimetype,
    compressed: waitingVerification.compressed,
    expireAt,
  });
};

function getFilePathFromVerificationType(
  waitingVerification: WaitingVerification
) {
  let dirPath = typeToDir(waitingVerification.type);

  if (!dirPath) {
    throw new Error(`Invalid type: ${waitingVerification.type}`);
  }

  let relativeDirPath: string;
  let parsedFilePath: ParsedPath;

  if (waitingVerification.type === VerificationType.ATTACHMENT) {
    relativeDirPath = path.join(
      waitingVerification.groupId,
      waitingVerification.fileId
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
