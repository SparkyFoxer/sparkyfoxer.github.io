const STATE_KEY = "sparky-game-history:v1";
const MAX_HISTORY = 6;
const LANYARD_BASE_URL = "https://api.lanyard.rest/v1/users";

const PUBLIC_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

function emptyState() {
  return {
    version: 1,
    active: null,
    history: [],
    updatedAt: null
  };
}

function finiteTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0
    ? timestamp
    : null;
}

function cleanText(value) {
  return String(value || "").trim().slice(0, 300);
}

function cleanSession(value) {
  if (!value || typeof value !== "object") return null;

  const name = cleanText(value.name);
  if (!name) return null;

  return {
    id: cleanText(value.id),
    applicationId: cleanText(value.applicationId),
    name,
    details: cleanText(value.details),
    state: cleanText(value.state),
    startedAt: finiteTimestamp(value.startedAt),
    endedAt: finiteTimestamp(value.endedAt),
    durationMs: Math.max(0, Number(value.durationMs || 0))
  };
}

export function normaliseState(value) {
  if (!value || typeof value !== "object") return emptyState();

  const history = Array.isArray(value.history)
    ? value.history
        .map(cleanSession)
        .filter(Boolean)
        .slice(0, MAX_HISTORY)
    : [];

  return {
    version: 1,
    active: cleanSession(value.active),
    history,
    updatedAt: finiteTimestamp(value.updatedAt)
  };
}

export function findGame(activities) {
  if (!Array.isArray(activities)) return null;

  const activity = activities.find((item) => {
    if (!item || item.type !== 0) return false;

    const name = cleanText(item.name).toLowerCase();
    return name && name !== "spotify" && name !== "custom status";
  });

  if (!activity) return null;

  return {
    applicationId: cleanText(activity.application_id),
    name: cleanText(activity.name) || "Unknown game",
    details: cleanText(activity.details),
    state: cleanText(activity.state),
    startedAt: finiteTimestamp(activity.timestamps?.start)
  };
}

function sameSession(first, second) {
  if (!first || !second) return false;

  if (first.name !== second.name) return false;

  if (
    first.applicationId &&
    second.applicationId &&
    first.applicationId !== second.applicationId
  ) {
    return false;
  }

  if (!first.startedAt || !second.startedAt) return true;

  return Math.abs(first.startedAt - second.startedAt) < 60000;
}

function createActiveSession(game, now) {
  const startedAt = game.startedAt || now;
  const identity = game.applicationId || game.name.toLowerCase();

  return {
    id: `${identity}:${startedAt}`,
    applicationId: game.applicationId,
    name: game.name,
    details: game.details,
    state: game.state,
    startedAt,
    endedAt: null,
    durationMs: 0
  };
}

function finishSession(session, endedAt) {
  return {
    ...session,
    endedAt,
    durationMs: Math.max(0, endedAt - session.startedAt)
  };
}

function addHistoryItem(history, session) {
  return [
    session,
    ...history.filter((item) => item.id !== session.id)
  ].slice(0, MAX_HISTORY);
}

export function reconcileState(previousValue, currentGame, now = Date.now()) {
  const state = normaliseState(previousValue);
  let changed = false;

  if (currentGame) {
    if (!state.active) {
      state.active = createActiveSession(currentGame, now);
      changed = true;
    } else if (sameSession(state.active, currentGame)) {
      state.active = {
        ...state.active,
        details: currentGame.details || state.active.details,
        state: currentGame.state || state.active.state
      };
    } else {
      state.history = addHistoryItem(
        state.history,
        finishSession(state.active, now)
      );
      state.active = createActiveSession(currentGame, now);
      changed = true;
    }
  } else if (state.active) {
    state.history = addHistoryItem(
      state.history,
      finishSession(state.active, now)
    );
    state.active = null;
    changed = true;
  }

  if (changed) state.updatedAt = now;

  return { state, changed };
}

async function loadState(env) {
  const value = await env.GAME_HISTORY.get(STATE_KEY, "json");
  return normaliseState(value);
}

async function saveState(env, state) {
  await env.GAME_HISTORY.put(STATE_KEY, JSON.stringify(state));
}

async function loadLanyardPresence(discordId) {
  const response = await fetch(`${LANYARD_BASE_URL}/${discordId}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Lanyard returned ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.success || !payload.data) {
    throw new Error("Lanyard returned no presence data");
  }

  return payload.data;
}

export async function updateGameHistory(env, now = Date.now()) {
  if (!env.GAME_HISTORY) {
    throw new Error("GAME_HISTORY KV binding is missing");
  }

  const discordId = cleanText(env.DISCORD_ID);
  if (!discordId) throw new Error("DISCORD_ID is missing");

  const [previousState, presence] = await Promise.all([
    loadState(env),
    loadLanyardPresence(discordId)
  ]);

  const game = findGame(presence.activities);
  const { state, changed } = reconcileState(previousState, game, now);

  if (changed) await saveState(env, state);

  return {
    ...state,
    checkedAt: now,
    sourceAvailable: true
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: PUBLIC_HEADERS
  });
}

async function handleRead(env) {
  try {
    const state = await updateGameHistory(env);
    return jsonResponse({ success: true, ...state });
  } catch (error) {
    console.error("Game history update failed", error);

    try {
      const state = await loadState(env);
      return jsonResponse({
        success: true,
        ...state,
        checkedAt: Date.now(),
        sourceAvailable: false
      });
    } catch (storageError) {
      console.error("Game history storage failed", storageError);

      return jsonResponse({
        success: false,
        error: "Game history is temporarily unavailable"
      }, 503);
    }
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: PUBLIC_HEADERS
      });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/" && url.pathname !== "/game-history") {
      return jsonResponse({ success: false, error: "Not found" }, 404);
    }

    if (request.method !== "GET") {
      return jsonResponse({
        success: false,
        error: "Method not allowed"
      }, 405);
    }

    return handleRead(env);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      updateGameHistory(env, controller.scheduledTime)
    );
  }
};
