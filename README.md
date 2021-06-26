# IMDB Calendar

IMDB List (or watchlist) to iCal with regular updates.

The iCal is provided as an URL that can be added as online calendar to many services. The iCal is then regularly updated, these updates are then automatically picked up by the calendar software (Google Calendars updates around every 24 hours).

![App](/main.jpg 'Screenshot')

## Architecture

Utilizes Firebase as a database (Firestore), file storage and authentication provider. Authentication uses simple email links and does not require any passwords.

Once authenticated user is able to add IMDB lists or watchlists, which are verified and if valid, added to the Firestore.

Periodically special API endpoint is called to update all stored lists. If list has 0 users assigned - list and iCal are deleted. Otherwise, list page is retrieved, IMDB ID's are parsed out of the page content, TMDB API is used to find TMDB equivelent ID's. Using TMDB ID's release dates for movies and air dates for TV shows are retrieved. After that iCal is generated and stored in Firebase.

External CRON (or similar) service has to be used to call Tasks API with secret token.

## Data Structure

```
{
  users: {
    [email]: {
      imdb_lists: String[],
    }
  },

  imdb_lists: {
    [list_id]: {
      name?: string,
      is_watchlist?: string,
      url?: string,
      item_ids: {
        [string(imdb_id)]: [string(tmdb_id)]
      },
      users: string[],
    }
  }
}
```

## ENV Configuration

```
FIREBASE_DATABASE_URL=https://{app_id}.firebaseapp.com
FIREBASE_STORAGE_BUCKET={app_id}.appspot.com
TMDB_API_KEY={https://developers.themoviedb.org/3/getting-started/authorization}
# Secret token to call /api/tasks
TASK_SECRET_TOKEN={some string}
# Firebase Client credentials
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# Firebase Admin SDK Service Account Private Key
FIREBASE_SVC_PROJECT_ID=
FIREBASE_SVC_CLIENT_EMAIL=
FIREBASE_SVC_PRIVATE_KEY=
```

## Nice to have

Would be nice to add some external logging service, e.g. [Logflare](https://logflare.app/).

Some data access in Firebase might not be very efficient and some failure cases are not tested.

Unit tests.
