const SPOTIFY_HOST = "i.scdn.co";

function trusted(value) {
  try {
    const url = new URL(value || "");
    const host = url.hostname.toLowerCase();

    const spotify =
      host === SPOTIFY_HOST ||
      host.endsWith(".spotifycdn.com");

    const steam =
      host.endsWith(".steamstatic.com") ||
      host === "steamcdn-a.akamaihd.net";

    return url.protocol === "https:" && (spotify || steam)
      ? url
      : null;
  } catch {
    return null;
  }
}

const json = (data, status) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  }
});

export async function handleArtwork(request, ctx) {
  if (request.method !== "GET") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const requestUrl = new URL(request.url);
  const source = trusted(requestUrl.searchParams.get("url"));

  if (!source) {
    return json({ success: false, error: "Invalid artwork URL" }, 400);
  }

  const cache = caches.default;
  const key = new Request(requestUrl.href, { method: "GET" });
  const cached = await cache.match(key);
  if (cached) return cached;

  let upstream;

  try {
    upstream = await fetch(source.href, {
      headers: {
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      redirect: "follow"
    });
  } catch {
    return json({ success: false, error: "Artwork fetch failed" }, 502);
  }

  const type = upstream.headers.get("Content-Type") || "";

  if (!upstream.ok || !type.toLowerCase().startsWith("image/")) {
    return json({ success: false, error: "Artwork unavailable" }, 502);
  }

  const response = new Response(upstream.body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control":
        "public, max-age=604800, s-maxage=2592000, immutable",
      "Content-Type": type,
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    }
  });

  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}
