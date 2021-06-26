// GraphQL version of ImdbList
export interface ImdbList {
  id: string;
  name?: string;
  url?: string;
  imdb_id: string;
  is_watchlist: boolean;
  last_updated?: Date;
}

export interface AddListInput {
  url: string;
}

export interface AddListPayload {
  list: ImdbList; // technically, this could probably be optional in some sense
}

export interface RemoveListInput {
  id: string;
}

export interface RemoveListPayload {
  id: string;
}

const ImdbListPrefix = 'ImdbList_';

export const encodeImdbListId = (id: string): string =>
  Buffer.from(`${ImdbListPrefix}${id}`).toString('base64');

export const decodeImdbListId = (id: string): string | undefined => {
  const decoded = Buffer.from(id, 'base64').toString('ascii');
  if (!decoded.startsWith(ImdbListPrefix)) {
    return undefined;
  }

  return decoded.substring(ImdbListPrefix.length);
};
