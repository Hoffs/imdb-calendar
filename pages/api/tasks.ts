import { CtxLogger, updateStore, withCtx } from 'lib/server/logger';
import { updateCalendars } from 'lib/tasks/update_calendars';
import type { NextApiRequest, NextApiResponse } from 'next';

type Error = {
  error: string;
};

async function handler(
  logger: CtxLogger,
  req: NextApiRequest,
  res: NextApiResponse<Error>
): Promise<void> {
  updateStore({ initiator: '/api/tasks' });
  const token = req.headers['x-task-token'];

  if (!token || Array.isArray(token)) {
    logger.info('sign in reqest does not contain task token');
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  if (token !== process.env.TASK_SECRET_TOKEN) {
    logger.info('sign in reqest contains incorrect task token');
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const taskName = req.query.task_name;
  if (!taskName || typeof taskName !== 'string') {
    logger.infoCtx(
      { task_name: String(taskName) },
      'sign in reqest contains incorrect task name'
    );
    res.status(400).json({ error: 'Invalid or missing task name' });
    return;
  }

  let task: Promise<unknown> | undefined;
  switch (taskName) {
    case 'UPDATE':
      updateStore({ task_name: taskName });
      task = updateCalendars(logger);
      break;
    default:
      task = undefined;
      break;
  }

  if (task) {
    logger.info('executing task');
    res.status(202).end();
    await task;
  } else {
    logger.infoCtx({ task_name: taskName }, 'invalid task name');
    res.status(400).json({ error: 'Invalid task name' });
  }
}

export default withCtx(handler);
