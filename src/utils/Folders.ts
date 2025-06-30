import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export const DirNames = {
  ProfileAvatar: "avatars",
  ProfileBanner: "profile_banners",
  Attachments: "attachments",
  Emojis: "emojis",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use an absolute path to the mounted disk for persistent storage.
// The '/usr/src/app/storage' path is where our Render Disk is mounted.
export let publicDirPath = path.resolve("/usr/src/app/storage");

if (process.env.DEV_MODE) {
  publicDirPath = path.join(__dirname, "../", "public");
}

export const tempDirPath = path.join(publicDirPath, "temp");
export const avatarsDirPath = path.join(publicDirPath, DirNames.ProfileAvatar);
export const bannersDirPath = path.join(publicDirPath, DirNames.ProfileBanner);
export const attachmentsDirPath = path.join(
  publicDirPath,
  DirNames.Attachments
);
export const emojisDirPath = path.join(publicDirPath, DirNames.Emojis);

export function createFolders() {
  fs.rmSync(tempDirPath, { recursive: true, force: true });
  fs.mkdirSync(tempDirPath, { recursive: true });

  if (!fs.existsSync(avatarsDirPath)) {
    fs.mkdirSync(avatarsDirPath, { recursive: true });
  }
  if (!fs.existsSync(bannersDirPath)) {
    fs.mkdirSync(bannersDirPath, { recursive: true });
  }

  if (!fs.existsSync(attachmentsDirPath)) {
    fs.mkdirSync(attachmentsDirPath, { recursive: true });
  }
  if (!fs.existsSync(emojisDirPath)) {
    fs.mkdirSync(emojisDirPath, { recursive: true });
  }
}

export async function isDirectory(path: string) {
  if (!path) return false;
  try {
    const stat = await fs.promises.stat(path);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}
