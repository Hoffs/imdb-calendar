# IMDB Calendar

IMDB List (Watchlist) to Google Calendar with regular updates.

Creates a Google Calendar that contains events for all Movie and TV Show releases.

# Idea

Authenticate using ~~Google (Calendar)~~ Firebase Auth?.
Store user selected/subscribed playlists in Firestore.
Create iCal files and store in firebase. Provide URL to user.

```
{
  users: {
    [id]: {
      name: String,
      calendar_refresh_token: String,
      imdb_lists: String[],
    }
  },

  imdb_lists: {
    [list_id/url]: {
      name: String,
      last_updated: DateTime,
      tmdb_ids: String[],
    }
  }
}
```
