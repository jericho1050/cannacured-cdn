export const env = {
  port: parseInt(process.env.PORT!),
  origin: JSON.parse(process.env.ORIGIN!) as string[],
  attachmentMaxBodyLength:
    parseInt(process.env.ATTACHMENT_MAX_BODY_LENGTH!) * (1024 * 1024),
  imageMaxBodyLength:
    parseInt(process.env.IMAGE_MAX_BODY_LENGTH!) * (1024 * 1024),
  expireFileMS: 1000 * 60 * 60 * 24 * parseInt(process.env.EXPIRE_FILE_MS!),
  secret: process.env.SECRET!,
  devMode: process.env.DEV_MODE?.toLowerCase() === "true",
  databaseUrl: process.env.DATABASE_URL!,
  REDIS_HOST: process.env.REDIS_HOST as string,
  REDIS_PORT: parseInt(process.env.REDIS_PORT as string),
  REDIS_PASS: process.env.REDIS_PASS as string,
  REDIS_DB: parseInt(process.env.REDIS_DB as string),
};
