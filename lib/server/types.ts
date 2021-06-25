export interface User {
  imdb_lists: string[];
}

export interface ImdbList {
  // id doesn't exist on the firebase type, but is rather a key
  name?: string;
  is_watchlist: boolean;
  last_updated?: Date;
  removed: boolean; // whether it should be cleaned up. has to make sure that no other users track it.
  url?: string;
  item_ids: {
    [imdb_id: string]: string;
  };
}
