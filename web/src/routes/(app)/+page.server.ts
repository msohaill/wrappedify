import type { PageServerLoad } from './$types';
import { PUBLIC_CLIENT_ID as clientID } from '$env/static/public';
import { CLIENT_SECRET as clientSecret } from '$env/static/private';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
  const client = SpotifyApi.withClientCredentials(clientID, clientSecret);

  const topTracks = (await client.playlists.getPlaylistItems('37i9dQZF1DXcBWIGoYBM5M')).items;
  const uniqueAlbums = Object.fromEntries(
    topTracks.map(t => [
      t.track.album.external_urls.spotify,
      {
        url: t.track.album.external_urls.spotify,
        image: t.track.album.images[0].url,
        name: t.track.album.name,
      },
    ]),
  );

  return {
    albums: _.sampleSize(Object.values(uniqueAlbums), 6),
  };
};
