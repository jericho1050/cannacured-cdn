import { VerificationType } from "../VerificationService";
import { attachmentsDirPath, avatarsDirPath, bannersDirPath, emojisDirPath } from "./Folders";
import path from 'path';

export function typeToDir(type: string) {
  switch (type) {
    case VerificationType.ATTACHMENT:
      return attachmentsDirPath;
    case VerificationType.AVATAR:
      return avatarsDirPath;
    case VerificationType.BANNER:
      return bannersDirPath;
    case VerificationType.EMOJI:
      return emojisDirPath;
  }
}
export function typeToRelativeDir(type: string) {
  switch (type) {
    case VerificationType.ATTACHMENT:
      return path.basename(attachmentsDirPath);
    case VerificationType.AVATAR:
      return path.basename(avatarsDirPath);
    case VerificationType.BANNER:
      return path.basename(bannersDirPath);
    case VerificationType.EMOJI:
      return path.basename(emojisDirPath);
  }
}