import { auth } from 'firebase-admin';
import { NextApiRequest } from 'next';
import firebase from 'utils/server/firestore';

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
