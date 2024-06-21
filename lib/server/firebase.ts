import { User, ImdbList } from 'lib/server/types';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import {
  getFirestore,
  Firestore,
  CollectionReference,
  FieldValue,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

function init() {
  if (!getApps().length) {
    let privateKey = process.env.FIREBASE_SVC_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_SVC_PROJECT_ID,
        clientEmail: process.env.FIREBASE_SVC_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
}

// From https://jamiecurnow.medium.com/using-firestore-with-typescript-65bd2a602945
// The types on toFirestore are quite weird, but it does not complain so ???
const converter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): Partial<T> => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});

const dataPoint = <T>(fs: Firestore, collectionPath: string) =>
  fs.collection(collectionPath).withConverter(converter<T>());

type UpdatePayload = {
  name?: string;
  item_ids?: {
    [imdb_id: string]: string;
  };
  url?: string;
};

export class FirebaseDb {
  public firestore: Firestore;
  public storage: Storage;
  public users: CollectionReference<User>;
  public lists: CollectionReference<ImdbList>;

  constructor() {
    init();
    this.firestore = getFirestore();
    this.storage = getStorage();
    this.users = dataPoint<User>(this.firestore, 'users');
    this.lists = dataPoint<ImdbList>(this.firestore, 'imdb_lists');
  }

  async getUser(email: string): Promise<User> {
    const user = await this.getUserRaw(email);
    if (user) {
      return user;
    }

    await this.users.doc(email).set({ imdb_lists: [] });
    const newUser = await this.getUserRaw(email);
    if (newUser) {
      return newUser;
    }

    throw new Error('Failed to get or create User');
  }

  private getUserRaw = async (email: string): Promise<User | undefined> => {
    const user = await this.users.doc(email).get();
    return user.data();
  };

  async addImdbListToUser(
    email: string,
    listId: string,
    isWatchlist: boolean,
  ): Promise<void> {
    await this.getUser(email);

    const batch = this.firestore.batch();

    const userRef = this.users.doc(email);
    batch.update(userRef, {
      imdb_lists: FieldValue.arrayUnion(listId),
    });

    const listRef = this.lists.doc(listId);
    batch.set(listRef, {
      is_watchlist: isWatchlist,
      item_ids: {},
      users: [],
    });

    batch.update(listRef, {
      users: FieldValue.arrayUnion(email),
    });

    await batch.commit();
  }

  async removeListFromUser(email: string, listId: string): Promise<void> {
    const batch = this.firestore.batch();

    const userRef = this.users.doc(email);
    batch.update(userRef, {
      imdb_lists: FieldValue.arrayRemove(listId),
    });

    const listRef = this.lists.doc(listId);
    batch.update(listRef, {
      users: FieldValue.arrayRemove(email),
    });

    await batch.commit();
  }

  getImdbList = async (listId: string): Promise<ImdbList | undefined> => {
    const list = await this.lists.doc(listId).get();
    return list.data();
  };

  updateImdbList = async (
    listId: string,
    payload: UpdatePayload,
  ): Promise<void> => {
    await this.lists.doc(listId).update(payload);
  };

  async *getImdbLists(): AsyncGenerator<
    [string, FirebaseFirestore.Timestamp, ImdbList],
    void,
    unknown
  > {
    const snap = await this.lists.get();
    for (const d of snap.docs) {
      if (d.exists) {
        const data = d.data();
        yield [d.id, d.updateTime, data];
      }
    }
  }
}

export const auth = (): Auth => {
  init();
  return getAuth();
};
