import { ImdbList } from 'lib/server/types';
import { CalendarEntry } from 'lib/calendar/builder';

const API = 'https://api.themoviedb.org/3';
const HEADERS = {
  headers: {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json;charset=utf-8',
  },
};

export async function updateTmdbIds(list: ImdbList): Promise<void> {
  const toCheck = Object.keys(list.item_ids).filter((id) => !list.item_ids[id]);
  for (const id of toCheck) {
    if (!id) {
      continue;
    }

    const r = await fetch(
      `${API}/find/${id}?language=en-US&external_source=imdb_id`,
      HEADERS
    );

    if (!r.ok) {
      // NOTE: Unsure, maybe throw instead?
      continue;
    }

    const json = await r.json();
    const movies = json.movie_results;
    const tv = json.tv_results;
    if (movies && Array.isArray(movies) && movies.length > 0) {
      list.item_ids[id] = `movie:${movies[0].id}`;
    } else if (tv && Array.isArray(tv) && tv.length > 0) {
      list.item_ids[id] = `tv:${tv[0].id}`;
    }
  }
}

export function getDetails(
  id: string,
  imdbId: string
): Promise<CalendarEntry[]> {
  const [type, tmdb_id] = id.split(':', 2);
  if (type === 'movie') {
    return getMovieDetails(tmdb_id, imdbId);
  } else if (type === 'tv') {
    return getTvDetails(tmdb_id, imdbId);
  }

  throw new Error(`Invalid ID received: ${id}`);
}

async function getMovieDetails(
  id: string,
  imdbId: string
): Promise<CalendarEntry[]> {
  const r = await fetch(`${API}/movie/${id}`, HEADERS);

  if (!r.ok) {
    // NOTE: Should throw?
    return [];
  }

  const json = await r.json();

  if (!json.release_date) {
    // If theres no release date - skip.
    return [];
  }

  const summary = json.title || 'N/A';
  const description = json.overview || '';

  return [
    {
      summary,
      description,
      url: `https://www.imdb.com/title/${imdbId}/`,
      date: new Date(json.release_date),
    },
  ];
}

async function getTvDetails(
  id: string,
  imdbId: string
): Promise<CalendarEntry[]> {
  const r = await fetch(`${API}/tv/${id}`, HEADERS);

  if (!r.ok) {
    // NOTE: Should throw?
    return [];
  }

  const tvJson = await r.json();
  const tvSeasons = tvJson.seasons;
  const tvName = typeof tvJson.name === 'string' ? tvJson.name : '';

  if (!tvSeasons || !Array.isArray(tvSeasons)) {
    return [];
  }

  const entries = [];

  for (const s of tvSeasons) {
    const seasonNumber = s.season_number;
    if (typeof seasonNumber !== 'number') {
      continue;
    }

    const seasonEps = await getTvSeasonDetails(
      id,
      seasonNumber,
      tvName,
      imdbId
    );
    entries.push(...seasonEps);
  }

  return entries;
}

async function getTvSeasonDetails(
  id: string,
  seasonNumber: number,
  tvName: string,
  imdbId: string
): Promise<CalendarEntry[]> {
  const r = await fetch(`${API}/tv/${id}/season/${seasonNumber}`, HEADERS);

  if (!r.ok) {
    // NOTE: Should throw?
    return [];
  }

  const json = await r.json();
  const eps = json.episodes;
  if (!eps || !Array.isArray(eps)) {
    return [];
  }

  const entries = [];
  for (const ep of eps) {
    if (!ep.air_date) {
      // If theres no release date - skip.
      continue;
    }

    const summary = `[${tvName}] ${ep.name || 'N/A'}`;
    const description = ep.overview || '';

    entries.push({
      summary,
      description,
      url: `https://www.imdb.com/title/${imdbId}/episodes?season=${seasonNumber}`,
      date: new Date(ep.air_date),
    });
  }

  return entries;
}
