export const listUrl = (id: string): string =>
  `https://www.imdb.com/list/${id}`;
export const watchlistUrl = (id: string): string =>
  `https://www.imdb.com/user/${id}/watchlist`;

export const isValidList = async (id: string): Promise<boolean> => {
  return isValid(listUrl(id));
};

export const isValidWatchlist = async (id: string): Promise<boolean> => {
  return isValid(watchlistUrl(id));
};

const isValid = async (url: string): Promise<boolean> => {
  const r = await fetch(url);
  if (!r.ok) {
    return false;
  }

  const data = await r.text();
  // super rough way to check

  return !data.includes("id='unavailable'");
};
