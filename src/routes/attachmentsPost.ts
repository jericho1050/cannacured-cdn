import { Server } from "hyper-express";
import { tempFileMiddleware } from "../middlewares/tempFile.middleware";
import { validGroupIdCheckMiddleware } from "../middlewares/validGroupIdCheck.middleware";
import { addToWaitingList, VerificationType } from "../VerificationService";
import { Request, Response } from "hyper-express";
import { env } from "../env";
import { tempDirPath } from "../utils/Folders";
import { compressImageMiddleware } from "../middlewares/compressImage.middleware";
import { getAudioDurationInSeconds } from 'get-audio-duration'
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function diagnoseFfprobeIssue() {
  const ffprobePath = '/Users/jerichowenzel/Desktop/nerimity-cdn-ts/node_modules/.pnpm/@ffprobe-installer+darwin-arm64@5.0.1/node_modules/@ffprobe-installer/darwin-arm64/ffprobe';
  
  console.log('=== FFPROBE DIAGNOSTICS ===');
  
  try {
    // Check if file exists
    const stats = await fs.stat(ffprobePath);
    console.log('✓ File exists');
    console.log('File size:', stats.size, 'bytes');
    console.log('File permissions:', stats.mode.toString(8));
    console.log('Is executable:', !!(stats.mode & parseInt('111', 8)));
    
    // Check file type
    try {
      const { stdout: fileType } = await execAsync(`file "${ffprobePath}"`);
      console.log('File type:', fileType.trim());
    } catch (e: any) {
      console.log('Could not determine file type:', e.message);
    }
    
    // Check quarantine attributes (macOS specific)
    try {
      const { stdout: xattr } = await execAsync(`xattr "${ffprobePath}"`);
      console.log('Extended attributes:', xattr.trim() || 'none');
      if (xattr.includes('com.apple.quarantine')) {
        console.log('⚠️  File is quarantined by macOS');
      }
    } catch (e: any) {
      console.log('Could not check extended attributes:', e.message);
    }
    
    // Try to make executable
    try {
      await execAsync(`chmod +x "${ffprobePath}"`);
      console.log('✓ Made file executable');
    } catch (e: any) {
      console.log('❌ Could not make file executable:', e.message);
    }
    
    // Try to remove quarantine
    try {
      await execAsync(`xattr -d com.apple.quarantine "${ffprobePath}"`);
      console.log('✓ Removed quarantine attribute');
    } catch (e: any) {
      console.log('Could not remove quarantine (may not exist):', e.message);
    }
    
    // Test basic execution
    try {
      const { stdout: version } = await execAsync(`"${ffprobePath}" -version`);
      console.log('✓ ffprobe executable works');
      console.log('Version:', version.split('\n')[0]);
    } catch (e: any) {
      console.log('❌ ffprobe still not executable:', e.message);
    }
    
  } catch (error: any) {
    console.log('❌ File does not exist or other error:', error.message);
  }
  
  console.log('=== END DIAGNOSTICS ===');
}

export function handleAttachmentsPostRoute(server: Server) {
  server.post(
    "/attachments/:groupId/:fileId",
    validGroupIdCheckMiddleware,
    tempFileMiddleware(),
    compressImageMiddleware({
      size: [1920, 1080, "fit"],
    }),
    route,
    { max_body_length: env.attachmentMaxBodyLength }
  );
}

const route = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      error: "Missing file",
    });
    return;
  }


  const isAudio = req.file.mimetype === "audio/ogg" || req.file.mimetype === "audio/mp3";
  const isVideo = req.file.mimetype === "video/mp4";
  let duration: number | undefined;

  if (isAudio || isVideo) {
    console.log('🔍 About to process audio/video file, running ffprobe diagnostics...');
    await diagnoseFfprobeIssue();
    
    duration = await getAudioDurationInSeconds(req.file.tempPath);
  }

  const result = await addToWaitingList({
    type: VerificationType.ATTACHMENT,
    fileId: req.file.fileId,
    groupId: req.params.groupId as string,
    originalFilename: req.file.originalFilename,
    duration,
    tempFilename: req.file.tempFilename,
    animated: req.file.animated,
    compressed: !!req.file.compressedFilename,
    filesize: req.file.filesize,
    mimetype: req.file.mimetype,
    width: req.file.compressedWidth,
    height: req.file.compressedHeight,
  }, true).catch((err) => {
    console.error(err);
  });

  if (!result) {
    res.status(500).json({
      error: "Failed to add to waiting list",
    });
    return;
  }

  res.status(200).json({
    fileId: req.file.fileId,
  });
};
