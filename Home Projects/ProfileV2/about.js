/* Live About page data from Discord/Lanyard */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  /*
    Optional future genre endpoint.

    Lanyard gives:
      - current Spotify song
      - artist
      - album
      - track_id

    It does NOT give genres.

    Later, we can make a tiny Cloudflare Worker that accepts the Spotify track_id
    and returns genres from Spotify's API. Put that Worker URL here.
  */
  const GENRE_ENDPOINT = "https://spotify-genres.sparkyfoxer.workers.dev";

  const gamingEl = document.querySelector("#aboutGamingText");
  const musicEl = document.querySelector("#aboutMusicText");
  const genreEl = document.querySelector("#aboutGenreText");

  function cleanText(value) {
    return String(value || "").trim();
  }

  function formatList(items) {
    const clean = items.map(cleanText).filter(Boolean);

    if (clean.length === 0) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;

    return `${clean.slice(0, -1).join(", ")}, and ${clean.at(-1)}`;
  }

  function describeGame(activity) {
    const name = cleanText(activity.name);
    const details = cleanText(activity.details);
    const state = cleanText(activity.state);

    let line = name;

    if (details && state) {
      line += ` — ${details}, ${state}`;
    } else if (details) {
      line += ` — ${details}`;
    } else if (state) {
      line += ` — ${state}`;
    }

    return line;
  }

  function getGameActivities(data) {
    const activities = data?.activities || [];

    return activities.filter((activity) => {
      if (!activity || !activity.name) return false;

      // Ignore custom status
      if (activity.type === 4) return false;

      // Ignore Spotify here because it has its own music card
      if (activity.name.toLowerCase() === "spotify") return false;
      if (activity.type === 2) return false;

      // Normal Discord game/activity
      return true;
    });
  }

  function renderGaming(data) {
    if (!gamingEl) return;

    const games = getGameActivities(data);

    if (!games.length) {
      gamingEl.textContent = "No live game activity showing right now.";
      return;
    }

    const gameText = games.map(describeGame);
    gamingEl.textContent = `Currently: ${formatList(gameText)}`;
  }

  async function fetchGenres(trackId) {
    if (!GENRE_ENDPOINT || !trackId) return [];

    const url = `${GENRE_ENDPOINT}?track_id=${encodeURIComponent(trackId)}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Genre endpoint failed: ${res.status}`);
    }

    const data = await res.json();

    const genres =
      data.genres ||
      data.genre ||
      data.artist_genres ||
      data.tags ||
      [];

    if (typeof genres === "string") return [genres];

    return Array.isArray(genres) ? genres : [];
  }

  async function renderMusic(data) {
    if (!musicEl) return;

    const spotify = data?.spotify;

    if (!spotify) {
      musicEl.textContent = "Nothing showing from Spotify right now.";

      if (genreEl) {
        genreEl.textContent = "Genres appear when Spotify is active.";
      }

      return;
    }

    const song = cleanText(spotify.song);
    const artist = cleanText(spotify.artist);
    const album = cleanText(spotify.album);
    const trackId = cleanText(spotify.track_id);

    musicEl.textContent = `Currently: ${song || "Unknown song"} by ${artist || "Unknown artist"}${album ? ` — ${album}` : ""}`;

    if (!genreEl) return;

    if (!GENRE_ENDPOINT) {
      genreEl.textContent = "Genres need the Spotify genre endpoint added.";
      return;
    }

    try {
      genreEl.textContent = "Genres loading...";

      const genres = await fetchGenres(trackId);

      if (!genres.length) {
        genreEl.textContent = "Genres unavailable for this track.";
        return;
      }

      genreEl.textContent = `Genres: ${formatList(genres.slice(0, 5))}`;
    } catch (err) {
      console.warn("Genre lookup failed:", err);
      genreEl.textContent = "Genres unavailable right now.";
    }
  }

  async function updateAboutLiveData() {
    try {
      const res = await fetch(LANYARD_URL, {
        method: "GET",
        cache: "no-store"
      });

      if (!res.ok) throw new Error(`Lanyard failed: ${res.status}`);

      const json = await res.json();
      const data = json.data;

      renderGaming(data);
      await renderMusic(data);
    } catch (err) {
      console.warn("About live data failed:", err);

      if (gamingEl) gamingEl.textContent = "Live game activity unavailable.";
      if (musicEl) musicEl.textContent = "Live music unavailable.";
      if (genreEl) genreEl.textContent = "Genres unavailable.";
    }
  }

  updateAboutLiveData();
  setInterval(updateAboutLiveData, 30000);
})();
