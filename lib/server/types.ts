export interface User {
  name: string;
  calendar_refresh_token: string;
  imdb_lists: string[];
}

export interface ImdbList {
  name: string;
  last_updated: Date;
  tmdb_ids: string[];
}
