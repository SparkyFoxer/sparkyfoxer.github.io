/* Live About page data from Discord/Lanyard */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  // Keep disabled until the Spotify genre Worker credentials are fixed.
  const GENRE_ENDPOINT = "";

  const MUSIC_HISTORY_KEY = "sparky_about_last_played_spotify_v1";
  const MAX_HISTORY = 6;

  const gamingEl = document.querySelector("#aboutGamingText");
  const musicEl = document.querySelector("#aboutMusicText");
  const genreEl = document.querySelector("#aboutGenreText");
  const lastPlayedEl = document.querySelector("#aboutLastPlayedList");

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
      if (activity.type === 4) return false;
      if (activity.name.toLowerCase() === "spotify") return false;
      if (activity.type === 2) return false;

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

    gamingEl.textContent = `Currently: ${formatList(games.map(describeGame))}`;
  }

  function getMusicHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MUSIC_HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveMusicHistory(history) {
    localStorage.setItem(MUSIC_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  function addTrackToHistory(track) {
    if (!track.trackId && !track.song) return;

    const history = getMusicHistory();

    const key = track.trackId || `${track.song}-${track.artist}-${track.album}`;

    const filtered = history.filter((item) => {
      const itemKey = item.trackId || `${item.song}-${item.artist}-${item.album}`;
      return itemKey !== key;
    });

    const updated = [
      {
        ...track,
        seenAt: new Date().toISOString()
      },
      ...filtered
    ].slice(0, MAX_HISTORY);

    saveMusicHistory(updated);
    renderMusicHistory(updated);
  }

  function formatSeenTime(iso) {
    if (!iso) return "";

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date);
  }

  function renderMusicHistory(history = getMusicHistory()) {
    if (!lastPlayedEl) return;

    lastPlayedEl.innerHTML = "";

    if (!history.length) {
      const li = document.createElement("li");
      li.textContent = "No songs seen yet.";
      lastPlayedEl.appendChild(li);
      return;
    }

    for (const item of history) {
      const li = document.createElement("li");

      const main = document.createElement("span");
      main.className = "track-main";
      main.textContent = `${item.song || "Unknown song"} — ${item.artist || "Unknown artist"}`;

      const meta = document.createElement("span");
      meta.className = "track-meta";

      const parts = [];

      if (item.album) parts.push(item.album);

      const seen = formatSeenTime(item.seenAt);
      if (seen) parts.push(`seen ${seen}`);

      meta.textContent = parts.join(" • ");

      li.appendChild(main);

      if (meta.textContent) {
        li.appendChild(meta);
      }

      lastPlayedEl.appendChild(li);
    }
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
        genreEl.textContent = "";
      }

      renderMusicHistory();
      return;
    }

    const song = cleanText(spotify.song);
    const artist = cleanText(spotify.artist);
    const album = cleanText(spotify.album);
    const trackId = cleanText(spotify.track_id);

    musicEl.textContent =
      `${song || "Unknown song"} — ${artist || "Unknown artist"}${album ? ` • ${album}` : ""}`;

    addTrackToHistory({
      trackId,
      song,
      artist,
      album
    });

    if (!genreEl) return;

    if (!GENRE_ENDPOINT) {
      genreEl.textContent = "";
      return;
    }

    try {
      genreEl.textContent = "";

      const genres = await fetchGenres(trackId);

      if (!genres.length) {
        genreEl.textContent = "";
        return;
      }

      genreEl.textContent = `Genres: ${formatList(genres.slice(0, 5))}`;
    } catch (err) {
      console.warn("Genre lookup failed:", err);
      genreEl.textContent = "";
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
      if (genreEl) genreEl.textContent = "";

      renderMusicHistory();
    }
  }

  renderMusicHistory();
  updateAboutLiveData();
  setInterval(updateAboutLiveData, 30000);
})();
