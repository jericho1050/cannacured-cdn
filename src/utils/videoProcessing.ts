import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../env';

// Configure ffmpeg paths based on environment
if (!env.devMode) {
  // In production, set ffmpeg/ffprobe paths
  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
  ffmpeg.setFfprobePath('/usr/bin/ffprobe');
} else {
  // In development, try to use the installed ffprobe from node_modules
  const ffprobePath = '/Users/jerichowenzel/Desktop/nerimity-cdn-ts/node_modules/.pnpm/@ffprobe-installer+darwin-arm64@5.0.1/node_modules/@ffprobe-installer/darwin-arm64/ffprobe';
  try {
    ffmpeg.setFfprobePath(ffprobePath);
  } catch (error) {
    console.log('[VIDEO-CONFIG] Could not set custom ffprobe path, using system default');
  }
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  thumbnailPath?: string;
}

export interface ProcessVideoOptions {
  inputPath: string;
  outputDir: string;
  fileId: string;
}

/**
 * Extract video metadata (dimensions, duration) using ffprobe
 */
export async function extractVideoMetadata(inputPath: string): Promise<VideoMetadata | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.error('[VIDEO-METADATA] Error extracting metadata:', err);
        resolve(null);
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        console.error('[VIDEO-METADATA] No video stream found');
        resolve(null);
        return;
      }

      const result: VideoMetadata = {
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        duration: metadata.format.duration || 0,
      };

      console.log('[VIDEO-METADATA] Extracted metadata:', result);
      resolve(result);
    });
  });
}

/**
 * Generate a thumbnail from a video file
 */
export async function generateVideoThumbnail(options: ProcessVideoOptions): Promise<string | null> {
  const { inputPath, outputDir, fileId } = options;
  const thumbnailFilename = `${fileId}_thumbnail.jpg`;
  const thumbnailPath = path.join(outputDir, thumbnailFilename);

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    return new Promise((resolve) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['10%'], // Take screenshot at 10% of video duration
          filename: thumbnailFilename,
          folder: outputDir,
          size: '320x240'
        })
        .on('end', () => {
          console.log('[VIDEO-THUMBNAIL] Generated thumbnail:', thumbnailPath);
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          console.error('[VIDEO-THUMBNAIL] Error generating thumbnail:', err);
          resolve(null);
        });
    });
  } catch (error) {
    console.error('[VIDEO-THUMBNAIL] Error creating thumbnail directory:', error);
    return null;
  }
}

/**
 * Process a video file: extract metadata and generate thumbnail
 */
export async function processVideo(options: ProcessVideoOptions): Promise<VideoMetadata | null> {
  const { inputPath } = options;
  
  console.log('[VIDEO-PROCESS] Starting video processing for:', inputPath);

  // Extract metadata
  const metadata = await extractVideoMetadata(inputPath);
  if (!metadata) {
    console.error('[VIDEO-PROCESS] Failed to extract video metadata');
    return null;
  }

  // Generate thumbnail
  const thumbnailPath = await generateVideoThumbnail(options);
  if (thumbnailPath) {
    metadata.thumbnailPath = thumbnailPath;
  }

  console.log('[VIDEO-PROCESS] Video processing completed:', metadata);
  return metadata;
} 