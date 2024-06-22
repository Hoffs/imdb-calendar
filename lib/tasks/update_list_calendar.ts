import { ImdbList } from 'lib/server/types';
import { FirebaseDb } from 'lib/server/firebase';
import { getDetails, updateTmdbIds } from 'lib/imdb/tmdb';
import { buildCalendar } from 'lib/calendar/builder';
import { CtxLogger } from 'lib/server/logger';
import { getTitleList, getWatchList } from 'lib/server/imdb-graphql';

export async function updateCalendar(
  id: string,
  list: ImdbList,
  logger: CtxLogger,
  db: FirebaseDb,
): Promise<void> {
  logger.info('updating calendar');

  const listData = list.is_watchlist
    ? await getWatchList(id)
    : await getTitleList(id);

  logger.infoCtx(
    { listName: listData.name, listTotal: listData.total },
    'got response',
  );

  const newList: { [key: string]: string } = {};
  for (const id of listData.title_ids) {
    newList[id] = list.item_ids[id] || ''; // If it exists, we get TMDB id, if not, it remains empty.
  }

  list.name = listData.name;
  list.item_ids = newList;

  await db.updateImdbList(id, {
    name: list.name,
    item_ids: list.item_ids,
  });

  logger.info('updating list with TMDB ids');

  await updateTmdbIds(list, logger);

  await db.updateImdbList(id, {
    item_ids: list.item_ids,
  });

  logger.info('getting details about list items');

  const entries = [];
  for (const id of Object.keys(list.item_ids)) {
    const tmdbId = list.item_ids[id];
    if (!tmdbId) {
      continue;
    }

    // TODO(improvement): It would be nice to cache details, at least for lifetime of update task
    const idEntries = await getDetails(tmdbId, id, logger);
    entries.push(...idEntries);
  }

  logger.infoCtx(
    { entries_count: entries.length.toString() },
    'creating calendar',
  );

  const cal = buildCalendar(list.name, entries);

  logger.info('storing calendar to bucket');

  const file = db.storage.bucket().file(id);
  await file.save(cal, {
    contentType: 'text/calendar',
    public: true,
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=60',
    },
  });

  list.url = file.publicUrl();

  await db.updateImdbList(id, {
    url: list.url,
  });

  logger.infoCtx({ url: list.url }, 'updated calendar');
}
