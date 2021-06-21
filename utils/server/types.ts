export interface User {
  name: String;
  calendar_refresh_token: String;
  imdb_lists: String[];
}

export interface ImdbList {
  name: String;
  last_updated: Date;
  tmdb_ids: String[];
}
