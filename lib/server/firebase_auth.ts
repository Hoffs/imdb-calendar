import fb from 'firebase-admin';
import { auth } from 'lib/server/firebase';
import { ctxLogger } from './logger';

type Request = {
  cookies: {
    [key: string]: string;
  };
};

export const ensureSession = async (
  req: Request
): Promise<fb.auth.DecodedIdToken | undefined> => {
  const cookie = req.cookies['firebase-cookie'];
  if (cookie) {
    try {
      return await auth().verifySessionCookie(cookie);
    } catch (e) {
      ctxLogger().errorCtx({ err: e }, 'failed to validate session cookie');
      return undefined;
    }
  }

  return Promise.resolve(undefined);
};
