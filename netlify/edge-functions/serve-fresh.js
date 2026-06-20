/**
 * Edge function that intercepts the root HTML request and strips
 * all caching headers, forcing Netlify CDN to never cache index.html.
 * Runs at the edge before the CDN cache — this is the only reliable
 * way to ensure fresh HTML on every request for a Vite SPA on Netlify.
 */
export default async (request, context) => {
  const response = await context.next();
  
  // Only intercept HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Return a new response with cache-busting headers
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  newResponse.headers.set('Pragma', 'no-cache');
  newResponse.headers.set('Expires', '0');
  newResponse.headers.set('Surrogate-Control', 'no-store');
  newResponse.headers.delete('ETag');
  newResponse.headers.delete('Last-Modified');
  return newResponse;
};

export const config = {
  path: ["/*"],
  excludedPath: ["/assets/*", "/*.js", "/*.css", "/*.png", "/*.svg", "/*.ico", "/*.json"],
};
