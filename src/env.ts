function parseOrigin(originEnv: string | undefined): string[] {
  if (!originEnv) {
    // Default to a safe value if the variable is not set
    return ["https://nerimity.com"];
  }

  // Handle comma-separated origins. This is easier to manage in Render env vars
  // and avoids JSON parsing errors.
  // Example: "https://a.com, https://b.com"
  // We also convert to lower case to ensure case-insensitive matching.
  return originEnv.split(',').map(url => url.trim().toLowerCase());
}

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
  origin: parseOrigin(process.env.ORIGIN),
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
