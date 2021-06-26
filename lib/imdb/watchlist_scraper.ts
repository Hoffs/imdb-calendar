// source of watchlist pages contain 'IMDbReactInitialState.push({});' that has all the information about the titles
// in the watchlist. Even though the watchlist might be paginated, this seems to still have information of all entries.
// So the idea is to find 'IMDbReactInitialState.push', take substring from that until ';' and parse out ids.
const watchlistLookup = 'IMDbReactInitialState.push';
function parseWatchlist(pageText: string): {
  name: string;
  item_ids: string[];
} {
  let pos = pageText.indexOf(watchlistLookup, 0);
  while (pos !== -1) {
    const openParens = pageText.indexOf('({', pos);
    if (openParens !== -1) {
      const closeParens = pageText.indexOf('});', pos);
      if (closeParens !== -1) {
        const content = JSON.parse(
          pageText.substring(openParens + 1, closeParens + 1)
        );
        if (content?.list && Array.isArray(content.list.items)) {
          const name = content.list.name;
          const ids = [];
          for (const it of content.list.items) {
            if (it.const && typeof it.const === 'string') {
              ids.push(it.const);
            }
          }

          return { name, item_ids: ids };
        }
      }
    }

    pos = pageText.indexOf(watchlistLookup, pos);
  }

  return { name: '', item_ids: [] };
}

export default { scrape: parseWatchlist };
