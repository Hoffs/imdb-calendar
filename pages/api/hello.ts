import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureSession } from 'lib/server/firebase_auth';

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
): Promise<void> {
  const user = await ensureSession(req);
  if (!user) {
    res.status(401).end();
    return;
  }

  res.status(200).json({ name: 'John Doe' });
}
