import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, url }) => {
  const hasUploaded = cookies.get('hasUploaded') === 'true';
  const hasRetrievedInfo = cookies.get('hasRetrievedInfo') === 'true';

  if (url.pathname === '/your-data' && !hasRetrievedInfo) {
    redirect(302, '/');
  } else if (url.pathname === '/processing' && !hasUploaded) {
    redirect(302, '/');
  } else if (url.pathname === '/processing' && hasRetrievedInfo) {
    redirect(302, '/your-data');
  } else if (url.pathname === '/start' && hasUploaded) {
    redirect(302, '/processing');
  }

  return {
    pathname: url.pathname,
  };
};
