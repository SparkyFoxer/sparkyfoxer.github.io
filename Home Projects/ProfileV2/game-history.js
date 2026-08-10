/* Current and recently played Discord games from the shared tracker */
(() => {
  const GAME_HISTORY_URL =
    "https://sparky-game-history.sparkyfoxer.workers.dev/game-history";

  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL =
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
  const MAX_HISTORY = 6;
  const MAX_WEEKLY = 3;
  const PREVIEW_OFFLINE =
    new URLSearchParams(window.location.search).get("preview") ===
    "offline";

  const GAME_NOISE_NAMES = new Set([
    "pv-bwrap",
    "srt-bwrap",
    "steam runtime launch client"
  ]);

  function isLauncherNoise(value) {
    const rawName = String(value?.name || value || "")
      .trim()
      .toLowerCase();

    const name = rawName
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      !name ||
      name === "pv bwrap" ||
      name === "srt bwrap" ||
      name.startsWith("pressure vessel ") ||
      name.startsWith("steam runtime launch")
    );
  }

  const nowText = document.querySelector("#aboutGameNowText");
  const historyList = document.querySelector("#aboutGameHistoryList");
  const weeklyList = document.querySelector("#aboutGameWeeklyList");

  if (!nowText || !historyList) return;

  let activeGame = null;
  let gameHistory = [];
  let weeklyGames = [];

  function createGameHistorySkeleton() {
    const item = document.createElement("li");
    item.className =
      "dynamic-list-skeleton game-history-skeleton";
    item.setAttribute("aria-hidden", "true");

    const artwork = document.createElement("span");
    artwork.className =
      "dynamic-skeleton-art game-skeleton-art";

    const copy = document.createElement("span");
    copy.className = "dynamic-skeleton-copy";

    const title = document.createElement("span");
    title.className =
      "dynamic-skeleton-line dynamic-skeleton-line-title";

    const metadata = document.createElement("span");
    metadata.className =
      "dynamic-skeleton-line dynamic-skeleton-line-meta";

    copy.append(title, metadata);
    item.append(artwork, copy);

    return item;
  }

  function createWeeklySkeleton() {
    const item = document.createElement("li");
    item.className =
      "dynamic-list-skeleton weekly-game-skeleton";
    item.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "dynamic-skeleton-copy";

    const title = document.createElement("span");
    title.className =
      "dynamic-skeleton-line dynamic-skeleton-line-title";

    const metadata = document.createElement("span");
    metadata.className =
      "dynamic-skeleton-line dynamic-skeleton-line-short";

    const bar = document.createElement("span");
    bar.className = "dynamic-skeleton-line weekly-skeleton-bar";

    copy.append(title, metadata, bar);
    item.appendChild(copy);

    return item;
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(
      0,
      Math.floor(Number(milliseconds || 0) / 1000)
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function formatEndedTime(timestamp) {
    return new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  function formatWeeklyDuration(milliseconds) {
    const minutes = Math.max(
      0,
      Math.round(Number(milliseconds || 0) / 60000)
    );

    if (minutes < 1) return "<1m";
    if (minutes < 60) return `${minutes}m`;

    const hours = minutes / 60;
    const rounded = hours >= 10
      ? String(Math.round(hours))
      : hours.toFixed(1);

    return `${rounded}h`;
  }

  function findGame(activities) {
    const activity = activities.find((item) => (
      item?.type === 0 &&
      !isLauncherNoise(item)
    ));

    if (!activity) return null;

    return {
      name: activity.name || "Unknown game",
      details: activity.details || "",
      state: activity.state || "",
      startedAt: Number(activity.timestamps?.start || Date.now())
    };
  }

  function renderCurrent() {
    if (!activeGame) {
      nowText.textContent = "Not playing anything right now.";
      nowText.title = "";
      return;
    }

    const duration = formatDuration(
      Date.now() - Number(activeGame.startedAt || Date.now())
    );

    nowText.textContent = `${activeGame.name} • ${duration}`;

    nowText.title = [activeGame.details, activeGame.state]
      .filter(Boolean)
      .join(" — ");
  }

  function renderHistory() {
    const items = gameHistory.slice(0, MAX_HISTORY);

    historyList.replaceChildren();
    historyList.setAttribute(
      "aria-label",
      items.length
        ? `Recently played games, ${items.length} recorded`
        : "Recently played games. No games recorded yet."
    );

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "game-history-empty";
      empty.textContent = "No games recorded yet.";
      historyList.appendChild(empty);
    }

    for (const game of items) {
      const item = document.createElement("li");

      const title = document.createElement("span");
      title.className = "track-main";
      title.textContent = game.name;

      const metadata = document.createElement("span");
      metadata.className = "track-meta";
      metadata.textContent =
        `${formatDuration(game.durationMs)} • ended ` +
        formatEndedTime(game.endedAt);

      item.append(title, metadata);

      const extra = [game.details, game.state]
        .filter(Boolean)
        .join(" — ");

      if (extra) item.title = extra;
      historyList.appendChild(item);
    }

    for (
      let index = items.length;
      index < MAX_HISTORY;
      index += 1
    ) {
      historyList.appendChild(
        createGameHistorySkeleton()
      );
    }
  }

  function renderWeekly() {
    if (!weeklyList) return;

    const items = weeklyGames.slice(0, MAX_WEEKLY);

    weeklyList.replaceChildren();
    weeklyList.setAttribute(
      "aria-label",
      items.length
        ? `Top games from the last seven days, ${items.length} recorded`
        : "Top games from the last seven days. No game time recorded yet."
    );

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "weekly-game-empty";
      empty.textContent = "No game time recorded this week yet.";
      weeklyList.appendChild(empty);
    }

    const longestDuration = Math.max(
      ...items.map((game) => Number(game.durationMs || 0)),
      1
    );

    items.forEach((game, index) => {
      const item = document.createElement("li");
      item.className = "weekly-game-item";

      const heading = document.createElement("div");
      heading.className = "weekly-game-heading";

      const title = document.createElement("span");
      title.className = "track-main";
      title.textContent = `${index + 1}. ${game.name}`;

      const metadata = document.createElement("span");
      metadata.className = "track-meta";

      const sessions = Math.max(0, Number(game.sessions || 0));
      metadata.textContent =
        `${formatWeeklyDuration(game.durationMs)} • ` +
        `${sessions} ${sessions === 1 ? "session" : "sessions"}`;

      const bar = document.createElement("div");
      bar.className = "weekly-game-bar";
      bar.setAttribute("aria-hidden", "true");

      const fill = document.createElement("span");
      fill.className = "weekly-game-bar-fill";
      fill.style.width =
        `${Math.max(4, Number(game.durationMs || 0) / longestDuration * 100)}%`;

      heading.append(title, metadata);
      bar.appendChild(fill);
      item.append(heading, bar);
      weeklyList.appendChild(item);
    });

    for (
      let index = items.length;
      index < MAX_WEEKLY;
      index += 1
    ) {
      weeklyList.appendChild(createWeeklySkeleton());
    }
  }

  async function loadDirectPresence() {
    const response = await fetch(LANYARD_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Lanyard returned ${response.status}`);
    }

    const payload = await response.json();

    if (!payload.success) {
      throw new Error("Lanyard request was unsuccessful");
    }

    activeGame = findGame(payload.data?.activities || []);
  }

  async function refreshGameActivity() {
    try {
      const response = await fetch(GAME_HISTORY_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Game tracker returned ${response.status}`);
      }

      const payload = await response.json();

      if (!payload.success) {
        throw new Error("Game tracker request was unsuccessful");
      }

      activeGame = PREVIEW_OFFLINE
        ? null
        : payload.active || null;
      gameHistory = Array.isArray(payload.history)
        ? payload.history.slice(0, MAX_HISTORY)
        : [];

      weeklyGames = Array.isArray(payload.weekly?.games)
        ? payload.weekly.games.slice(0, MAX_WEEKLY)
        : [];
    } catch (trackerError) {
      console.warn("Shared game history failed:", trackerError);

      if (PREVIEW_OFFLINE) {
        activeGame = null;
      } else {
        try {
          await loadDirectPresence();
        } catch (presenceError) {
          console.warn("Game activity fallback failed:", presenceError);

          if (!activeGame) {
            nowText.textContent = "Game activity unavailable.";
          }
        }
      }
    }

    renderCurrent();
    renderHistory();
    renderWeekly();
  }

  renderCurrent();
  renderHistory();
  renderWeekly();
  refreshGameActivity();

  setInterval(refreshGameActivity, 15000);
  setInterval(renderCurrent, 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshGameActivity();
    }
  });
})();
