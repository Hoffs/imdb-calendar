import type { NextApiRequest, NextApiResponse } from 'next';
import firebase from 'lib/server/firestore';
import { serialize } from 'cookie';

type Error = {
  error: string;
};

const EXPIRES = 7 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error>
): Promise<void> {
  const idToken = req.headers['x-firebase-id'];
  if (idToken && !Array.isArray(idToken)) {
    try {
      const cookie = await firebase
        .auth()
        .createSessionCookie(idToken, { expiresIn: EXPIRES });

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
      res.status(401).json({ error });
    }

    return;
  }

  res.status(401).json({ error: 'Missing firebase token ID' });
}
