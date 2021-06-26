import { updateCalendars } from 'lib/tasks/update_calendars';
import type { NextApiRequest, NextApiResponse } from 'next';

type Error = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error>
): Promise<void> {
  const token = req.headers['x-task-token'];

  if (!token || Array.isArray(token)) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  if (token !== process.env.TASK_SECRET_TOKEN) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const taskName = req.query.task_name;
  if (!taskName || typeof taskName !== 'string') {
    res.status(400).json({ error: 'Invalid or missing task name' });
    return;
  }

  switch (taskName) {
    case 'UPDATE':
      await updateCalendars();
      break;
    default:
      res.status(400).json({ error: 'Invalid task name' });
      return;
  }

  res.status(200).end();
}
