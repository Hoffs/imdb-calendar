import { gql, useMutation } from '@apollo/client';
import { ImdbList, RemoveListPayload } from 'lib/graphql/types';
import { listUrl, watchlistUrl } from 'lib/imdb/list';

const RemoveListMutation = gql`
  mutation RemoveList($id: ID!) {
    removeList(input: { id: $id }) {
      id
    }
  }
`;

export function ListItem({ data }: { data: ImdbList }): JSX.Element {
  const [removeList, mutation] = useMutation<
    { removeList: RemoveListPayload },
    { id: string }
  >(RemoveListMutation, {
    variables: { id: data.id },
    update(cache, r) {
      cache.modify({
        fields: {
          lists(existing: { __ref: string }[] = []): unknown[] {
            const ref = cache.identify({
              __typename: 'ImdbList',
              id: r.data?.removeList.id,
            });
            return existing.filter((x) => x.__ref != ref);
          },
        },
      });
    },
  });

  const url = data.is_watchlist
    ? watchlistUrl(data.imdb_id)
    : listUrl(data.imdb_id);

  return (
    <div
      key={data.id}
      tw="w-full flex flex-row justify-between border border-gray-400 rounded-b p-4 mt-4 mb-4 gap-8"
    >
      <span tw="h-full flex flex-col gap-2 overflow-x-hidden break-all">
        <span>{data.name}</span>
        <span>Link: {url}</span>
        <span>Calendar Link: {data.url}</span>
      </span>

      <button
        onClick={() => removeList().catch(console.error)}
        disabled={mutation.loading}
        tw="disabled:opacity-50 disabled:cursor-default px-4 border-2 border-red-600 rounded uppercase text-red-600 bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}
