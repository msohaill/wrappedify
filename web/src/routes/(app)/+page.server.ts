import type { PageServerLoad } from './$types';
import { PUBLIC_CLIENT_ID as clientID } from '$env/static/public';
import { CLIENT_SECRET as clientSecret } from '$env/static/private';
import { Client, Track } from 'spotify-api.js';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
  const client = await Client.create({
    token: { clientID, clientSecret },
    retryOnRateLimit: true,
    refreshToken: true,
  });

  const topTracks = await client.playlists.getTracks('37i9dQZF1DXcBWIGoYBM5M');
  const uniqueAlbums = Object.fromEntries(
    topTracks.map(t => [
      (t.track as Track).album?.externalURL.spotify as string,
      {
        url: (t.track as Track).album?.externalURL.spotify as string,
        image: (t.track as Track).album?.images[0].url as string,
        name: (t.track as Track).album?.name as string,
      },
    ]),
  );

  return {
    albums: _.sampleSize(Object.values(uniqueAlbums), 6),
  };
};
