import {
  ApolloClient,
  DocumentNode,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
} from '@apollo/client/core';

let apolloClient: ApolloClient<NormalizedCacheObject>;

function createLink(): HttpLink {
  return new HttpLink({
    uri: 'https://api.graphql.imdb.com/',
    fetch,
  });
}

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: createLink(),
    cache: new InMemoryCache(),
  });
}

export function getApollo(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }

  return apolloClient;
}

export const WATCH_LIST_PAGE = gql(`
  query WatchListPage(
      $listId: ID!
      $first: Int!
      $after: String
  ) {
      list: predefinedList(classType: WATCH_LIST, userId: $listId) {
          name {
            originalText
          }
          titleListItemSearch(first: $first, after: $after) {
              total
              pageInfo {
                  hasNextPage
                  endCursor
              }
              edges {
                  listItem: title {
                      id
                  }
              }
          }
      }
  }
`);

export const TITLE_LIST_PAGE = gql(`
  query TitleListMainPage(
    $listId: ID!
    $first: Int!
    $after: String
  ) {
    list(id: $listId) {
        name {
          originalText
        }
        titleListItemSearch(
            first: $first
            after: $after
        ) {
            total
            pageInfo {
                hasNextPage
                endCursor
            }
            edges {
                listItem: title {
                    id
                }
            }
        }
    }
  }
`);

interface ImdbListPage {
  list: {
    name: {
      originalText: string;
    };
    titleListItemSearch: {
      total: number;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      edges: [
        {
          listItem: {
            id: string;
          };
        },
      ];
    };
  };
}

interface ImdbListData {
  id: string;
  name: string;
  title_ids: string[];
  total: number;
}

export async function getWatchList(watchListId: string): Promise<ImdbListData> {
  return getListData(watchListId, WATCH_LIST_PAGE);
}

export async function getTitleList(titleListId: string): Promise<ImdbListData> {
  return getListData(titleListId, TITLE_LIST_PAGE);
}

async function getListData(
  listId: string,
  query: DocumentNode,
): Promise<ImdbListData> {
  const apollo = getApollo();

  // eslint-disable-next-line prefer-const
  let {
    data: {
      list: {
        name: { originalText: name },
        titleListItemSearch: { total: titleTotal },
        titleListItemSearch: page,
      },
    },
  } = await apollo.query<ImdbListPage>({
    query,
    fetchPolicy: 'no-cache',
    variables: {
      listId,
      first: 100,
    },
  });

  const ids = page.edges.map((e) => e.listItem.id);

  while (page.pageInfo.hasNextPage) {
    ({
      data: {
        list: { titleListItemSearch: page },
      },
    } = await apollo.query<ImdbListPage>({
      query,
      fetchPolicy: 'no-cache',
      variables: {
        listId,
        first: 100,
        after: page.pageInfo.endCursor,
      },
    }));

    ids.push(...page.edges.map((e) => e.listItem.id));
  }

  if (ids.length != titleTotal) {
    throw new Error(`Fetched ${ids.length} ids while total is ${page.total}`);
  }

  return { id: listId, name, title_ids: ids, total: titleTotal };
}
