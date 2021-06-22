import { ApolloServer, makeExecutableSchema } from 'apollo-server-micro';
import { typeDefs } from 'lib/graphql/typedefs';
import resolvers from 'lib/graphql/resolvers';
import { ensureSession } from 'lib/server/firebase_auth';

export const schema = makeExecutableSchema({ typeDefs, resolvers });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default new ApolloServer({
  schema,
  context: async ({ req }) => {
    if (req?.cookies && typeof req?.cookies === 'object') {
      const user = await ensureSession(req);
      if (!user) {
        throw new Error('Not authorized');
      }

      if (!user.email) {
        throw new Error('No email');
      }

      return { user };
    } else {
      throw new Error('Not authorized');
    }
  },
}).createHandler({
  path: '/api/graphql',
});
