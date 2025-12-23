import { Artist, Market, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import env from '../../env.js';
import pLimit, { LimitFunction } from 'p-limit';

const MAX_RETRIES = 15;

export default class SpotifyClient {
  private static client: SpotifyApi;
  private static sleepFor: number;
  private static trackLimit = pLimit(4);
  private static artistLimit = pLimit(4);
  private static popularMarkets: Market[] = ['CA', 'MX', 'GB', 'DE', 'JP', 'BR'];

  static connect = async () => {
    this.client = SpotifyApi.withClientCredentials(
      env.spotify.clientId,
      env.spotify.clientSecret,
      [],
      {
        afterRequest: (_, __, response) => {
          if (response.status === 429) {
            this.sleepFor = parseInt(response.headers.get('Retry-After') ?? '1') * 1000;
          }
        },
      },
    );
    await this.client.authenticate();
  };

  static getArtistsById = async (ids: string[]): Promise<Artist[]> => {
    return SpotifyClient.request(this.artistLimit, () => this.client.artists.get(ids));
  };

  static getTrack = async (
    title: string,
    artist: string,
    market?: Market,
  ): Promise<Track | undefined> => {
    const results = await SpotifyClient.request(this.trackLimit, () =>
      this.client.search(
        `artist:${artist.replace("'", '').substring(0, 25)} track:${title
          .replace("'", '')
          .substring(0, 60)}`,
        ['track'],
        market,
        50,
      ),
    );

    if (results == null) {
      return await this.getTrack(title, artist, market);
    }

    for (const track of results.tracks.items) {
      if (
        track.name.toLowerCase() == title.toLowerCase() &&
        track.artists.map(a => a.name.toLowerCase()).includes(artist.toLowerCase())
      ) {
        return track;
      }
    }
    if (market) return;
    for (const trackMarket of this.popularMarkets) {
      const track = await this.getTrack(title, artist, trackMarket);
      if (track) return track;
    }
  };

  private static async request<T>(limiter: LimitFunction, req: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        return await limiter(req);
      } catch (err) {
        if (err instanceof Error && (err as Error).message.includes('rate limits')) {
          if (SpotifyClient.sleepFor > 0) {
            await new Promise(resolve => setTimeout(resolve, SpotifyClient.sleepFor));
            attempt++;
          }
        } else {
          throw err;
        }
      }
    }

    throw new Error('Max retries exceeded for Spotify API request');
  }
}
