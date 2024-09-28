import sharp from "sharp";
sharp.cache(false);

export async function getMetadata(path: string) {
  return await sharp(path).metadata().catch(() => undefined);
}