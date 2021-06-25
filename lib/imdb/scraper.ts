import { ImdbList } from 'lib/server/types';
import { listUrl, watchlistUrl } from './list';

type ParsedList = {
  name: string;
  item_ids: {
    [id: string]: string;
  };
};

export async function scrapeList(
  id: string,
  list: ImdbList
): Promise<ParsedList> {
  const url = list.is_watchlist ? watchlistUrl(id) : listUrl(id);

  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Failed to get page ${url}`);
  }

  const text = await r.text();

  const parsed = list.is_watchlist ? parseWatchlist(text) : parseList(text);

  const updated: { [imdb_id: string]: string } = {};
  for (const id of parsed.item_ids) {
    updated[id] = list.item_ids[id] || ''; // if it exists, we get TMDB id, if not, it remains empty.
  }

  return { name: parsed.name, item_ids: updated };
}

const listLookup = '<script type="application/ld+json">';
const listLookupEnd = '</script>';
function parseList(pageText: string): { name: string; item_ids: string[] } {
  // source of list pages contains script section that has json enmbedded with the full list.
  // Even if it reaches the limit where pagination kicks in
  // the json still contains all entries.
  const ids: string[] = [];
  let name: string | undefined;

  let pos = pageText.indexOf(listLookup, 0);
  while (pos !== -1) {
    const end = pageText.indexOf(listLookupEnd, pos);
    if (end !== -1) {
      const content = JSON.parse(
        pageText.substring(pos + listLookup.length, end)
      );

      name = content.name;

      const listEls = content.about?.itemListElement;
      if (listEls && Array.isArray(listEls)) {
        for (const e of listEls) {
          // "url": "/title/tt0469021/"
          const url = e.url;
          if (url && typeof url === 'string') {
            const id = url.replaceAll(/title|\//g, '');
            ids.push(id);
          }
        }
      }
    }

    if (ids.length > 0) {
      break;
    }

    pos = pageText.indexOf(watchlistLookup, pos);
  }

  return { name: name || '', item_ids: ids };
}

const watchlistLookup = 'IMDbReactInitialState.push';
function parseWatchlist(pageText: string): {
  name: string;
  item_ids: string[];
} {
  // source of watchlist pages contain 'IMDbReactInitialState.push({})' that has all the information about the titles
  // in the watchlist. Even though the watchlist might be paginated, this seems to still have information of all entries.
  // So the idea is to find 'IMDbReactInitialState.push', take substring from that until ';' and parse out ids.
  //"list":
  //
  const ids: string[] = [];
  let name: string | undefined;

  let pos = pageText.indexOf(watchlistLookup, 0);
  while (pos !== -1) {
    const openParens = pageText.indexOf('(', pos);
    if (openParens !== -1) {
      const closeParens = pageText.indexOf(')', pos);
      if (closeParens !== -1) {
        const content = JSON.parse(
          pageText.substring(openParens + 1, closeParens)
        );
        if (content?.list && Array.isArray(content.list.items)) {
          name = content.list.name;
          for (const it of content.list.items) {
            if (it.const && typeof it.const === 'string') {
              ids.push(it.const);
            }
          }
        }
      }
    }

    if (ids.length > 0) {
      break;
    }

    pos = pageText.indexOf(watchlistLookup, pos);
  }

  return { name: name || '', item_ids: ids };
}
