import { DefaultRequestLocals } from 'hyper-express';

declare module 'hyper-express' {
  interface Request<T = DefaultRequestLocals> {
    file?: {
      name: string;
      tempFilename: string;
      mimetype: string;
    }
  }
}