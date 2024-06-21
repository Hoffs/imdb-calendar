import { GraphQLScalarType } from 'graphql';

export const dateScalar = new GraphQLScalarType({
  name: 'Date',
  parseValue(value) {
    if (typeof value == 'string') {
      return new Date(value);
    }

    throw new Error('Value was not String');
  },
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    throw new Error('Value was not Date');
  },
});
