/* Add resilient album and Steam artwork to activity lists. */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL =
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
  const WORKER_BASE =
    "https://sparky-game-history.sparkyfoxer.workers.dev";
  const GAME_HISTORY_URL = `${WORKER_BASE}/game-history`;
  const MUSIC_HISTORY_URL = `${WORKER_BASE}/music-history`;
  const ARTWORK_URL = `${WORKER_BASE}/artwork`;
  const LEGACY_MUSIC_HISTORY_KEY =
    "sparky_about_last_played_spotify_v1";
  const PREVIEW_OFFLINE =
    new URLSearchParams(window.location.search).get("preview") ===
    "offline";

  const albumCache = new Map();
  let lastGames = null;
  let lastMusic = null;
  let lastSpotify = null;
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

  function artworkChoice(value) {
    const direct = safeUrl(value);
    if (!direct) return { primary: "", fallback: "" };

    return {
      primary: `${ARTWORK_URL}?url=${encodeURIComponent(direct)}`,
      fallback: direct
    };
  }

  function normaliseChoice(value) {
    if (typeof value === "string") {
      return { primary: safeUrl(value), fallback: "" };
    }

    return {
      primary: safeUrl(value?.primary),
      fallback: safeUrl(value?.fallback)
    };
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
    return artworkChoice(source);
  }

  function legacyMusicHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(LEGACY_MUSIC_HISTORY_KEY) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  async function spotifyArt(track) {
    const direct = safeUrl(
      track?.artUrl ||
      track?.albumArtUrl ||
      track?.album_art_url
    );
    if (direct) return artworkChoice(direct);

    const trackId = text(track?.trackId || track?.track_id);
    if (!trackId) return { primary: "", fallback: "" };

    if (albumCache.has(trackId)) return albumCache.get(trackId);

    const request = (async () => {
      try {
        const trackUrl =
          `https://open.spotify.com/track/${encodeURIComponent(trackId)}`;
        const endpoint =
          "https://open.spotify.com/oembed?url=" +
          encodeURIComponent(trackUrl);
        const response = await fetch(endpoint, {
          cache: "force-cache"
        });
        if (!response.ok) return { primary: "", fallback: "" };
        const data = await response.json();
        return artworkChoice(data.thumbnail_url);
      } catch {
        return { primary: "", fallback: "" };
      }
    })();

    albumCache.set(trackId, request);
    return request;
  }

  function artFrame(choiceValue, alt, kind) {
    const frame = document.createElement("span");
    frame.className =
      `media-art-frame ${kind === "game" ? "game-art-frame" : ""}`;

    const fallbackNode = document.createElement("span");
    fallbackNode.className = "media-art-fallback";
    fallbackNode.textContent = kind === "game" ? "🎮" : "♪";
    fallbackNode.setAttribute("aria-hidden", "true");

    const choice = normaliseChoice(choiceValue);
    if (!choice.primary && !choice.fallback) {
      frame.appendChild(fallbackNode);
      return frame;
    }

    const image = document.createElement("img");
    image.className = "media-art-image";
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";

    let triedFallback = false;
    image.addEventListener("error", () => {
      if (
        !triedFallback &&
        choice.fallback &&
        image.src !== choice.fallback
      ) {
        triedFallback = true;
        image.src = choice.fallback;
        return;
      }

      image.replaceWith(fallbackNode);
    });

    image.src = choice.primary || choice.fallback;
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

  function decorateRow(element, choiceValue, alt, kind) {
    if (!element) return;

    ensureCopyColumn(element);

    element.classList.add(
      "media-row-with-art",
      kind === "game" ? "media-row-game" : "media-row-song"
    );
    element.classList.remove(
      kind === "game" ? "media-row-song" : "media-row-game"
    );

    const choice = normaliseChoice(choiceValue);
    const artworkKey =
      `${kind}:${choice.primary}:${choice.fallback}`;
    const currentArt =
      element.querySelector(":scope > .media-art-frame");

    if (currentArt?.dataset.artworkKey === artworkKey) return;

    currentArt?.remove();

    const frame = artFrame(choice, alt, kind);
    frame.dataset.artworkKey = artworkKey;
    element.prepend(frame);
  }

  async function decorateSongs() {
    const cloudHistory = Array.isArray(lastMusic?.history)
      ? lastMusic.history
      : [];
    const items = cloudHistory.length
      ? cloudHistory
      : legacyMusicHistory();

    const rows = [
      ...document.querySelectorAll("#aboutLastPlayedList > li")
    ];

    rows.forEach(async (row, index) => {
      const track = items[index];
      if (!track) return;
      const art = await spotifyArt(track);
      if (!row.isConnected) return;

      decorateRow(
        row,
        art,
        `${text(track.album) || text(track.song) || "Spotify"} cover`,
        "song"
      );
    });

    const current = document.querySelector("#aboutMusicText");
    const active = PREVIEW_OFFLINE
      ? null
      : lastMusic?.active || (
          lastSpotify
            ? {
                trackId: lastSpotify.track_id,
                song: lastSpotify.song,
                artist: lastSpotify.artist,
                album: lastSpotify.album,
                artUrl: lastSpotify.album_art_url
              }
            : null
        );

    if (!current || !active) return;

    const art = await spotifyArt(active);

    if (current.isConnected) {
      decorateRow(
        current,
        art,
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
    const [gamesResult, musicResult, presenceResult] =
      await Promise.allSettled([
        fetch(GAME_HISTORY_URL, { cache: "no-store" })
          .then((response) => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
          }),
        fetch(MUSIC_HISTORY_URL, { cache: "no-store" })
          .then((response) => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
          }),
        fetch(LANYARD_URL, { cache: "no-store" })
          .then((response) => {
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

    if (
      presenceResult.status === "fulfilled" &&
      presenceResult.value?.success
    ) {
      lastSpotify = presenceResult.value.data?.spotify || null;

      if (lastMusic?.active && lastSpotify) {
        lastMusic.active = {
          ...lastMusic.active,
          artUrl:
            lastMusic.active.artUrl ||
            lastSpotify.album_art_url ||
            ""
        };
      }
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
