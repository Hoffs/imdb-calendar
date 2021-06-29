import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from 'lib/server/firebase';
import { serialize } from 'cookie';
import { CtxLogger, updateStore, withCtx } from 'lib/server/logger';

type Error = {
  error: string;
};

const EXPIRES = 7 * 24 * 60 * 60 * 1000;

async function handler(
  logger: CtxLogger,
  req: NextApiRequest,
  res: NextApiResponse<Error>
): Promise<void> {
  updateStore({ initiator: '/api/signin' });
  logger.info('received signin request');
  const idToken = req.headers['x-firebase-id'];
  if (idToken && !Array.isArray(idToken)) {
    try {
      const cookie = await auth().createSessionCookie(idToken, {
        expiresIn: EXPIRES,
      });

      res.setHeader(
        'Set-Cookie',
        serialize('firebase-cookie', cookie, {
          maxAge: EXPIRES / 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        })
      );

      res.status(200).end();
    } catch (error) {
      logger.errorCtx({ err: error }, 'failed to create session cookie');
      res.status(401).json({ error });
    }

    return;
  }

  logger.info('sign in reqest does not contain Firebase token ID');
  res.status(401).json({ error: 'Missing Firebase token ID' });
}

export default withCtx(handler);
