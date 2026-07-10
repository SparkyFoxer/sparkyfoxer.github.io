/* Live About page data from Discord/Lanyard */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  // Keep disabled until the Spotify genre Worker credentials are fixed.
  const GENRE_ENDPOINT = "";

  const MUSIC_HISTORY_KEY = "sparky_about_last_played_spotify_v1";
  const GAME_STATE_KEY = "sparky_about_current_game_v1";
  const LAST_GAME_KEY = "sparky_about_last_game_v1";

  const MAX_HISTORY = 6;

  const gamingEl = document.querySelector("#aboutGamingText");
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

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
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

  function getGameActivities(data) {
    const activities = data?.activities || [];

    return activities.filter((activity) => {
      if (!activity || !activity.name) return false;

      // Ignore Discord custom status.
      if (activity.type === 4) return false;

      // Ignore Spotify. Music has its own section.
      if (activity.type === 2) return false;
      if (activity.name.toLowerCase() === "spotify") return false;

      return true;
    });
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

  function getGameKey(game) {
    return `${game.name || ""}|${game.details || ""}|${game.state || ""}`;
  }

  function renderLastGame(lastGame) {
    if (!gamingEl) return;

    if (!lastGame) {
      gamingEl.textContent = "No completed game session seen yet.";
      return;
    }

    const duration = formatDuration(lastGame.durationMs);
    const ended = formatTime(lastGame.endedAt);

    gamingEl.textContent =
      `Last played: ${lastGame.label || lastGame.name || "Unknown game"} • ${duration}${ended ? ` • ended ${ended}` : ""}`;
  }

  function renderCurrentGame(game) {
    if (!gamingEl) return;

    const now = Date.now();
    const duration = formatDuration(now - game.startedAt);

    gamingEl.textContent =
      `Currently playing: ${game.label || game.name || "Unknown game"} • ${duration}`;
  }

  function renderGaming(data) {
    if (!gamingEl) return;

    const games = getGameActivities(data);
    const activity = games[0];

    const savedCurrent = safeRead(GAME_STATE_KEY, null);
    const savedLast = safeRead(LAST_GAME_KEY, null);

    if (activity) {
      const label = describeGame(activity);
      const game = {
        name: cleanText(activity.name),
        details: cleanText(activity.details),
        state: cleanText(activity.state),
        label,
        key: getGameKey({
          name: cleanText(activity.name),
          details: cleanText(activity.details),
          state: cleanText(activity.state)
        }),
        startedAt: activity.timestamps?.start
          ? Number(activity.timestamps.start)
          : savedCurrent?.key === label
            ? Number(savedCurrent.startedAt)
            : Date.now(),
        lastSeenAt: Date.now()
      };

      const previousKey = savedCurrent?.key;
      const currentKey = game.key;

      if (previousKey && previousKey !== currentKey && savedCurrent?.startedAt) {
        const endedAt = Date.now();
        const lastGame = {
          ...savedCurrent,
          endedAt,
          durationMs: Math.max(0, endedAt - Number(savedCurrent.startedAt))
        };

        safeWrite(LAST_GAME_KEY, lastGame);
      }

      safeWrite(GAME_STATE_KEY, game);
      renderCurrentGame(game);
      return;
    }

    // If a game was previously active and is now gone, treat it as closed.
    if (savedCurrent?.startedAt) {
      const endedAt = Date.now();

      const lastGame = {
        ...savedCurrent,
        endedAt,
        durationMs: Math.max(0, endedAt - Number(savedCurrent.startedAt))
      };

      safeWrite(LAST_GAME_KEY, lastGame);
      localStorage.removeItem(GAME_STATE_KEY);
      renderLastGame(lastGame);
      return;
    }

    renderLastGame(savedLast);
  }

  function getMusicHistory() {
    const parsed = safeRead(MUSIC_HISTORY_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function saveMusicHistory(history) {
    safeWrite(MUSIC_HISTORY_KEY, history.slice(0, MAX_HISTORY));
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

      renderGaming(data);
      await renderMusic(data);
    } catch (err) {
      console.warn("About live data failed:", err);

      if (gamingEl) gamingEl.textContent = "Game activity unavailable.";
      if (musicEl) musicEl.textContent = "Live music unavailable.";
      if (genreEl) genreEl.textContent = "";

      renderMusicHistory();
    }
  }

  renderMusicHistory();
  updateAboutLiveData();
  setInterval(updateAboutLiveData, 30000);
})();
