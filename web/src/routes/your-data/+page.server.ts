import { CLIENT_SECRET as clientSecret } from '$env/static/private';
import {
  PUBLIC_CLIENT_ID as clientID,
  PUBLIC_REDIRECT_URL as redirectURL,
} from '$env/static/public';
import type { ListeningInformation } from '$lib/types';
import playlistCover from '$static/playlistcover.jpg?base64';
import { redirect } from '@sveltejs/kit';
import { Client } from 'spotify-api.js';
import type { PageServerLoad } from './$types';
import testInfo from './test.json';

const testData: ListeningInformation = {
  ...testInfo,
  wrappedDate: new Date(Date.parse(testInfo.wrappedDate)),
};

export const prerender = false;
export const load: PageServerLoad = async event => {
  const code = event.url.searchParams.get('code');
  if (code) {
    const client = await Client.create({ token: { clientID, clientSecret, code, redirectURL } });
    const playlist = await client.user.createPlaylist({
      name: 'Your Top Songs of the Year',
      description: `Your top songs for ${new Date().getFullYear()}, courtesy of Wrappedify.`,
    });

    if (playlist) {
      await client.playlists.addItems(
        playlist.id,
        testData.top.tracks.filter(t => t.trackUri).map(t => t.trackUri as string),
      );
      await client.playlists.uploadImage(playlist.id, playlistCover);
    }

    return redirect(303, '/your-data');
  }
};
