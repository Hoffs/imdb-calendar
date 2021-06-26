import { getImdbLists } from 'lib/server/firebase';
import { cleanupCalendar } from './cleanup_calendar';
import { createCalendar } from './create_list_calendar';

export async function updateCalendars(): Promise<void> {
  for await (const [id, timestamp, list] of getImdbLists()) {
    if (list.users.length === 0) {
      await cleanupCalendar(id, timestamp);
    } else {
      await createCalendar(id, list);
    }
  }
}
