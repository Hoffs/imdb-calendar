// Scrape IMDB List,
// Update Firestore
// Fetch TMDB Id's for the list
// Update Firestore
// Fetch TMDB items and create calendar
//

import { scrapeList } from 'lib/imdb/scraper';
import { ImdbList } from 'lib/server/types';
import firebase, { imdbLists } from 'lib/server/firestore';
import { getDetails, updateTmdbIds } from 'lib/imdb/tmdb';
import { buildCalendar } from 'lib/calendar/builder';

export async function createListCalendar(
  id: string,
  list: ImdbList
): Promise<void> {
  const { name, item_ids } = await scrapeList(id, list);

  list.name = name;
  list.item_ids = item_ids;

  await imdbLists.doc(id).update({
    name: list.name,
    item_ids: list.item_ids,
  });

  await updateTmdbIds(list);
  await imdbLists.doc(id).update({
    item_ids: list.item_ids,
  });

  const entries = [];
  for (const id of Object.keys(list.item_ids)) {
    const tmdbId = list.item_ids[id];
    if (!tmdbId) {
      continue;
    }

    const idEntries = await getDetails(tmdbId, id);
    entries.push(...idEntries);
  }

  const cal = buildCalendar(list.name, entries);

  const file = firebase.storage().bucket().file(id);
  await file.save(cal, {
    contentType: 'text/calendar',
    public: true,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=60',
    },
  });

  list.url = file.publicUrl();

  await imdbLists.doc(id).update({
    url: list.url,
  });
}
