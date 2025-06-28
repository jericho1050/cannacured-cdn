function parseOrigin(originEnv: string | undefined): string[] {
  if (!originEnv) {
    // Default to a safe value or handle as an error if required
    return ["https://nerimity.com"]; 
  }
  try {
    // Assumes the value is a JSON array string like '["http://a.com", "http://b.com"]'
    const parsed = JSON.parse(originEnv);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's some other valid JSON, return empty array
    return [];
  } catch (e) {
    // If parsing fails, assume it's a single URL string
    return [originEnv];
  }
}

export const env = {
  port: parseInt(process.env.PORT!),
  origin: parseOrigin(process.env.ORIGIN),
  attachmentMaxBodyLength:
    parseInt(process.env.ATTACHMENT_MAX_BODY_LENGTH!) * (1024 * 1024),
  imageMaxBodyLength:
    parseInt(process.env.IMAGE_MAX_BODY_LENGTH!) * (1024 * 1024),
  expireFileMS: 1000 * 60 * 60 * 24 * parseInt(process.env.EXPIRE_FILE_MS!),
  secret: process.env.SECRET!,
  devMode: process.env.DEV_MODE?.toLowerCase() === "true",
  databaseUrl: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL as string,
  EXTERNAL_EMBED_SECRET: process.env.EXTERNAL_EMBED_SECRET as string,
};
