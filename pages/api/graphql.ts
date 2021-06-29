import { ApolloServer, makeExecutableSchema } from 'apollo-server-micro';
import { typeDefs } from 'lib/graphql/typedefs';
import resolvers, { GqlContext } from 'lib/graphql/resolvers';
import { ensureSession } from 'lib/server/firebase_auth';
import { CtxLogger } from 'lib/server/logger';
import { FirebaseDb } from 'lib/server/firebase';

export const schema = makeExecutableSchema({ typeDefs, resolvers });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default new ApolloServer({
  schema,
  context: async ({ req }): Promise<GqlContext> => {
    if (req?.cookies && typeof req?.cookies === 'object') {
      const user = await ensureSession(req);
      if (!user) {
        throw new Error('Not authorized');
      }

      if (typeof user.email === 'undefined') {
        throw new Error('No email');
      }

      return {
        user: { uid: user.uid, email: user.email },
        logger: new CtxLogger(),
        db: new FirebaseDb(),
      };
    } else {
      throw new Error('Not authorized');
    }
  },
}).createHandler({
  path: '/api/graphql',
});
