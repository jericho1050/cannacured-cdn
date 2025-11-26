import { Server } from "hyper-express";
import { isValidGroupId } from "../middlewares/validGroupIdCheck.middleware";
import {
  findAndDeleteWaitingVerification,
  VerificationType,
} from "../VerificationService";
import { Request, Response } from "hyper-express";
import path, { ParsedPath } from "path";
import { publicDirPath, tempDirPath } from "../utils/Folders";
import { WaitingVerification } from "@prisma/client";
import fs from "fs";
import { typeToDir, typeToRelativeDir } from "../utils/uploadType";
import { env } from "../env";
import { addToExpireList } from "../ExpireFileService";
import { checkSecretMiddleware } from "../middlewares/checkSecret.middleware";
import { deleteDirWithFileExclusion } from "../utils/utils";
import { processVideo } from "../utils/videoProcessing";

export function handleVerifyPostRoute(server: Server) {
  server.post("/verify/:groupId/:fileId", checkSecretMiddleware, route);
  server.post("/verify/:fileId", checkSecretMiddleware, route);
}

const route = async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const fileId = req.params.fileId as string;
  const type = req.query.type as VerificationType;
  const imageOnly = (req.query.imageOnly as string | undefined) === "true"; // optional true or false
  if (!type) {
    res.status(400).json({
      error: "Missing type query parameter",
    });
    return;
  }
  if (groupId && !isValidGroupId(groupId)) {
    res.status(400).json({
      error: "Invalid groupId or fileId",
    });
    return;
  }

  if (type !== "EMOJI" && !groupId) {
    res.status(400).json({
      error: "Missing groupId",
    });
    return;
  }

  if (!isValidGroupId(fileId)) {
    res.status(400).json({
      error: "Invalid groupId or fileId",
    });
    return;
  }

  const waitingVerification = await findAndDeleteWaitingVerification(
    fileId,
    groupId,
    type,
    imageOnly ? true : undefined
  );
  if (!waitingVerification) {
    console.log(`[VERIFY-FAIL] waitingVerification not found for fileId: ${fileId}, groupId: ${groupId}, type: ${type}`);
    res.status(404).json({
      error: "Not found",
    });
    return;
  }

  console.log('[VERIFY-DEBUG] Received verification request with data:', waitingVerification);

  const tempPath = path.join(tempDirPath, waitingVerification.tempFilename);
  const newPath = getFilePathFromVerificationType(waitingVerification);

  const fullPath = path.join(
    newPath.dirPath,
    newPath.parsedFilePath.name + newPath.parsedFilePath.ext
  );

  console.log('[VERIFY-INFO] Preparing to move file.', {
    fileId: waitingVerification.fileId,
    tempPath: tempPath,
    destinationPath: fullPath,
  });

  try {
    await fs.promises.mkdir(newPath.dirPath, { recursive: true });
    await fs.promises.rename(tempPath, fullPath);
    console.log(`[VERIFY-SUCCESS] Successfully moved file: ${fullPath}`);
  } catch (err) {
    console.error('[VERIFY-CRITICAL] Failed to move file.', {
      error: err,
      tempPath: tempPath,
      destinationPath: fullPath,
    });
    fs.promises.unlink(tempPath).catch(() => {});
    fs.promises.unlink(fullPath).catch(() => {});

    res.status(500).json({
      error: "Internal server error.",
    });
    return;
  }

  const isVideo = waitingVerification.mimetype.startsWith("video/");
  const shouldExpire = !waitingVerification.compressed && !isVideo;

  let expireAt: number | undefined = undefined;

  console.log('[VERIFY-EXPIRE] decision', {
    fileId: waitingVerification.fileId,
    mimetype: waitingVerification.mimetype,
    compressed: !!waitingVerification.compressed,
    isVideo,
    shouldExpire
  });

  if (shouldExpire) {
    const expireFile = await addToExpireList({
      fileId: waitingVerification.fileId,
      groupId: waitingVerification.groupId!,
    }).catch((err) => {
      console.error(err);
    });

    if (!expireFile) {
      res.status(500).json({ error: "Failed to add to expire list" });
      fs.promises.unlink(tempPath).catch(() => {});
      fs.promises.unlink(fullPath).catch(() => {});
      return;
    }
    expireAt = expireFile.expireAt;
    console.log('[VERIFY-EXPIRE] added to expire list', {
      fileId: waitingVerification.fileId,
      expireAt
    });
  }

  let thumbnailPath: string | undefined = undefined;
  
  if (isVideo) {
    console.log('[VERIFY-DEBUG] Video file moved. Starting video processing...');
    
    // Process the video: extract metadata and generate thumbnail
    const videoMetadata = await processVideo({
      inputPath: fullPath,
      outputDir: newPath.dirPath,
      fileId: waitingVerification.fileId,
    });

    if (videoMetadata) {
      // Update waitingVerification object with video metadata
      waitingVerification.width = videoMetadata.width;
      waitingVerification.height = videoMetadata.height;
      // Duration should already be set from the upload stage, but update if needed
      if (!waitingVerification.duration && videoMetadata.duration) {
        waitingVerification.duration = videoMetadata.duration;
      }
      
      // Set thumbnail path for client
      if (videoMetadata.thumbnailPath) {
        const thumbnailFilename = `${waitingVerification.fileId}_thumbnail.jpg`;
        thumbnailPath = path
          .join(newPath.relativeDirPath, thumbnailFilename)
          .replaceAll("\\", "/");
      }
      
      console.log('[VERIFY-DEBUG] Video processing completed successfully.');
    } else {
      console.log('[VERIFY-DEBUG] Video processing failed, continuing without metadata.');
    }
  }

  if (
    waitingVerification.type === VerificationType.AVATAR ||
    waitingVerification.type === VerificationType.BANNER
  ) {
    deleteDirWithFileExclusion(
      newPath.dirPath,
      newPath.parsedFilePath.name + newPath.parsedFilePath.ext
    ).catch((e) => {
      console.log(e);
    });
  }

  res.status(200).json({
    fileId: waitingVerification.fileId,
    path: path
      .join(
        newPath.relativeDirPath,
        encodeURIComponent(newPath.parsedFilePath.name) +
          newPath.parsedFilePath.ext
      )
      .replaceAll("\\", "/"),
    filesize: waitingVerification.filesize,
    animated: waitingVerification.animated,
    ...(waitingVerification.duration !== undefined
      ? { duration: waitingVerification.duration }
      : {}),
    mimetype: waitingVerification.mimetype,
    compressed: waitingVerification.compressed,
    width: waitingVerification.width,
    height: waitingVerification.height,
    expireAt,
    ...(thumbnailPath ? { thumbnailPath } : {}),
  });
};

function getFilePathFromVerificationType(
  waitingVerification: WaitingVerification
) {
  if (!waitingVerification.type) {
    throw new Error(`No type provided.`);
  }
  const dirPath = typeToDir(waitingVerification.type);
  const relDirPath = typeToRelativeDir(waitingVerification.type);

  if (!dirPath) {
    throw new Error(`Invalid type: ${waitingVerification.type}`);
  }
  if (!relDirPath) {
    throw new Error(`Invalid type: ${waitingVerification.type}`);
  }

  let relativeDirPath: string;
  let parsedFilePath: ParsedPath;

  if (waitingVerification.type === VerificationType.ATTACHMENT) {
    if (!waitingVerification.groupId) {
      throw new Error("Missing groupId");
    }
    relativeDirPath = path.join(
      relDirPath,
      waitingVerification.groupId,
      waitingVerification.fileId
    );
    parsedFilePath = path.parse(waitingVerification.originalFilename);
  } else if (waitingVerification.type === VerificationType.EMOJI) {
    relativeDirPath = path.join(relDirPath);
    parsedFilePath = path.parse(waitingVerification.tempFilename);
  } else {
    if (!waitingVerification.groupId) {
      throw new Error("Missing groupId");
    }
    relativeDirPath = path.join(relDirPath, waitingVerification.groupId);
    parsedFilePath = path.parse(waitingVerification.tempFilename);
  }

  let fullDirPath = path.join(publicDirPath, relativeDirPath);

  return {
    dirPath: fullDirPath,
    relativeDirPath,
    parsedFilePath,
  };
}
