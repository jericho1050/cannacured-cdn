import { Server } from "hyper-express";

import { Request, Response } from "hyper-express";
import path from "path";
import { isDirectory, publicDirPath } from "../utils/Folders";

import fs from "fs";
import { miniConvert } from "../utils/imageMagick";
import { getMimeType } from "stream-mime-type";
import { Readable } from "stream";
import { env } from "../env";

export function handleGetFileRoute(server: Server) {
  server.get("/*", (req, res) => {
    route(req, res).catch((err) => {
      res.status(500).json({ error: "Internal server error" });
      console.error(err);
    });
  });
}

const route = async (req: Request, res: Response) => {
  const decodedPath = path.join(
    path.dirname(req.path),
    decodeURI(path.basename(req.path))
  );

  if (decodedPath.includes("../"))
    return res.status(404).json({ error: "Not found" });
  const fullPath = path.join(publicDirPath, decodedPath);

  const isDir = await isDirectory(fullPath);
  if (isDir) {
    res.status(404).send("Not found");

    return;
  }

  const filesize = await fs.promises
    .stat(fullPath)
    .then((stats) => stats.size)
    .catch(() => null);

  if (filesize === null) {
    res.status(404).send("Not found");
    return;
  }

  const rawStream = fs.createReadStream(fullPath);
  const rawMime = await getMimeType(rawStream as Readable);
  const isRawImage = rawMime.mime?.startsWith("image/");
  const isImageFilesize = filesize <= env.imageMaxBodyLength;

  if (isImageFilesize && isRawImage) {
    const type = req.query.type as string;
    let size = parseInt(req.query.size as string | "0");

    if (size >= 1920) {
      size = 1920;
    }
    if (!size) {
      size = 0;
    }

    if (type || size) {
      const [inStream, err] = await miniConvert(rawMime.stream as Readable, {
        size: size,
        static: type === "webp",
      });
      if (err) {
        console.error(err);
        res.status(500).end();
        return;
      }

      const { stream, mime } = await getMimeType(inStream as Readable);

      res.set("Cache-Control", "public, max-age=1800");
      res.set("Accept-Ranges", "bytes");
      res.set("Content-Type", mime || "image/webp");

      stream.pipe(res);
      return;
    }
  }

  res.set("Cache-Control", "public, max-age=300");
  if (
    rawMime.mime.startsWith("image/") ||
    rawMime.mime.startsWith("video/mp4") ||
    rawMime.mime.startsWith("audio/mp3") ||
    rawMime.mime.startsWith("audio/ogg")
  ) {
    res.set("Content-Type", rawMime.mime);

    res.sendFile(fullPath);
    return;
  }

  res.download(fullPath, path.basename(fullPath));
};
