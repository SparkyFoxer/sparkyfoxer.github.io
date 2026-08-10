/* Live About page data from the shared Cloudflare activity tracker. */
(() => {
  const MUSIC_HISTORY_URL =
    "https://sparky-game-history.sparkyfoxer.workers.dev/music-history";
  const MUSIC_IMPORT_URL =
    "https://sparky-game-history.sparkyfoxer.workers.dev/music-history/import";

  // Keep disabled until the Spotify genre Worker credentials are fixed.
  const GENRE_ENDPOINT = "";

  const LEGACY_HISTORY_KEY = "sparky_about_last_played_spotify_v1";
  const LEGACY_CURRENT_KEY = "sparky_about_current_spotify_v1";
  const MAX_HISTORY = 6;
  const PREVIEW_OFFLINE =
    new URLSearchParams(window.location.search).get("preview") ===
    "offline";

  const musicEl = document.querySelector("#aboutMusicText");
  const genreEl = document.querySelector("#aboutGenreText");
  const lastPlayedEl = document.querySelector("#aboutLastPlayedList");

  let lastHistory = [];

  function cleanText(value) {
    return String(value || "").trim();
  }

  function readLegacyHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(LEGACY_HISTORY_KEY) || "[]"
      );
      return Array.isArray(value) ? value.slice(0, MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  async function migrateLegacyHistory() {
    const history = readLegacyHistory();
    const current = (() => {
      try {
        return JSON.parse(
          localStorage.getItem(LEGACY_CURRENT_KEY) || "null"
        );
      } catch {
        return null;
      }
    })();

    if (!history.length && !current) return;

    try {
      const response = await fetch(MUSIC_IMPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, current }),
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Music migration returned ${response.status}`);
      }

      localStorage.removeItem(LEGACY_HISTORY_KEY);
      localStorage.removeItem(LEGACY_CURRENT_KEY);
    } catch (error) {
      console.warn("Spotify history migration failed:", error);
    }
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

  function createMusicHistorySkeleton() {
    const item = document.createElement("li");
    item.className =
      "dynamic-list-skeleton music-history-skeleton";
    item.setAttribute("aria-hidden", "true");

    const artwork = document.createElement("span");
    artwork.className =
      "dynamic-skeleton-art music-skeleton-art";

    const copy = document.createElement("span");
    copy.className =
      "dynamic-skeleton-copy music-skeleton-copy";

    const title = document.createElement("span");
    title.className =
      "dynamic-skeleton-line dynamic-skeleton-line-title " +
      "music-skeleton-line music-skeleton-line-title";

    const metadata = document.createElement("span");
    metadata.className =
      "dynamic-skeleton-line dynamic-skeleton-line-meta " +
      "music-skeleton-line music-skeleton-line-meta";

    copy.append(title, metadata);
    item.append(artwork, copy);

    return item;
  }

  function renderMusicHistory(history = lastHistory) {
    if (!lastPlayedEl) return;

    const items = Array.isArray(history)
      ? history.slice(0, MAX_HISTORY)
      : [];

    lastHistory = items;
    lastPlayedEl.replaceChildren();
    lastPlayedEl.setAttribute(
      "aria-label",
      items.length
        ? `Recently seen Spotify songs, ${items.length} recorded`
        : "Recently seen Spotify songs. No songs seen yet."
    );

    if (!items.length) {
      const li = document.createElement("li");
      li.className = "music-history-empty";
      li.textContent = "No songs seen yet.";
      lastPlayedEl.appendChild(li);
    }

    for (const item of items) {
      const li = document.createElement("li");

      const main = document.createElement("span");
      main.className = "track-main";
      main.textContent =
        `${item.song || "Unknown song"} — ` +
        `${item.artist || "Unknown artist"}`;

      const meta = document.createElement("span");
      meta.className = "track-meta";

      const parts = [];
      if (item.album) parts.push(item.album);

      const seen = formatTime(item.seenAt || item.lastSeenAt);
      if (seen) parts.push(`seen ${seen}`);

      meta.textContent = parts.join(" • ");
      li.appendChild(main);
      if (meta.textContent) li.appendChild(meta);
      lastPlayedEl.appendChild(li);
    }

    for (
      let index = items.length;
      index < MAX_HISTORY;
      index += 1
    ) {
      lastPlayedEl.appendChild(createMusicHistorySkeleton());
    }
  }

  async function fetchGenres(trackId) {
    if (!GENRE_ENDPOINT || !trackId) return [];

    const url = `${GENRE_ENDPOINT}?track_id=${encodeURIComponent(trackId)}`;
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Genre endpoint failed: ${response.status}`);
    }

    const data = await response.json();
    const genres =
      data.genres ||
      data.genre ||
      data.artist_genres ||
      data.tags ||
      [];

    if (typeof genres === "string") return [genres];
    return Array.isArray(genres) ? genres : [];
  }

  async function renderCurrent(track) {
    if (!musicEl) return;

    if (PREVIEW_OFFLINE || !track) {
      musicEl.textContent = "Nothing showing from Spotify right now.";
      if (genreEl) genreEl.textContent = "";
      return;
    }

    const song = cleanText(track.song);
    const artist = cleanText(track.artist);
    const album = cleanText(track.album);
    const trackId = cleanText(track.trackId || track.track_id);

    musicEl.textContent =
      `${song || "Unknown song"} — ${artist || "Unknown artist"}` +
      `${album ? ` • ${album}` : ""}`;

    if (!genreEl) return;

    if (!GENRE_ENDPOINT) {
      genreEl.textContent = "";
      return;
    }

    try {
      const genres = await fetchGenres(trackId);
      genreEl.textContent = genres.length
        ? `Genres: ${genres.slice(0, 5).join(", ")}`
        : "";
    } catch (error) {
      console.warn("Genre lookup failed:", error);
      genreEl.textContent = "";
    }
  }

  async function updateAboutLiveData() {
    try {
      const response = await fetch(MUSIC_HISTORY_URL, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Music tracker returned ${response.status}`);
      }

      const payload = await response.json();
      if (!payload.success) {
        throw new Error("Music tracker request was unsuccessful");
      }

      renderMusicHistory(payload.history);
      await renderCurrent(payload.active || null);
    } catch (error) {
      console.warn("Shared Spotify history failed:", error);

      if (musicEl && !PREVIEW_OFFLINE) {
        musicEl.textContent = "Live music unavailable.";
      } else if (musicEl) {
        musicEl.textContent = "Nothing showing from Spotify right now.";
      }

      if (genreEl) genreEl.textContent = "";
      renderMusicHistory(lastHistory.length ? lastHistory : readLegacyHistory());
    }
  }

  renderMusicHistory(readLegacyHistory());
  migrateLegacyHistory().finally(updateAboutLiveData);
  setInterval(updateAboutLiveData, 30000);
})();
