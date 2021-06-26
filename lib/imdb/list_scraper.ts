// source of list pages contains script section that has json enmbedded with the full list.
// Even if it reaches the limit where pagination kicks in
// the json still contains all entries.
const listLookup = '<script type="application/ld+json">';
const listLookupEnd = '</script>';

function parseList(pageText: string): { name: string; item_ids: string[] } {
  let pos = pageText.indexOf(listLookup, 0);
  while (pos !== -1) {
    const end = pageText.indexOf(listLookupEnd, pos);
    if (end !== -1) {
      const content = JSON.parse(
        pageText.substring(pos + listLookup.length, end)
      );

      const name = content.name;
      if (!name || typeof name !== 'string') {
        continue;
      }

      const listEls = content.about?.itemListElement;
      if (listEls && Array.isArray(listEls)) {
        const ids = [];
        for (const e of listEls) {
          // "url": "/title/tt0469021/"
          const url = e.url;
          if (url && typeof url === 'string') {
            const id = url.replaceAll(/title|\//g, '');
            ids.push(id);
          }
        }

        return { name: name || '', item_ids: ids };
      }
    }

    pos = pageText.indexOf(listLookup, pos);
  }

  return { name: '', item_ids: [] };
}

export default { scrape: parseList };
