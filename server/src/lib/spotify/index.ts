import { Artist, Client, Track } from 'spotify-api.js';
import env from '../../env';

let client: Client;
const popularMarkets: string[] = ['CA', 'MX', 'GB', 'DE', 'JP', 'BR'];

export default class SpotifyClient {
  static connect = async () => {
    client = await Client.create({
      token: { clientID: env.spotify.clientId, clientSecret: env.spotify.clientSecret },
      retryOnRateLimit: true,
      refreshToken: true,
    });
  };

  static getArtist = async (name: string, market?: string): Promise<Artist | undefined> => {
    const results = await client.artists.search(
      `artist:${name.replace("'", '').substring(0, 92)}`,
      { limit: 50 },
    );
    for (const artist of results) {
      if (artist.name.toLowerCase() === name.toLowerCase()) {
        return artist;
      }
    }
    if (market) return;
    for (const artistMarket of popularMarkets) {
      const artist = await this.getArtist(name, artistMarket);
      if (artist) return artist;
    }
  };

  static getTrack = async (
    title: string,
    artist: string,
    market?: string,
  ): Promise<Track | undefined> => {
    const results = await client.tracks.search(
      `artist:${artist.replace("'", '').substring(0, 25)} track:${title
        .replace("'", '')
        .substring(0, 60)}`,
      { limit: 50, market },
    );
    for (const track of results) {
      if (
        track.name.toLowerCase() == title.toLowerCase() &&
        track.artists.map(a => a.name.toLowerCase()).includes(artist.toLowerCase())
      ) {
        return track;
      }
    }
    if (market) return;
    for (const trackMarket of popularMarkets) {
      const track = await this.getTrack(title, artist, trackMarket);
      if (track) return track;
    }
  };
}
