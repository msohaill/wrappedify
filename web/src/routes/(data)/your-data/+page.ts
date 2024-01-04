import type { ListeningInformation } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = ({ url, fetch }) => {
  const code = url.searchParams.get('code');
  const storedInfo = JSON.parse(localStorage.getItem('wrappedifyListening') as string);
  const info: ListeningInformation = {
    ...storedInfo,
    wrappedDate: new Date(Date.parse(storedInfo.wrappedDate)),
  };

  if (code) {
    fetch('/api/create-playlist', {
      method: 'POST',
      body: JSON.stringify({
        code,
        trackURIs: info.top.tracks.filter(t => t.trackUri).map(t => t.trackUri),
      }),
    });
    return redirect(303, '/your-data');
  }

  return { info };
};
