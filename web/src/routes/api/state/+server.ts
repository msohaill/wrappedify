import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const updateKeys: string[] = await request.json();
  updateKeys.forEach(key => cookies.set(key, 'true', { path: '/' }));
  return new Response();
};
