import firebase from 'lib/server/firebase';

export async function cleanupCalendar(
  id: string,
  ts: FirebaseFirestore.Timestamp
): Promise<void> {
  const docRef = firebase.firestore().collection('imdb_lists').doc(id);
  await docRef.delete({ lastUpdateTime: ts });

  const file = firebase.storage().bucket().file(id);
  await file.delete({ ignoreNotFound: true });
}
