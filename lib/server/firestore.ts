import admin from 'firebase-admin';

const serviceAccount = require('../../firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
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

export const users = dataPoint<User>('users');
export const imdbLists = dataPoint<ImdbList>('imdb_lists');

export const ensureUser = async (email: string): Promise<User> => {
  const user = await getUser(email);
  if (user) {
    return user;
  }

  await users.doc(email).set({ imdb_lists: [] });
  const newUser = await getUser(email);
  if (newUser) {
    return newUser;
  }

  throw new Error('Failed to get or create user');
};

const getUser = async (email: string): Promise<User | undefined> => {
  const user = await users.doc(email).get();
  return user.data();
};

export const addListForUser = async (
  email: string,
  listId: string,
  isWatchlist: boolean
): Promise<void> => {
  await ensureUser(email);

  const batch = admin.firestore().batch();

  const userRef = users.doc(email);
  batch.update(userRef, {
    imdb_lists: admin.firestore.FieldValue.arrayUnion(listId),
  });

  const listRef = imdbLists.doc(listId);
  batch.set(listRef, {
    removed: false,
    is_watchlist: isWatchlist,
    tmdb_ids: [],
  });

  await batch.commit();
};

export const removeListForUser = async (
  email: string,
  listId: string
): Promise<void> => {
  const userRef = users.doc(email);
  await userRef.update({
    imdbLists: admin.firestore.FieldValue.arrayRemove(listId),
  });
};

export const getList = async (
  listId: string
): Promise<ImdbList | undefined> => {
  const list = await imdbLists.doc(listId).get();
  return list.data();
};

export default admin;
