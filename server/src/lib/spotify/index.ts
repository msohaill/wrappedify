import { Artist, Market, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import env from '../../env.js';
import pLimit from 'p-limit';

export default class SpotifyClient {
  private static client: SpotifyApi;
  private static sleepFor: number;
  private static limit = pLimit(8);
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
        errorHandler: new (class ErrorHandler {
          public async handleErrors(error: Error): Promise<boolean> {
            if (error.message.includes('rate limits')) {
              if (SpotifyClient.sleepFor > 0) {
                await new Promise(resolve => setTimeout(resolve, SpotifyClient.sleepFor));
                return true;
              }
            }
            return false;
          }
        })(),
      },
    );
    await this.client.authenticate();
  };

  static getArtist = async (name: string, market?: Market): Promise<Artist | undefined> => {
    const results = await this.limit(() =>
      this.client.search(
        `artist:${name.replace("'", '').substring(0, 92)}`,
        ['artist'],
        market,
        50,
      ),
    );

    if (results == null) {
      return await this.getArtist(name, market);
    }

    for (const artist of results.artists.items) {
      if (artist.name.toLowerCase() === name.toLowerCase()) {
        return artist;
      }
    }
    if (market) return;
    for (const artistMarket of this.popularMarkets) {
      const artist = await this.getArtist(name, artistMarket);
      if (artist) return artist;
    }
  };

  static getTrack = async (
    title: string,
    artist: string,
    market?: Market,
  ): Promise<Track | undefined> => {
    const results = await this.limit(() =>
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
}
