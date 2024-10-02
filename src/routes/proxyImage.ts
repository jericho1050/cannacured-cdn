import { Server } from "hyper-express";
import { Request, Response } from "hyper-express";
import { fetchHeaders, getMimeByUrl, isImageMime, isUrl } from "../utils/utils";
import { miniConvert } from "../utils/imageMagick";
import http from 'http';
import https from 'https';

export function handleProxyImageRoute(server: Server) {
  server.get("/proxy/:imageUrl/:filename", route);
}

const route = async (req: Request, res: Response) => {
  res.header("Cache-Control", "public, max-age=1800");
  res.header("Access-Control-Allow-Origin", "https://nerimity.com");

  const unsafeImageUrl = decodeURIComponent(req.params.imageUrl as string);
  const type = req.query.type;

  if (!unsafeImageUrl || !isUrl(unsafeImageUrl)) {
    res.status(403).end();
    return;
  }

  const urlRes = await fetchHeaders(unsafeImageUrl);

  const mime = await getMimeByUrl(urlRes);

  if (!isImageMime(mime) || !urlRes) {
    res.status(403).end();
    return;
  }
  res.header("Content-Type", mime!);

  const protocol = urlRes.url.startsWith("https") ? https : http;

  protocol.get(urlRes.url, async (imageRes) => {
    if (type === "webp") {
      const [stream, error] = await miniConvert(imageRes, { static: true });

      if (error) {
        return res.status(403).end();
      }

      res.set("Cache-Control", "public, max-age=1800");
      res.set("Accept-Ranges", "bytes");
      res.header("Content-Type", "image/webp");

      stream!.pipe(res);
      return;
    }
    imageRes.pipe(res);
  });
}

