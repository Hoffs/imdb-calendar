import { ImdbList } from 'lib/server/types';
import LinkUtils from './link_utils';
import ListScraper from 'lib/imdb/list_scraper';
import WatchlistScraper from 'lib/imdb/watchlist_scraper';

type ParsedList = {
  name: string;
  item_ids: {
    [id: string]: string;
  };
};

async function scrape(id: string, list: ImdbList): Promise<ParsedList> {
  const url = LinkUtils.getUrl(id, list.is_watchlist);

  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Failed to get page ${url}`);
  }

  const text = await r.text();

  const parsed = list.is_watchlist
    ? WatchlistScraper.scrape(text)
    : ListScraper.scrape(text);

  const updated: { [imdb_id: string]: string } = {};
  for (const id of parsed.item_ids) {
    updated[id] = list.item_ids[id] || ''; // If it exists, we get TMDB id, if not, it remains empty.
  }

  return { name: parsed.name, item_ids: updated };
}

export default { scrape };
