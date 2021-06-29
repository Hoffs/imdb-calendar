import firebase from 'lib/server/firebase';
import { CtxLogger } from 'lib/server/logger';

export async function cleanupCalendar(
  id: string,
  ts: FirebaseFirestore.Timestamp,
  logger: CtxLogger
): Promise<void> {
  logger.info('deleting calendar');
  const docRef = firebase.firestore().collection('imdb_lists').doc(id);
  await docRef.delete({ lastUpdateTime: ts });

  const file = firebase.storage().bucket().file(id);
  await file.delete({ ignoreNotFound: true });
  logger.info('deleted calendar');
}
