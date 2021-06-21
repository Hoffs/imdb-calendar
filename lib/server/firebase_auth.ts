import { auth } from 'firebase-admin';
import { NextApiRequest } from 'next';
import firebase from 'lib/server/firestore';

export const validateAuth = async (
  req: NextApiRequest
): Promise<auth.DecodedIdToken | undefined> => {
  const idToken = req.headers['x-firebase-id'];
  if (idToken && !Array.isArray(idToken)) {
    try {
      const decoded = await firebase.auth().verifyIdToken(idToken);
      return decoded;
    } catch (error) {
      return undefined;
    }
  }

  return undefined;
};

type Request = {
  cookies: {
    [key: string]: string;
  };
};

export const ensureSession = async (
  req: Request
): Promise<firebase.auth.DecodedIdToken | undefined> => {
  const cookie = req.cookies['firebase-cookie'];
  if (cookie) {
    try {
      return await firebase.auth().verifySessionCookie(cookie);
    } catch (e) {
      return undefined;
    }
  }

  return Promise.resolve(undefined);
};
