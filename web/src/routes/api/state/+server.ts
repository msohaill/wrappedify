import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const updateKeys: string[] = await request.json();
  updateKeys.forEach(key => cookies.set(key, 'true', { path: '/', maxAge: 2592000 }));
  return new Response();
};
