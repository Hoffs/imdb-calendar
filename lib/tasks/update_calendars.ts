import { FirebaseDb } from 'lib/server/firebase';
import { CtxLogger, updateStore } from 'lib/server/logger';
import { cleanupCalendar } from './cleanup_calendar';
import { updateCalendar } from './update_list_calendar';

export async function updateCalendars(logger: CtxLogger): Promise<void> {
  const db = new FirebaseDb();
  logger.info('updating all calendars');
  for await (const [id, timestamp, list] of db.getImdbLists()) {
    updateStore({ list_id: id });
    if (list.users.length === 0) {
      await cleanupCalendar(id, timestamp, logger, db);
    } else {
      await updateCalendar(id, list, logger, db);
    }
  }
}
