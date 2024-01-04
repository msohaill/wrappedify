import { CLIENT_SECRET as clientSecret } from '$env/static/private';
import {
  PUBLIC_CLIENT_ID as clientID,
  PUBLIC_REDIRECT_URL as redirectURL,
} from '$env/static/public';
import playlistCover from '$static/playlistcover.jpg?base64';
import { type RequestHandler } from '@sveltejs/kit';
import { Client } from 'spotify-api.js';

export const POST: RequestHandler = async ({ request }) => {
  const { code, trackURIs }: { code: string; trackURIs: string[] } = await request.json();

  try {
    const client = await Client.create({ token: { clientID, clientSecret, code, redirectURL } });
    const playlist = await client.user.createPlaylist({
      name: 'Your Top Songs of the Year',
      description: `Your top songs for ${new Date().getFullYear()}, courtesy of Wrappedify.`,
    });

    if (playlist) {
      await client.playlists.addItems(playlist.id, trackURIs);
      await client.playlists.uploadImage(playlist.id, playlistCover);
    }
    return new Response();
  } catch (e) {
    return new Response(JSON.stringify({ error: e }), { status: 500 });
  }
};
