import ImdbListValidator from 'lib/imdb/list_validator';
import { FirebaseDb } from 'lib/server/firebase';
import {
  AddListPayload,
  decodeImdbListId,
  encodeImdbListId,
  ImdbList,
  RemoveListPayload,
} from 'lib/graphql/types';
import { updateStore, CtxLogger, withCtxGql } from 'lib/server/logger';
import { dateScalar } from './date';
import { UserError } from './user_error';
import assert from 'assert';

export interface GqlContext {
  user: { uid: string; email: string }; // email is checked to exist in gql context middleware
  logger: CtxLogger;
  db: FirebaseDb;
}

const QueryImpl = {
  async lists(
    _parent: unknown,
    _args: unknown,
    { user: { email }, logger, db }: GqlContext,
  ): Promise<ImdbList[]> {
    logger.info(`getting user lists`);
    const user = await db.getUser(email);

    const promises = user.imdb_lists.map(
      async (id): Promise<ImdbList | undefined> => {
        const list = await db.getImdbList(id);
        if (!list) {
          return undefined;
        }

        return {
          ...list,
          id: encodeImdbListId(id),
          imdb_id: id,
        };
      },
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

const MutationImpl = {
  async addList(
    _parent: unknown,
    { input }: { input: { url: string } },
    { user: { email }, logger, db }: GqlContext,
  ): Promise<AddListPayload> {
    updateStore({ list_url: input.url });
    logger.info(`adding list to user`);
    const { url } = input;

    const user = await db.getUser(email);
    if (user.imdb_lists.length >= 10) {
      logger.info(`user already has 10 lists`);
      throw new UserError('You already have 10 playlists');
    }

    const urlValidator = new ImdbListValidator(url);

    const [isValid, id, isWatchlist] = urlValidator.parse();
    if (!isValid) {
      logger.info('invalid url');
      throw new UserError('URL is not a valid IMDB watchlist or list');
    }

    updateStore({ list_id: id });

    let list = await db.getImdbList(id);
    if (!list) {
      const [isValid, error] = await urlValidator.validate();
      if (!isValid) {
        assert.ok(!!error);
        logger.info(error);
        throw new UserError(error);
      }
    }

    await db.addImdbListToUser(email, id, isWatchlist);

    // dont refetch if we got it first time
    list = list || (await db.getImdbList(id));

    if (!list) {
      throw new Error('Failed to create or get list');
    }

    logger.info(`added list to user`);
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
    { user: { email }, logger, db }: GqlContext,
  ): Promise<RemoveListPayload> {
    logger.info(`removing list from user`);

    const decoded = decodeImdbListId(input.id);
    if (!decoded) {
      logger.infoCtx({ encoded_list_id: input.id }, 'invalid encoded list id');
      throw new UserError('Invalid ID');
    }

    updateStore({ list_id: decoded });

    await db.removeListFromUser(email, decoded);

    logger.info(`removed list from user`);
    return {
      id: input.id,
    };
  },
};

export default {
  Date: dateScalar,
  Query: {
    lists: withCtxGql('lists', QueryImpl.lists),
  },
  Mutation: {
    removeList: withCtxGql('removeList', MutationImpl.removeList),
    addList: withCtxGql('addList', MutationImpl.addList),
  },
};
