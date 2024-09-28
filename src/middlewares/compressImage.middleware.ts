import { Request, Response } from "hyper-express";
import { compressImage, CompressImageOptions, removeFile } from "../utils/imageMagick";
import path from "path";
import { tempDirPath } from "../utils/Folders";

type Opts = Omit<Omit<CompressImageOptions, "tempPath">, "filename">
export const compressImageMiddleware = (opts: Opts) => {
  return async (req: Request, res: Response) => {
    if (req?.file?.shouldCompress) {
      let closed = false
      res.on("close", () => {
        closed = true;
      })
      const tempFilePath = path.join(tempDirPath, req.file.tempFilename);

      console.log("compressing")

      const [result, err] = await compressImage({
        ...opts,
        tempPath: tempFilePath,
        filename: req.file.tempFilename,
      });

      if (err) {
        res.status(500).json({
          error: err
        })
        return;
      }
      if (closed) {
        removeFile(result.path)
        removeFile(tempFilePath)
      }
      req.file.fileSize = result.fileSize
      req.file.compressedFilename = result.newFilename
      req.file.originalFilename = path.parse(req.file.originalFilename).name + path.parse(result.newFilename).ext
      req.file.tempFilename = path.parse(req.file.tempFilename).name + path.parse(result.newFilename).ext
      if (result.gif) {
        req.file.mimetype = "image/gif"
      } else {
        req.file.mimetype = "image/webp"
      }
      if (req.file.tempFilename !== req.file.compressedFilename) {
        removeFile(tempFilePath);
      }
      console.log("done")
    }
  };
};
