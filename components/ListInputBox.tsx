import { gql, useMutation } from '@apollo/client';
import { AddListPayload } from 'lib/graphql/types';
import { useState } from 'react';
import tw from 'twin.macro';

const AddListMutation = gql`
  mutation AddList($url: String!) {
    addList(input: { url: $url }) {
      list {
        id
        name
        url
        imdb_id
        is_watchlist
        last_updated
      }
    }
  }
`;

export function ListInputBox(): JSX.Element {
  const [err, setErr] = useState<string | undefined>();
  const [url, setUrl] = useState<string>('');
  const [addList, mutation] = useMutation<
    { addList: AddListPayload },
    { url: string }
  >(AddListMutation, {
    variables: { url: url },
    update(cache, r) {
      cache.modify({
        fields: {
          lists(existing: { __ref: string }[] = []) {
            const listRef = cache.identify({
              __typename: 'ImdbList',
              id: r.data?.addList.list.id,
            });
            if (existing.some((x) => x.__ref == listRef)) {
              return existing;
            }

            return [...existing, { __ref: listRef }];
          },
        },
      });
    },
  });

  const addToList = async () => {
    try {
      const r = await addList();
      if (!r.errors) {
        setUrl('');
        setErr(undefined);
      } else {
        setErr(r.errors[0]?.message);
      }
    } catch (err) {
      setErr(String(err));
    }
  };

  return (
    <div tw="flex flex-col gap-2">
      <span css={[tw`text-base text-center text-red-500`, !err && tw`hidden`]}>
        {err}
      </span>
      <div tw="flex flex-row gap-4 justify-between">
        <input
          tw="border rounded border-gray-400 flex-grow"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          onKeyPress={(e) => e.key === 'Enter' && addToList()}
          disabled={mutation.loading}
        ></input>

        <button
          onClick={addToList}
          disabled={mutation.loading}
          tw="self-center disabled:opacity-50 disabled:cursor-default py-2 px-4 border-2 border-blue-800 text-blue-800 bg-blue-50 rounded uppercase font-semibold hover:border-blue-600 hover:text-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
}
