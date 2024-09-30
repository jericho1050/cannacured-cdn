import { Request, Response } from 'hyper-express';
import { env } from '../env';


if (env.devMode) {
  console.log('Warn: Dev mode enabled, skipping secret check');
}


export const checkSecretMiddleware = async (req: Request, res: Response) => {
  const secret = req.headers['secret'] as string;

  if (!secret) {
    res.status(400).json({
      error: 'Missing secret header',
    });
    return;
  }
  if (secret !== env.secret) {
    res.status(401).json({
      error: 'Invalid secret header',
    });
    return;
  }
}