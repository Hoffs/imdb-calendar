import ImdbListValidator from 'lib/imdb/list_validator';
import firebase, {
  addImdbListToUser,
  getImdbList,
  removeListFromUser,
  getUser,
} from 'lib/server/firebase';
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
    const user = await getUser(email);

    const promises = user.imdb_lists.map(
      async (id): Promise<ImdbList | undefined> => {
        const list = await getImdbList(id);
        if (!list) {
          return undefined;
        }

        return {
          ...list,
          id: encodeImdbListId(id),
          imdb_id: id,
        };
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

const Mutation = {
  async addList(
    _parent: unknown,
    { input }: { input: { url: string } },
    context: GqlContext
  ): Promise<AddListPayload> {
    const { url } = input;

    const user = await getUser(context.user.email);
    if (user.imdb_lists.length >= 10) {
      throw new Error('You already have 10 playlists');
    }

    const urlValidator = new ImdbListValidator(url);

    const [isValid, id, isWatchlist] = urlValidator.parse();
    if (!isValid) {
      throw new Error('URL is not a valid IMDB watchlist or list');
    }

    let list = await getImdbList(id);
    if (!list) {
      const [isValid, error] = await urlValidator.validate();
      if (!isValid) {
        throw new Error(error);
      }
    }

    await addImdbListToUser(context.user.email, id, isWatchlist);

    // dont refetch if we got it first time
    list = list || (await getImdbList(id));

    if (!list) {
      throw new Error('Failed to create or get list');
    }

    return {
      list: {
        ...list,
        id: encodeImdbListId(id),
        imdb_id: id,
      },
    };
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

    await removeListFromUser(context.user.email, decoded);
    return {
      id: input.id,
    };
  },
};

export default { Date: dateScalar, Query, Mutation };
