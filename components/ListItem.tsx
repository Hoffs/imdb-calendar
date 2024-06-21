import { Reference, gql, useMutation } from '@apollo/client';
import { ImdbList, RemoveListPayload } from 'lib/graphql/types';
import LinkUtils from 'lib/imdb/link_utils';
import React from 'react';

const RemoveListMutation = gql`
  mutation RemoveList($id: ID!) {
    removeList(input: { id: $id }) {
      id
    }
  }
`;

export function ListItem({ data }: { data: ImdbList }): React.JSX.Element {
  const [removeList, mutation] = useMutation<
    { removeList: RemoveListPayload },
    { id: string }
  >(RemoveListMutation, {
    variables: { id: data.id },
    update(cache, r) {
      cache.modify({
        fields: {
          lists(existing: readonly Reference[] = [], { readField }) {
            return existing.filter(
              (ref) => readField('id', ref) !== r.data?.removeList.id,
            );
          },
        },
      });
    },
  });

  const imdbUrl = LinkUtils.getUrl(data.imdb_id, data.is_watchlist);

  return (
    <div
      key={data.id}
      tw="shadow w-full flex flex-row justify-between border border-gray-400 rounded-b p-4 mt-4 mb-4 gap-8"
    >
      <span tw="h-full flex flex-col gap-2 overflow-x-hidden break-all">
        <span tw="flex flex-row gap-2 items-end text-lg leading-5 font-semibold">
          <span tw="uppercase text-xs leading-snug font-normal">Name</span>
          {data.name || 'Not Updated'}
        </span>
        <span tw="flex flex-row gap-2 items-end text-xs leading-5">
          <span tw="uppercase text-xs leading-snug min-w-min">IMDB</span>
          <a
            href={imdbUrl}
            tw="flex-shrink break-all text-purple-800 hover:text-purple-500"
          >
            {imdbUrl}
          </a>
        </span>
        <span tw="flex flex-row gap-2 items-end text-xs leading-5">
          <span tw="flex-none uppercase text-xs leading-snug">iCal</span>
          <a
            href={data.url}
            tw="flex-1 break-all text-purple-800 hover:text-purple-500"
          >
            {data.url}
          </a>
        </span>
      </span>

      <button
        onClick={() => removeList().catch(console.error)}
        disabled={mutation.loading}
        tw="disabled:opacity-50 disabled:cursor-default px-4 border-2 border-red-600 rounded uppercase text-red-600 bg-red-50 font-semibold hover:border-red-400 hover:text-red-400"
      >
        Remove
      </button>
    </div>
  );
}
