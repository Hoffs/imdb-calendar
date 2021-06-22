import { isValidList, isValidWatchlist } from 'lib/imdb/list';
import firebase, {
  users,
  imdbLists,
  addListForUser,
  getList,
  removeListForUser,
} from 'lib/server/firestore';
import {
  AddListPayload,
  decodeImdbListId,
  encodeImdbListId,
  ImdbList,
  RemoveListPayload,
} from 'lib/graphql/types';
import { dateScalar } from './date';

interface GqlContext {
  user: firebase.auth.DecodedIdToken & { email: string }; // email is checked to exist in gql context middleware
}

const Query = {
  async lists(
    _parent: unknown,
    _args: unknown,
    context: GqlContext
  ): Promise<ImdbList[]> {
    const email = context.user.email;
    if (!email) {
      return [];
    }

    const user = await users.doc(email).get();
    if (!user) {
      return [];
    }

    const userData = user.data();
    if (!userData) {
      return [];
    }

    const promises = userData.imdb_lists.map(
      async (id): Promise<ImdbList | undefined> => {
        return imdbLists
          .doc(id)
          .get()
          .then((doc) => {
            const data = doc.data();
            if (!data) {
              return undefined;
            }

            return {
              id: encodeImdbListId(id),
              name: data.name,
              url: data.url,
              imdb_id: id,
              is_watchlist: data.is_watchlist,
              last_updated: data.last_updated,
            };
          })
          .catch(() => undefined);
      }
    );

    const results = await Promise.allSettled(promises);
    return results.reduce((acc: ImdbList[], x) => {
      if (x.status === 'fulfilled' && x.value) {
        acc.push(x.value);
      }
      return acc;
    }, []);
  },
};

const reWatchlist = /^https:\/\/www.imdb.com\/user\/(?<id>.*)\/watchlist$/;
const reList = /^https:\/\/www.imdb.com\/list\/(?<id>.*)\/?$/;

const Mutation = {
  async addList(
    _parent: unknown,
    { input }: { input: { url: string } },
    context: GqlContext
  ): Promise<AddListPayload> {
    const { url } = input;
    const clean = url.trim().split('?', 1)[0];

    const watchlistMatch = clean.match(reWatchlist);
    const listMatch = clean.match(reList);
    const [id, isWatchlist] = watchlistMatch?.groups?.id
      ? [watchlistMatch.groups.id, true]
      : [listMatch?.groups?.id, false];

    if (id) {
      let list = await getList(id);
      if (!list) {
        // Calling IMDB is kinda expensive so only do it if theres not entry.
        if (isWatchlist && !(await isValidWatchlist(id))) {
          throw new Error('Watchlist is private or invalid');
        } else if (!isWatchlist && !(await isValidList(id))) {
          throw new Error('List is private or invalid');
        }
      }

      await addListForUser(context.user.email, id, isWatchlist);

      // dont refetch if we got it first time
      list = list || (await getList(id));

      if (!list) {
        throw new Error('Failed to create or get list');
      }

      return {
        list: {
          id: Buffer.from(`ImdbList_${id}`).toString('base64'),
          name: list.name,
          url: list.url,
          imdb_id: id,
          is_watchlist: list.is_watchlist,
          last_updated: list.last_updated,
        },
      };
    }

    throw new Error('URL is of invalid format');
  },

  async removeList(
    _parent: unknown,
    { input }: { input: { id: string } },
    context: GqlContext
  ): Promise<RemoveListPayload> {
    const decoded = decodeImdbListId(input.id);
    if (!decoded) {
      throw new Error('Invalid ID');
    }

    await removeListForUser(context.user.email, decoded);
    return {
      id: input.id,
    };
  },
};

export default { Date: dateScalar, Query, Mutation };
