import sharp from "sharp";
sharp.cache(false);

export async function getMetadata(path: string | ArrayBuffer) {
  return await sharp(path).metadata().catch(() => undefined);
}