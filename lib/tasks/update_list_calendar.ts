import Scraper from 'lib/imdb/scraper';
import { ImdbList } from 'lib/server/types';
import firebase, { updateImdbList } from 'lib/server/firebase';
import { getDetails, updateTmdbIds } from 'lib/imdb/tmdb';
import { buildCalendar } from 'lib/calendar/builder';
import { CtxLogger } from 'lib/server/logger';

export async function updateCalendar(
  id: string,
  list: ImdbList,
  logger: CtxLogger
): Promise<void> {
  logger.info('updating calendar');
  const { name, item_ids } = await Scraper.scrape(id, list, logger);

  list.name = name;
  list.item_ids = item_ids;

  await updateImdbList(id, {
    name: list.name,
    item_ids: list.item_ids,
  });

  await updateTmdbIds(list, logger);

  await updateImdbList(id, {
    item_ids: list.item_ids,
  });

  const entries = [];
  for (const id of Object.keys(list.item_ids)) {
    const tmdbId = list.item_ids[id];
    if (!tmdbId) {
      continue;
    }

    const idEntries = await getDetails(tmdbId, id, logger);
    entries.push(...idEntries);
  }

  logger.infoCtx(
    { entries_count: entries.length.toString() },
    'creating calendar'
  );

  const cal = buildCalendar(list.name, entries);

  logger.info('storing calendar to bucket');

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

  await updateImdbList(id, {
    url: list.url,
  });

  logger.info('updated calendar');
}
