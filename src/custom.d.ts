import { DefaultRequestLocals } from 'hyper-express';

declare module 'hyper-express' {
  interface Request<T = DefaultRequestLocals> {
    file?: {
      originalFilename: string;
      fileId: string;
      tempFilename: string;
      mimetype: string;
      fileSize: number;
      shouldCompress: boolean;
      compressedFilename?: string;
    }
  }
}