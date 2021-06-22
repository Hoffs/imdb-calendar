export interface ImdbList {
  id: string;
  name?: string;
  url?: string;
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
  Buffer.from(`ImdbList_${id}`).toString('base64');
  const decoded = Buffer.from(id, 'base64').toString('ascii');
  if (!decoded.startsWith(ImdbListPrefix)) {
    return undefined;
  }

  return decoded.substring(ImdbListPrefix.length);
};
