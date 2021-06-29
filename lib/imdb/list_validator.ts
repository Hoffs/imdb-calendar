import LinkUtils from './link_utils';

const reWatchlist = /^https:\/\/www.imdb.com\/user\/(?<id>\w*)\/watchlist$/;
const reList = /^https:\/\/www.imdb.com\/list\/(?<id>\w*)\/?$/;

type ParsedUrl = [isValid: boolean, id: string, isWatchlist: boolean];

class ListValidator {
  private url: string;
  private id?: string;
  private isWatchlist?: boolean;

  constructor(url: string) {
    this.url = url;
  }

  public parse(): ParsedUrl {
    const clean = this.url.trim().split('?', 1)[0];

    const watchlistMatch = clean.match(reWatchlist);
    const listMatch = clean.match(reList);

    const [id, isWatchlist] = watchlistMatch?.groups?.id
      ? [watchlistMatch.groups.id, true]
      : [listMatch?.groups?.id, false];

    if (!id) {
      return [false, '', false];
    }

    this.id = id;
    this.isWatchlist = isWatchlist;

    return [true, id, isWatchlist];
  }

  public async validate(): Promise<
    [isValid: boolean, error: string | undefined]
  > {
    if (
      typeof this.id === 'undefined' ||
      typeof this.isWatchlist === 'undefined'
    ) {
      throw new Error('URL was not parsed or invalid');
    }

    const fullUrl = LinkUtils.getUrl(this.id, this.isWatchlist);
    const isValidUrl = await ListValidator.isAvailable(fullUrl);
    if (!isValidUrl) {
      if (this.isWatchlist) {
        return [false, 'Watchlist is private or invalid'];
      } else {
        return [false, 'List is private or invalid'];
      }
    }

    return [true, undefined];
  }

  private static async isAvailable(url: string): Promise<boolean> {
    const r = await fetch(url);
    if (!r.ok) {
      return false;
    }

    const data = await r.text();

    // Super rough way to check if there are no errors while accessing list.
    return !data.includes("id='unavailable'");
  }
}

export default ListValidator;
