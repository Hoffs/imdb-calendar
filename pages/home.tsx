import Layout from 'components/Layout';
import { useApollo } from 'lib/client/graphql';
import { ApolloProvider, gql, useQuery } from '@apollo/client';
import { ImdbList } from 'lib/graphql/types';

const ListsQuery = gql`
  query Lists {
    lists {
      id
      name
      url
      is_watchlist
      last_updated
    }
  }
`;

type ListsQueryData = {
  lists: ImdbList[];
};

function Home(): JSX.Element {
  const q = useQuery<ListsQueryData>(ListsQuery);

  if (q.loading) {
    return (
      <Layout>
        <div tw="py-2 px-4 border-2 border-blue-800 rounded animate-pulse">
          Loading
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div tw="text-2xl">IMDB Calendar</div>
        <div tw="text-xl">Your Lists</div>

        <ul>
          {q.data?.lists.map((x) => (
            <li key={x.id}>
              {x.id} / {x.name}
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}

// export default function Wrapped(e: PropsWithChildren<Record<string, unknown>>): JSX.Element {
export default function Wrapped(): JSX.Element {
  const apolloClient = useApollo();
  return (
    <ApolloProvider client={apolloClient}>
      <Home />
    </ApolloProvider>
  );
}
