// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAuth } from 'utils/server/firebase_auth';

type Data = {
  name: string;
};

type Error = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  const user = await validateAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Bad ID Token' });
    return;
  }

  res.status(200).json({ name: 'John Doe' });
}
