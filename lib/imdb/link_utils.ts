const listUrl = (id: string): string => `https://www.imdb.com/list/${id}`;

const watchlistUrl = (id: string): string =>
  `https://www.imdb.com/user/${id}/watchlist`;

const getUrl = (id: string, isWatchlist: boolean): string =>
  isWatchlist ? watchlistUrl(id) : listUrl(id);

export default { getUrl, getWatchlistUrl: watchlistUrl, getListUrl: listUrl };
