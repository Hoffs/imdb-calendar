import admin from 'firebase-admin';

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_SVC_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_SVC_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SVC_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

/**
 * This Gist is part of a medium article - read here:
 * https://jamiecurnow.medium.com/using-firestore-with-typescript-65bd2a602945
 */

// Import or define your types
import { User, ImdbList } from 'lib/server/types';

const converter = <T>() => ({
  toFirestore: (data: Partial<T>) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T,
});

const dataPoint = <T>(collectionPath: string) =>
  admin.firestore().collection(collectionPath).withConverter(converter<T>());

const users = dataPoint<User>('users');
const imdbLists = dataPoint<ImdbList>('imdb_lists');

// Gets User or creates if it does not exist.
export const getUser = async (email: string): Promise<User> => {
  const user = await getUserRaw(email);
  if (user) {
    return user;
  }

  await users.doc(email).set({ imdb_lists: [] });
  const newUser = await getUserRaw(email);
  if (newUser) {
    return newUser;
  }

  throw new Error('Failed to get or create User');
};

const getUserRaw = async (email: string): Promise<User | undefined> => {
  const user = await users.doc(email).get();
  return user.data();
};

export const addImdbListToUser = async (
  email: string,
  listId: string,
  isWatchlist: boolean
): Promise<void> => {
  await getUser(email);

  const batch = admin.firestore().batch();

  const userRef = users.doc(email);
  batch.update(userRef, {
    imdb_lists: admin.firestore.FieldValue.arrayUnion(listId),
  });

  const listRef = imdbLists.doc(listId);
  batch.set(listRef, {
    is_watchlist: isWatchlist,
    item_ids: {},
    users: [],
  });

  batch.update(listRef, {
    users: admin.firestore.FieldValue.arrayUnion(email),
  });

  await batch.commit();
};

export const removeListFromUser = async (
  email: string,
  listId: string
): Promise<void> => {
  const batch = admin.firestore().batch();

  const userRef = users.doc(email);
  batch.update(userRef, {
    imdb_lists: admin.firestore.FieldValue.arrayRemove(listId),
  });

  const listRef = imdbLists.doc(listId);
  batch.update(listRef, {
    users: admin.firestore.FieldValue.arrayRemove(email),
  });

  await batch.commit();
};

export const getImdbList = async (
  listId: string
): Promise<ImdbList | undefined> => {
  const list = await imdbLists.doc(listId).get();
  return list.data();
};

type UpdatePayload = {
  name?: string;
  item_ids?: {
    [imdb_id: string]: string;
  };
  url?: string;
};

export const updateImdbList = async (
  listId: string,
  payload: UpdatePayload
): Promise<void> => {
  await imdbLists.doc(listId).update(payload);
};

export async function* getImdbLists(): AsyncGenerator<
  [string, FirebaseFirestore.Timestamp, ImdbList],
  void,
  unknown
> {
  const snap = await imdbLists.get();
  for (const d of snap.docs) {
    if (d.exists) {
      const data = d.data();
      yield [d.id, d.updateTime, data];
    }
  }
}

export default admin;
