import Layout from 'components/Layout';
import { useApollo } from 'lib/client/graphql';
import { ApolloProvider, gql, useQuery } from '@apollo/client';
import { ImdbList } from 'lib/graphql/types';
import { ListItem } from 'components/ListItem';
import { ListInputBox } from 'components/ListInputBox';

const ListsQuery = gql`
  query Lists {
    lists {
      id
      name
      url
      imdb_id
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
      <main tw="max-w-lg">
        <div tw="text-2xl">IMDB Calendar</div>
        <div tw="text-sm">Add iCal link to your calendar program</div>
        <div tw="text-sm mb-4">
          Contents of the iCal will update every ~24 hours
        </div>
        <span tw="flex flex-row justify-between mb-2">
          <div tw="text-xl">Your Lists</div>
          <div tw="text-xl">{q.data?.lists.length}/10</div>
        </span>

        <ListInputBox />

        {q.data?.lists.map((x) => (
          <ListItem key={x.id} data={x} />
        ))}
      </main>
    </Layout>
  );
}

export default function Wrapped(): JSX.Element {
  const apolloClient = useApollo();
  return (
    <ApolloProvider client={apolloClient}>
      <Home />
    </ApolloProvider>
  );
}
