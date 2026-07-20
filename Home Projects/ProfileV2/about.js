/* Live About page data from Discord/Lanyard */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  // Keep disabled until the Spotify genre Worker credentials are fixed.
  const GENRE_ENDPOINT = "";

  const MUSIC_HISTORY_KEY = "sparky_about_last_played_spotify_v1";
  const CURRENT_MUSIC_KEY = "sparky_about_current_spotify_v1";
  const MAX_HISTORY = 6;

  const musicEl = document.querySelector("#aboutMusicText");
  const genreEl = document.querySelector("#aboutGenreText");
  const lastPlayedEl = document.querySelector("#aboutLastPlayedList");

  function cleanText(value) {
    return String(value || "").trim();
  }

  function safeRead(key, fallback = null) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatTime(isoOrMs) {
    const date = new Date(isoOrMs);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date);
  }

  function getMusicHistory() {
    const parsed = safeRead(MUSIC_HISTORY_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveMusicHistory(history) {
    safeWrite(MUSIC_HISTORY_KEY, history.slice(0, MAX_HISTORY));
  }

  function trackKey(track) {
    if (!track) return "";

    return cleanText(track.trackId) ||
      [track.song, track.artist, track.album]
        .map(cleanText)
        .join("|")
        .toLowerCase();
  }

  function addTrackToHistory(track, history = getMusicHistory()) {
    const key = trackKey(track);
    if (!key) return history;

    const filtered = history.filter((item) => trackKey(item) !== key);

    return [
      {
        ...track,
        seenAt: new Date().toISOString()
      },
      ...filtered
    ].slice(0, MAX_HISTORY);
  }

  function setCurrentTrack(track) {
    const currentKey = trackKey(track);
    if (!currentKey) return;

    const previous = safeRead(CURRENT_MUSIC_KEY, null);
    const previousKey = trackKey(previous);
    let history = getMusicHistory()
      .filter((item) => trackKey(item) !== currentKey);

    if (previousKey && previousKey !== currentKey) {
      history = addTrackToHistory(previous, history);
    }

    safeWrite(CURRENT_MUSIC_KEY, {
      ...track,
      firstSeenAt:
        previousKey === currentKey
          ? previous.firstSeenAt
          : new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    });

    saveMusicHistory(history);
    renderMusicHistory(history);
  }

  function finishCurrentTrack() {
    const current = safeRead(CURRENT_MUSIC_KEY, null);

    if (!trackKey(current)) {
      renderMusicHistory();
      return;
    }

    const history = addTrackToHistory(current);

    localStorage.removeItem(CURRENT_MUSIC_KEY);
    saveMusicHistory(history);
    renderMusicHistory(history);
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

      const seen = formatTime(item.seenAt);
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

      finishCurrentTrack();
      return;
    }

    const song = cleanText(spotify.song);
    const artist = cleanText(spotify.artist);
    const album = cleanText(spotify.album);
    const trackId = cleanText(spotify.track_id);

    musicEl.textContent =
      `${song || "Unknown song"} — ${artist || "Unknown artist"}${album ? ` • ${album}` : ""}`;

    setCurrentTrack({
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

      genreEl.textContent = `Genres: ${genres.slice(0, 5).join(", ")}`;
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

      await renderMusic(data);
    } catch (err) {
      console.warn("About live data failed:", err);

      if (musicEl) musicEl.textContent = "Live music unavailable.";
      if (genreEl) genreEl.textContent = "";

      renderMusicHistory();
    }
  }

  renderMusicHistory();
  updateAboutLiveData();
  setInterval(updateAboutLiveData, 30000);
})();
