import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar Date

  type Query {
    lists: [ImdbList!]!
  }

  type Mutation {
    addList(input: AddListInput!): AddListPayload!
    removeList(input: RemoveListInput!): RemoveListPayload!
  }

  input AddListInput {
    url: String!
  }

  type AddListPayload {
    list: ImdbList!
  }

  input RemoveListInput {
    id: ID!
  }

  type RemoveListPayload {
    id: ID!
  }

  type ImdbList {
    id: ID!
    name: String
    url: String
    is_watchlist: Boolean!
    last_updated: Date
  }
`;
