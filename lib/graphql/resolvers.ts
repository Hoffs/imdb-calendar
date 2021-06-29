import ImdbListValidator from 'lib/imdb/list_validator';
import {
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
import {
  updateStore,
  newStoreCtx,
  runWithCtx,
  CtxLogger,
} from 'lib/server/logger';
import { dateScalar } from './date';
import { UserError } from './user_error';
import assert from 'assert';

export interface GqlContext {
  user: { uid: string; email: string }; // email is checked to exist in gql context middleware
  logger: CtxLogger;
}

const Query = {
  async lists(
    _parent: unknown,
    _args: unknown,
    { user: { uid, email }, logger }: GqlContext
  ): Promise<ImdbList[]> {
    return runWithCtx(
      logger,
      newStoreCtx({ initiator: '/api/graphql#lists', uid }),
      async () => {
        logger.info(`getting user lists`);
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
      }
    );
  },
};

const Mutation = {
  async addList(
    _parent: unknown,
    { input }: { input: { url: string } },
    { user: { uid, email }, logger }: GqlContext
  ): Promise<AddListPayload> {
    const ctx = newStoreCtx({
      initiator: '/api/graphql#addList',
      uid,
      list_url: input.url,
    });
    return runWithCtx(logger, ctx, async () => {
      logger.info(`adding list to user`);
      const { url } = input;

      const user = await getUser(email);
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

      let list = await getImdbList(id);
      if (!list) {
        const [isValid, error] = await urlValidator.validate();
        if (!isValid) {
          assert.ok(!!error);
          logger.info(error);
          throw new UserError(error);
        }
      }

      await addImdbListToUser(email, id, isWatchlist);

      // dont refetch if we got it first time
      list = list || (await getImdbList(id));

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
    });
  },

  async removeList(
    _parent: unknown,
    { input }: { input: { id: string } },
    { user: { uid, email }, logger }: GqlContext
  ): Promise<RemoveListPayload> {
    return runWithCtx(
      logger,
      newStoreCtx({ initiator: '/api/graphql#removeList', uid }),
      async () => {
        logger.info(`removing list from user`);

        const decoded = decodeImdbListId(input.id);
        if (!decoded) {
          logger.infoCtx(
            { encoded_list_id: input.id },
            'invalid encoded list id'
          );
          throw new UserError('Invalid ID');
        }

        updateStore({ list_id: decoded });

        await removeListFromUser(email, decoded);

        logger.info(`removed list from user`);
        return {
          id: input.id,
        };
      }
    );
  },
};

export default { Date: dateScalar, Query, Mutation };
