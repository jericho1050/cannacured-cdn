import {Request, Response, MiddlewareNext, Server} from 'hyper-express';
import fs from 'fs';
import { generateId } from './flake';
import path from 'path';
import { tempDirPath } from './Folders';
import { pipeline } from 'stream/promises';

export const tempFileMiddleware = async (req: Request, res: Response) => {
  let writeStream: fs.WriteStream;
  res.on("close", () => {
    if (writeStream) {
      fs.promises.unlink(writeStream.path);
    }
  });

  await req.multipart(async (field) => {
    if (!field.file) return;
    if (!field.file.name) return;
    const tempFilename = generateId() + path.extname(field.file.name);
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
      name: field.file.name,
      mimetype: field.mime_type
    }
  })
  
}