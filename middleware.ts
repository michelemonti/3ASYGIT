export const config = {
  matcher: '/',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('u');
  
  // If no username, just pass through
  if (!username) {
    return;
  }
  
  // For requests from crawlers/bots, serve modified HTML with dynamic OG tags
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /bot|crawl|spider|facebook|twitter|linkedin|slack|discord|telegram|whatsapp/i.test(userAgent);
  
  if (isCrawler) {
    // Redirect to the OG HTML endpoint
    return Response.redirect(new URL(`/api/og-html?u=${username}`, request.url), 302);
  }
  
  return;
}
