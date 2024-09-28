import { Request, Response, MiddlewareNext, Server } from "hyper-express";
import fs, { WriteStream } from "fs";
import { generateId } from "../utils/flake";
import path from "path";
import { tempDirPath } from "../utils/Folders";
import { pipeline } from "stream/promises";






export const tempFileMiddleware = (opts?: { image?: boolean }) => {
  return async (req: Request, res: Response) => {
    let writeStream: fs.WriteStream;
    res.on("close", () => {
      if (res.statusCode && res.statusCode < 400) return;

      if (writeStream) {
        fs.promises.unlink(writeStream.path).catch(() => { });
      }
    });

    await req
      .multipart({ limits: { files: 1, fields: 0 } }, async (field) => {
        if (!field.file) return;
        const fileId = generateId();
        const tempFilename = fileId + path.extname(field.file.name || "");
        const tempPath = path.join(tempDirPath, tempFilename);
        const isImage = isImageMime(field.mime_type);

        if (opts?.image && !isImage) {
          field.file.stream.on("readable", () => {
            res.status(400).json({
              error: "Invalid image mime type",
            });
          })
          return;
        }

        // Use this to rate limit.
        // limit_rate_after 500k;
        // or limit_rate 20k;
        // https://www.tecmint.com/nginx-bandwidth-limit/#:~:text=a%20location%20block%E2%80%9D.-,limit_rate_after%20500k%3B,-Here%20is%20an
        writeStream = fs.createWriteStream(tempPath);
        const status = await pipeline(field.file.stream, writeStream).catch(
          () => null
        );
        if (status === null) {
          res.status(500).json({
            error: "Failed to upload file",
          });
          return;
        }
        req.file = {
          tempFilename,
          fileId,
          originalFilename: safeFilename(field.file.name),
          mimetype: field.mime_type,
        };
      })
      .catch((error) => {
        if (error === "FILES_LIMIT_REACHED") {
          return res
            .status(403)
            .send("Only one file can be uploaded at a time");
        } else if (error === "FIELDS_LIMIT_REACHED") {
          return res
            .status(403)
            .send("There should be no fields in the request.");
        } else {
          const text = typeof error === "string" ? error : "";
          console.log(error)
          return res
            .status(500)
            .send("Oops! An uncaught error occurred on our end. " + text);
        }
      });
  };
};

const SupportedImages = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
function isImageMime(mime: string) {
  if (SupportedImages.includes(mime)) {
    return true;
  }
}

export function safeFilename(filename?: string) {
  let str = filename?.replaceAll("/", "_").replaceAll("\\", "_");

  if (!str) return "unnamed";
  return str;
}
