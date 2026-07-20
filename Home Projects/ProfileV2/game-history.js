/* Current and recently played Discord games from the shared tracker */
(() => {
  const GAME_HISTORY_URL =
    "https://sparky-game-history.sparkyfoxer.workers.dev/game-history";

  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL =
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  const nowText = document.querySelector("#aboutGameNowText");
  const historyList = document.querySelector("#aboutGameHistoryList");

  if (!nowText || !historyList) return;

  let activeGame = null;
  let gameHistory = [];

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

  function findGame(activities) {
    const activity = activities.find((item) => {
      if (!item || item.type !== 0) return false;

      const name = String(item.name || "").toLowerCase();
      return name !== "spotify" && name !== "custom status";
    });

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
    historyList.replaceChildren();

    if (!gameHistory.length) {
      const empty = document.createElement("li");
      empty.textContent = "No games recorded yet.";
      historyList.appendChild(empty);
      return;
    }

    for (const game of gameHistory) {
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

      activeGame = payload.active || null;
      gameHistory = Array.isArray(payload.history)
        ? payload.history.slice(0, 6)
        : [];
    } catch (trackerError) {
      console.warn("Shared game history failed:", trackerError);

      try {
        await loadDirectPresence();
      } catch (presenceError) {
        console.warn("Game activity fallback failed:", presenceError);

        if (!activeGame) {
          nowText.textContent = "Game activity unavailable.";
        }
      }
    }

    renderCurrent();
    renderHistory();
  }

  renderCurrent();
  renderHistory();
  refreshGameActivity();

  setInterval(refreshGameActivity, 15000);
  setInterval(renderCurrent, 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshGameActivity();
    }
  });
})();
