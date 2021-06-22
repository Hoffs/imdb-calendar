export const isValidList = async (id: string): Promise<boolean> => {
  const url = `https://www.imdb.com/list/${id}`;
  return isValid(url);
};

export const isValidWatchlist = async (id: string): Promise<boolean> => {
  const url = `https://www.imdb.com/user/${id}/watchlist`;
  return isValid(url);
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
