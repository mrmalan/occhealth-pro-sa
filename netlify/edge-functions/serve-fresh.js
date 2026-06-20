/**
 * Edge function: strips caching headers from HTML responses only.
 * Runs before Netlify CDN — prevents index.html from being cached at edge.
 */
export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only handle the root or paths without a file extension (SPA routes)
  // Let all asset requests pass through untouched
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
  if (hasExtension) {
    return context.next();
  }

  const response = await context.next();

  // Double-check we have HTML before modifying
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  newResponse.headers.set('Pragma', 'no-cache');
  newResponse.headers.set('Expires', '0');
  newResponse.headers.delete('ETag');
  newResponse.headers.delete('Last-Modified');
  return newResponse;
};

export const config = {
  path: "/*",
};
