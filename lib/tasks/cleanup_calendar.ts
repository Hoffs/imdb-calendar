import { FirebaseDb } from 'lib/server/firebase';
import { CtxLogger } from 'lib/server/logger';

export async function cleanupCalendar(
  id: string,
  ts: FirebaseFirestore.Timestamp,
  logger: CtxLogger,
  db: FirebaseDb
): Promise<void> {
  logger.info('deleting calendar');
  const docRef = db.lists.doc(id);
  await docRef.delete({ lastUpdateTime: ts });

  const file = db.storage.bucket().file(id);
  await file.delete({ ignoreNotFound: true });
  logger.info('deleted calendar');
}
