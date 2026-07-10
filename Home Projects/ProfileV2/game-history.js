/* Current and recently played Discord games */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL =
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  const CURRENT_KEY = "sparky_about_current_game_v2";
  const HISTORY_KEY = "sparky_about_game_history_v2";
  const MAX_HISTORY = 6;

  const nowText = document.querySelector("#aboutGameNowText");
  const historyList = document.querySelector("#aboutGameHistoryList");

  if (!nowText || !historyList) return;

  let activeGame = null;

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
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
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  function findGame(activities) {
    const activity = activities.find((item) => {
      if (!item) return false;
      if (item.type !== 0) return false;

      const name = String(item.name || "").toLowerCase();

      return (
        name !== "spotify" &&
        name !== "custom status"
      );
    });

    if (!activity) return null;

    const startedAt = Number(
      activity.timestamps?.start || Date.now()
    );

    return {
      name: activity.name || "Unknown game",
      details: activity.details || "",
      state: activity.state || "",
      startedAt,
      lastSeenAt: Date.now()
    };
  }

  function sameSession(first, second) {
    if (!first || !second) return false;

    return (
      first.name === second.name &&
      Math.abs(first.startedAt - second.startedAt) < 60000
    );
  }

  function addToHistory(game, endedAt = Date.now()) {
    if (!game?.name) return;

    const durationMs = Math.max(
      0,
      endedAt - Number(game.startedAt || endedAt)
    );

    const newItem = {
      name: game.name,
      details: game.details || "",
      state: game.state || "",
      startedAt: game.startedAt,
      endedAt,
      durationMs
    };

    let history = readJSON(HISTORY_KEY, []);

    history = history.filter((item) => {
      const sameName = item.name === newItem.name;
      const closeEnding =
        Math.abs(item.endedAt - newItem.endedAt) < 30000;

      return !(sameName && closeEnding);
    });

    history.unshift(newItem);
    history = history.slice(0, MAX_HISTORY);

    writeJSON(HISTORY_KEY, history);
  }

  function renderCurrent() {
    if (!activeGame) {
      nowText.textContent = "Not playing anything right now.";
      nowText.title = "";
      return;
    }

    const duration = formatDuration(
      Date.now() - activeGame.startedAt
    );

    nowText.textContent = `${activeGame.name} • ${duration}`;

    const extra = [
      activeGame.details,
      activeGame.state
    ].filter(Boolean);

    nowText.title = extra.join(" — ");
  }

  function renderHistory() {
    const history = readJSON(HISTORY_KEY, []);

    historyList.replaceChildren();

    if (!history.length) {
      const empty = document.createElement("li");
      empty.textContent = "No games seen yet.";
      historyList.appendChild(empty);
      return;
    }

    for (const game of history) {
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

  function updateStoredCurrent(game) {
    const previous = readJSON(CURRENT_KEY, null);

    if (game) {
      if (previous && !sameSession(previous, game)) {
        addToHistory(
          previous,
          Number(previous.lastSeenAt || Date.now())
        );
      }

      activeGame = {
        ...(sameSession(previous, game) ? previous : {}),
        ...game,
        lastSeenAt: Date.now()
      };

      writeJSON(CURRENT_KEY, activeGame);
      return;
    }

    if (previous) {
      addToHistory(
        previous,
        Number(previous.lastSeenAt || Date.now())
      );
    }

    activeGame = null;
    localStorage.removeItem(CURRENT_KEY);
  }

  async function refreshGameActivity() {
    try {
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

      const activities = payload.data?.activities || [];
      const game = findGame(activities);

      updateStoredCurrent(game);
      renderCurrent();
      renderHistory();
    } catch (error) {
      console.warn("Game activity failed:", error);

      if (!activeGame) {
        activeGame = readJSON(CURRENT_KEY, null);
      }

      if (activeGame) {
        renderCurrent();
      } else {
        nowText.textContent = "Game activity unavailable.";
      }

      renderHistory();
    }
  }

  activeGame = readJSON(CURRENT_KEY, null);

  renderCurrent();
  renderHistory();
  refreshGameActivity();

  setInterval(refreshGameActivity, 15000);
  setInterval(renderCurrent, 1000);
})();
