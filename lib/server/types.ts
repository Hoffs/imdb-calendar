export interface User {
  imdb_lists: string[];
}

export interface ImdbList {
  // ID doesn't exist on the firebase type, but is rather a key
  name?: string;
  is_watchlist: boolean;
  last_updated?: Date;
  url?: string;
  item_ids: {
    [imdb_id: string]: string;
  };
  users: string[];
}
