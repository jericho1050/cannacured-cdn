import { Server } from 'hyper-express';
import { tempFileMiddleware } from './tempFile.middleware';
import { isValidGroupId, validGroupIdCheckMiddleware } from './validGroupIdCheck.middleware';
import { addToWaitingList, findAndDeleteWaitingVerification, VerificationType } from './VerificationService';
import { attachmentsDirPath, avatarsDirPath, bannersDirPath, tempDirPath } from './Folders';
import path, { ParsedPath } from 'path';
import { WaitingVerification } from '@prisma/client';
import fs from 'fs';


// max_body_length [Number]: Maximum number of bytes allowed for incoming request body size. For reference, 1kb = 1024 Bytes and 1mb = 1024kb.
const maxBodyLength = 50 * 1024 * 1024
const server = new Server();

server.set_error_handler((err, req, res) => {
  console.error(err)
})



// groupId can:
// - be a userId for posts
// - channelId for messages
server.post("/attachments/:groupId", validGroupIdCheckMiddleware, tempFileMiddleware, async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      error: "Missing file"
    })
    return;
  }

  const result = await addToWaitingList({
    fileId: req.file.fileId,
    groupId: req.params.groupId as string,
    originalFilename: req.file.originalFilename,
    tempFilename: req.file.tempFilename,
    type: VerificationType.ATTACHMENT
  }).catch(err => {
    console.error(err)
  })

  if (!result) {
    res.status(500).json({
      error: "Failed to add to waiting list"
    })
    return;
  }

  res.status(200).json({
    fileId: req.file.fileId
  })
}, { max_body_length: maxBodyLength })


server.post("/verify/:groupId/:fileId", async (req, res) => {
  const groupId = req.params.groupId as string;
  const fileId = req.params.fileId as string;
  const type = req.query.type as VerificationType;
  if (!type) {
    res.status(400).json({
      error: "Missing type query parameter"
    })
    return;
  }

  if (!isValidGroupId(groupId) || !isValidGroupId(fileId)) {
    res.status(400).json({
      error: "Invalid groupId or fileId"
    })
    return;
  }

  const waitingVerification = await findAndDeleteWaitingVerification(fileId, groupId, type);
  if (!waitingVerification) {
    res.status(404).json({
      error: "Not found"
    })
    return;
  }
  const tempPath = path.join(tempDirPath, waitingVerification.tempFilename);
  const newPath = getFilePathFromVerificationType(waitingVerification);


  const fullPath = path.join(newPath.dirPath, newPath.parsedFilePath.name + newPath.parsedFilePath.ext);

  try {
    await fs.promises.mkdir(newPath.dirPath, { recursive: true });
    await fs.promises.rename(tempPath, fullPath);
  } catch {
    fs.promises.unlink(tempPath).catch(() => { });
    fs.promises.unlink(fullPath).catch(() => { });

    res.status(500).json({
      error: "Internal server error."
    })
  }


  res.status(200).json({
    success: true,
    path: path.join(newPath.relativeDirPath, encodeURI(newPath.parsedFilePath.name) + newPath.parsedFilePath.ext)
  })
})

function getFilePathFromVerificationType(waitingVerification: WaitingVerification) {
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
  }

  let relativeDirPath: string;
  let parsedFilePath: ParsedPath;

  if (waitingVerification.type === VerificationType.ATTACHMENT) {
    relativeDirPath = path.join(waitingVerification.groupId, waitingVerification.id)
    parsedFilePath = path.parse(waitingVerification.originalFilename);
  } else {
    relativeDirPath = path.join(waitingVerification.groupId)
    parsedFilePath = path.parse(waitingVerification.tempFilename);
  }

  let fullDirPath = path.join(dirPath, relativeDirPath);

  return {
    dirPath: fullDirPath,
    relativeDirPath,
    parsedFilePath,
  };

}




server.listen(3000, () => {
  console.log('Server started on port 3000');
})




