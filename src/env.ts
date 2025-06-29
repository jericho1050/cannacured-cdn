const origin = (): string | string[] => {
  if (!process.env.ORIGIN) {
    
    return '*';
  }
  if (process.env.ORIGIN.startsWith('[')) {
    return JSON.parse(process.env.ORIGIN);
  }
  return process.env.ORIGIN;
};

function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASS ? `:${process.env.REDIS_PASS}@` : '';
  const db = process.env.REDIS_DB || '0';

  return `redis://${password}${host}:${port}/${db}`;
}

export const env = {
  port: parseInt(process.env.PORT || '8003', 10),
  origin: origin(),
  attachmentMaxBodyLength:
    (parseInt(process.env.ATTACHMENT_MAX_BODY_LENGTH || '50', 10)) * (1024 * 1024),
  imageMaxBodyLength:
    (parseInt(process.env.IMAGE_MAX_BODY_LENGTH || '12', 10)) * (1024 * 1024),
  expireFileMS: parseInt(process.env.EXPIRE_FILE_MS || '86400000', 10),
  secret: process.env.SECRET!,
  devMode: process.env.DEV_MODE?.toLowerCase() === "true",
  databaseUrl: process.env.DATABASE_URL!,
  REDIS_URL: getRedisUrl(),
  EXTERNAL_EMBED_SECRET: process.env.EXTERNAL_EMBED_SECRET as string,
};
