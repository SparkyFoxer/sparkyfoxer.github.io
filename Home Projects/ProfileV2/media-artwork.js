/* Add Cloudflare-backed album and Steam artwork to activity lists. */
(() => {
  const WORKER_BASE =
    "https://sparky-game-history.sparkyfoxer.workers.dev";
  const GAME_HISTORY_URL = `${WORKER_BASE}/game-history`;
  const MUSIC_HISTORY_URL = `${WORKER_BASE}/music-history`;
  const ARTWORK_URL = `${WORKER_BASE}/artwork`;
  const PREVIEW_OFFLINE =
    new URLSearchParams(window.location.search).get("preview") ===
    "offline";

  const albumCache = new Map();
  let lastGames = null;
  let lastMusic = null;
  let scheduled = false;

  function text(value) {
    return String(value || "").trim();
  }

  function safeUrl(value) {
    try {
      const url = new URL(text(value));
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function proxiedArtwork(value) {
    const source = safeUrl(value);
    return source
      ? `${ARTWORK_URL}?url=${encodeURIComponent(source)}`
      : "";
  }

  function steamAppId(game) {
    const value = text(
      game?.applicationId ||
      game?.application_id ||
      game?.appId
    );
    return /^\d+$/.test(value) && value !== "0" ? value : "";
  }

  function steamArt(game) {
    const appId = steamAppId(game);
    const source = appId
      ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
      : "";
    return proxiedArtwork(source);
  }

  async function spotifyArt(track) {
    const direct = safeUrl(
      track?.artUrl ||
      track?.albumArtUrl ||
      track?.album_art_url
    );
    if (direct) return proxiedArtwork(direct);

    const trackId = text(track?.trackId || track?.track_id);
    if (!trackId) return "";

    if (albumCache.has(trackId)) return albumCache.get(trackId);

    const request = (async () => {
      try {
        const trackUrl =
          `https://open.spotify.com/track/${encodeURIComponent(trackId)}`;
        const endpoint =
          "https://open.spotify.com/oembed?url=" +
          encodeURIComponent(trackUrl);
        const response = await fetch(endpoint, { cache: "force-cache" });
        if (!response.ok) return "";
        const data = await response.json();
        return proxiedArtwork(data.thumbnail_url);
      } catch {
        return "";
      }
    })();

    albumCache.set(trackId, request);
    return request;
  }

  function artFrame(url, alt, kind) {
    const frame = document.createElement("span");
    frame.className =
      `media-art-frame ${kind === "game" ? "game-art-frame" : ""}`;

    const fallback = document.createElement("span");
    fallback.className = "media-art-fallback";
    fallback.textContent = kind === "game" ? "🎮" : "♪";
    fallback.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "media-art-image";
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";

    const source = safeUrl(url);
    if (!source) {
      frame.appendChild(fallback);
      return frame;
    }

    image.src = source;
    image.addEventListener(
      "error",
      () => image.replaceWith(fallback),
      { once: true }
    );
    frame.appendChild(image);
    return frame;
  }

  function ensureCopyColumn(element) {
    let copy = element.querySelector(":scope > .media-row-copy");
    if (copy) return copy;

    copy = document.createElement("span");
    copy.className = "media-row-copy";

    const content = [...element.childNodes].filter((node) => !(
      node.nodeType === Node.ELEMENT_NODE &&
      node.classList?.contains("media-art-frame")
    ));

    content.forEach((node) => copy.appendChild(node));
    element.replaceChildren(copy);
    return copy;
  }

  function decorateRow(element, url, alt, kind) {
    if (!element) return;

    ensureCopyColumn(element);

    element.classList.add(
      "media-row-with-art",
      kind === "game" ? "media-row-game" : "media-row-song"
    );
    element.classList.remove(
      kind === "game" ? "media-row-song" : "media-row-game"
    );

    const source = safeUrl(url);
    const artworkKey = `${kind}:${source}`;
    const currentArt =
      element.querySelector(":scope > .media-art-frame");

    if (currentArt?.dataset.artworkKey === artworkKey) return;

    currentArt?.remove();

    const frame = artFrame(source, alt, kind);
    frame.dataset.artworkKey = artworkKey;
    element.prepend(frame);
  }

  async function decorateSongs() {
    const items = Array.isArray(lastMusic?.history)
      ? lastMusic.history
      : [];
    const rows = [
      ...document.querySelectorAll("#aboutLastPlayedList > li")
    ];

    rows.forEach(async (row, index) => {
      const track = items[index];
      if (!track) return;
      const url = await spotifyArt(track);
      if (!row.isConnected) return;
      decorateRow(
        row,
        url,
        `${text(track.album) || text(track.song) || "Spotify"} cover`,
        "song"
      );
    });

    const current = document.querySelector("#aboutMusicText");
    const active = PREVIEW_OFFLINE ? null : lastMusic?.active;
    if (!current || !active) return;

    const url = await spotifyArt(active);

    if (current.isConnected) {
      decorateRow(
        current,
        url,
        `${text(active.album) || text(active.song) || "Spotify"} cover`,
        "song"
      );
    }
  }

  function decorateGames() {
    if (!lastGames) return;

    const current = document.querySelector("#aboutGameNowText");
    if (!PREVIEW_OFFLINE && current && lastGames.active) {
      decorateRow(
        current,
        steamArt(lastGames.active),
        `${text(lastGames.active.name) || "Steam game"} artwork`,
        "game"
      );
    }

    const history = Array.isArray(lastGames.history)
      ? lastGames.history
      : [];
    const rows = [
      ...document.querySelectorAll("#aboutGameHistoryList > li")
    ];

    rows.forEach((row, index) => {
      const game = history[index];
      if (!game) return;
      decorateRow(
        row,
        steamArt(game),
        `${text(game.name) || "Steam game"} artwork`,
        "game"
      );
    });
  }

  function scheduleDecoration() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(async () => {
      scheduled = false;
      decorateGames();
      await decorateSongs();
    });
  }

  async function refreshData() {
    const [gamesResult, musicResult] = await Promise.allSettled([
      fetch(GAME_HISTORY_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      }),
      fetch(MUSIC_HISTORY_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
    ]);

    if (
      gamesResult.status === "fulfilled" &&
      gamesResult.value?.success
    ) {
      lastGames = gamesResult.value;
    }

    if (
      musicResult.status === "fulfilled" &&
      musicResult.value?.success
    ) {
      lastMusic = musicResult.value;
    }

    scheduleDecoration();
  }

  const targets = [
    "#aboutGameNowText",
    "#aboutGameHistoryList",
    "#aboutMusicText",
    "#aboutLastPlayedList"
  ]
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);

  const observer = new MutationObserver(scheduleDecoration);
  targets.forEach((target) => observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true
  }));

  refreshData();
  setInterval(refreshData, 15000);
})();
