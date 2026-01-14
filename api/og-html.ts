export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('u') || '';
  
  const ogImageUrl = `https://git.3asy.app/api/og?u=${encodeURIComponent(username)}`;
  const pageUrl = `https://git.3asy.app/?u=${encodeURIComponent(username)}`;
  
  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0a0f" />
    
    <!-- Dynamic Meta Tags -->
    <title>@${username}'s GitHub City | git.3asy.app</title>
    <meta name="title" content="@${username}'s GitHub City | git.3asy.app" />
    <meta name="description" content="Check out @${username}'s GitHub contributions visualized as a 3D cyberpunk city with generative music!" />
    
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:title" content="@${username}'s GitHub City | git.3asy.app" />
    <meta property="og:description" content="Check out @${username}'s GitHub contributions visualized as a 3D cyberpunk city with generative music!" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="git.3asy.app" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@3festo" />
    <meta name="twitter:title" content="@${username}'s GitHub City | git.3asy.app" />
    <meta name="twitter:description" content="Check out @${username}'s GitHub contributions visualized as a 3D cyberpunk city!" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    
    <!-- Redirect to actual app -->
    <meta http-equiv="refresh" content="0;url=${pageUrl}" />
  </head>
  <body>
    <p>Redirecting to <a href="${pageUrl}">@${username}'s GitHub City</a>...</p>
  </body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
