import { VerificationType } from "../VerificationService";
import { attachmentsDirPath, avatarsDirPath, bannersDirPath, emojisDirPath } from "./Folders";

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