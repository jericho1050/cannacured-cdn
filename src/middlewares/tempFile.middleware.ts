import { Request, Response, MiddlewareNext, Server } from 'hyper-express';
import fs from 'fs';
import { generateId } from '../utils/flake';
import path from 'path';
import { tempDirPath } from '../utils/Folders';
import { pipeline } from 'stream/promises';

export const tempFileMiddleware = async (req: Request, res: Response) => {
  let writeStream: fs.WriteStream;
  res.on("close", () => {
    if (res.statusCode && res.statusCode < 400) return;

    if (writeStream) {
      fs.promises.unlink(writeStream.path);
    }
  });

  await req.multipart({ limits: { files: 1, fields: 0 } }, async (field) => {
    if (!field.file) return;
    if (!field.file.name) return;
    const fileId = generateId();
    const tempFilename = fileId + path.extname(field.file.name);
    const tempPath = path.join(tempDirPath, tempFilename);


    writeStream = fs.createWriteStream(tempPath);
    const status = await pipeline(field.file.stream, writeStream).catch(() => null);

    if (status === null) {
      res.status(500).json({
        error: "Failed to upload file"
      })
      return
    }
    req.file = {
      tempFilename,
      fileId,
      originalFilename: field.file.name.replaceAll("/", "_").replaceAll("\\", "_"),
      mimetype: field.mime_type
    }
  }).catch(error => {
    if (error === 'FILES_LIMIT_REACHED') {
      return res.status(403).send('Only one file can be uploaded at a time');
    } else if (error === "FIELDS_LIMIT_REACHED") {
      return res.status(403).send('There should be no fields in the request.');
    } else {
      const text = typeof error === "string" ? error : "";
      return res.status(500).send('Oops! An uncaught error occurred on our end. ' + text);
    }
  })

}