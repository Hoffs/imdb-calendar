import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAuth } from 'utils/server/firebase_auth';
import firebase from 'utils/server/firestore';
import { serialize } from 'cookie';

type Error = {
  error: string;
};

const EXPIRES = 7 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error>
) {
  const idToken = req.headers['x-firebase-id'];
  if (idToken && !Array.isArray(idToken)) {
    try {
      const cookie = await firebase
        .auth()
        .createSessionCookie(idToken, { expiresIn: EXPIRES });

      const options = {
        maxAge: EXPIRES,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      };
      res.setHeader(
        'Set-Cookie',
        serialize('x-firebase-cookie', cookie, options)
      );
      res.status(200).end();
    } catch (error) {
      res.status(401).json({ error });
    }

    return;
  }

  res.status(401).json({ error: 'Missing firebase token ID' });
}
