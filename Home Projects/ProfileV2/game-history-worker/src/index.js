const STATE_KEY = "sparky-game-history:v1";
const LOCAL_GAME_KEY = "sparky-local-game:v1";
const MAX_HISTORY = 6;
const MAX_WEEKLY_SESSIONS = 200;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LOCAL_GAME_TTL_MS = 45 * 1000;
const LANYARD_BASE_URL = "https://api.lanyard.rest/v1/users";

const HISTORY_NOISE_NAMES = new Set([
  "pv-bwrap",
  "srt-bwrap",
  "steam runtime launch client"
]);

const PUBLIC_HEADERS = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

function emptyState() {
  return {
    version: 2,
    active: null,
    history: [],
    weeklySessions: [],
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

function safeEqual(left, right) {
  const encoder = new TextEncoder();
  const first = encoder.encode(String(left || ""));
  const second = encoder.encode(String(right || ""));
  const length = Math.max(first.length, second.length);
  let difference = first.length ^ second.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (first[index] ?? 0) ^ (second[index] ?? 0);
  }

  return difference === 0;
}

export function isLauncherNoise(value) {
  const name = cleanText(value?.name || value).toLowerCase();

  if (!name || HISTORY_NOISE_NAMES.has(name)) return true;

  return (
    name.startsWith("pressure-vessel-") ||
    name.startsWith("steam-runtime-launcher-") ||
    name.startsWith("steam runtime launch")
  );
}

export function shouldSaveToHistory(value) {
  return !isLauncherNoise(value);
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

function cleanReportedGame(value, reportedAt = Date.now()) {
  if (!value || typeof value !== "object") return null;

  const game = {
    applicationId: cleanText(value.applicationId || value.appId),
    name: cleanText(value.name),
    details: cleanText(value.details),
    state: cleanText(value.state),
    startedAt: finiteTimestamp(value.startedAt),
    reportedAt: finiteTimestamp(reportedAt) || Date.now()
  };

  if (!game.name || isLauncherNoise(game)) return null;
  if (!game.startedAt) game.startedAt = game.reportedAt;

  return game;
}

function normaliseReportedGame(value, now = Date.now()) {
  if (!value || typeof value !== "object") return null;

  const reportedAt = finiteTimestamp(value.reportedAt);
  if (!reportedAt || now - reportedAt > LOCAL_GAME_TTL_MS) return null;

  return cleanReportedGame(value, reportedAt);
}

export function normaliseState(value, now = Date.now()) {
  if (!value || typeof value !== "object") return emptyState();

  const history = Array.isArray(value.history)
    ? value.history
        .map(cleanSession)
        .filter(Boolean)
        .filter(shouldSaveToHistory)
        .slice(0, MAX_HISTORY)
    : [];

  const weeklySource = Array.isArray(value.weeklySessions)
    ? value.weeklySessions
    : history;

  const seenSessions = new Set();
  const weeklySessions = weeklySource
    .map(cleanSession)
    .filter(Boolean)
    .filter(shouldSaveToHistory)
    .filter((session) => {
      if (!session.startedAt || !session.endedAt) return false;
      if (session.endedAt < now - WEEK_MS) return false;

      const key = session.id || `${session.name}:${session.startedAt}`;
      if (seenSessions.has(key)) return false;

      seenSessions.add(key);
      return true;
    })
    .slice(0, MAX_WEEKLY_SESSIONS);

  const active = cleanSession(value.active);

  return {
    version: 2,
    active: active && shouldSaveToHistory(active) ? active : null,
    history,
    weeklySessions,
    updatedAt: finiteTimestamp(value.updatedAt)
  };
}

export function findGame(activities) {
  if (!Array.isArray(activities)) return null;

  const activity = activities.find((item) => (
    item?.type === 0 && !isLauncherNoise(item)
  ));

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
  const cleanHistory = history.filter(shouldSaveToHistory);

  if (!shouldSaveToHistory(session)) {
    return cleanHistory.slice(0, MAX_HISTORY);
  }

  return [
    session,
    ...cleanHistory.filter((item) => item.id !== session.id)
  ].slice(0, MAX_HISTORY);
}

function addWeeklySession(sessions, session, now) {
  const recentSessions = sessions.filter((item) => (
    shouldSaveToHistory(item) &&
    item.endedAt &&
    item.endedAt >= now - WEEK_MS
  ));

  if (!shouldSaveToHistory(session)) {
    return recentSessions.slice(0, MAX_WEEKLY_SESSIONS);
  }

  return [
    session,
    ...recentSessions.filter((item) => item.id !== session.id)
  ].slice(0, MAX_WEEKLY_SESSIONS);
}

function recordFinishedSession(state, session, now) {
  state.history = addHistoryItem(state.history, session);
  state.weeklySessions = addWeeklySession(
    state.weeklySessions,
    session,
    now
  );
}

export function summariseWeekly(previousValue, now = Date.now()) {
  const state = normaliseState(previousValue, now);
  const windowStart = now - WEEK_MS;
  const sessions = [...state.weeklySessions];

  if (state.active && shouldSaveToHistory(state.active)) {
    sessions.push({
      ...state.active,
      endedAt: now,
      durationMs: Math.max(0, now - state.active.startedAt)
    });
  }

  const games = new Map();
  const seenSessions = new Set();

  for (const session of sessions) {
    if (!session.startedAt || !session.endedAt) continue;

    const sessionKey = session.id || `${session.name}:${session.startedAt}`;
    if (seenSessions.has(sessionKey)) continue;
    seenSessions.add(sessionKey);

    const startedAt = Math.max(session.startedAt, windowStart);
    const endedAt = Math.min(session.endedAt, now);
    const durationMs = Math.max(0, endedAt - startedAt);

    if (!durationMs) continue;

    const gameKey = session.name.toLowerCase();
    const existing = games.get(gameKey) || {
      name: session.name,
      durationMs: 0,
      sessions: 0,
      lastPlayedAt: 0
    };

    existing.durationMs += durationMs;
    existing.sessions += 1;
    existing.lastPlayedAt = Math.max(existing.lastPlayedAt, endedAt);
    games.set(gameKey, existing);
  }

  return {
    windowStart,
    windowEnd: now,
    games: [...games.values()]
      .sort((first, second) => (
        second.durationMs - first.durationMs ||
        second.lastPlayedAt - first.lastPlayedAt
      ))
      .slice(0, 5)
  };
}

export function reconcileState(previousValue, currentGame, now = Date.now()) {
  const state = normaliseState(previousValue, now);
  let changed = Boolean(previousValue?.active && !state.active);

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
      recordFinishedSession(
        state,
        finishSession(state.active, now),
        now
      );
      state.active = createActiveSession(currentGame, now);
      changed = true;
    }
  } else if (state.active) {
    recordFinishedSession(
      state,
      finishSession(state.active, now),
      now
    );
    state.active = null;
    changed = true;
  }

  if (changed) state.updatedAt = now;

  return { state, changed };
}

async function loadState(env, now = Date.now()) {
  const value = await env.GAME_HISTORY.get(STATE_KEY, "json");
  return normaliseState(value, now);
}

async function saveState(env, state) {
  await env.GAME_HISTORY.put(STATE_KEY, JSON.stringify(state));
}

async function loadLocalGame(env, now = Date.now()) {
  const value = await env.GAME_HISTORY.get(LOCAL_GAME_KEY, "json");
  return normaliseReportedGame(value, now);
}

async function saveLocalGame(env, game) {
  if (!game) {
    await env.GAME_HISTORY.delete(LOCAL_GAME_KEY);
    return;
  }

  await env.GAME_HISTORY.put(LOCAL_GAME_KEY, JSON.stringify(game));
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

  const [previousState, localGame, presence] = await Promise.all([
    loadState(env, now),
    loadLocalGame(env, now),
    loadLanyardPresence(discordId).catch((error) => {
      console.warn("Discord game presence failed", error);
      return null;
    })
  ]);

  if (!localGame && !presence) {
    throw new Error("No current game source is available");
  }

  const game = localGame || findGame(presence?.activities);
  const { state, changed } = reconcileState(previousState, game, now);

  if (changed) await saveState(env, state);

  const { weeklySessions, ...publicState } = state;

  return {
    ...publicState,
    weekly: summariseWeekly(state, now),
    checkedAt: now,
    source: localGame ? "local" : "discord",
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
      const checkedAt = Date.now();
      const state = await loadState(env, checkedAt);
      const { weeklySessions, ...publicState } = state;

      return jsonResponse({
        success: true,
        ...publicState,
        weekly: summariseWeekly(state, checkedAt),
        checkedAt,
        source: "cached",
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

async function handlePresenceReport(request, env) {
  if (!env.GAME_HISTORY) {
    return jsonResponse({
      success: false,
      error: "GAME_HISTORY KV binding is missing"
    }, 503);
  }

  const expectedToken = cleanText(env.GAME_PUBLISH_TOKEN);
  const authorisation = request.headers.get("Authorization") || "";
  const suppliedToken = authorisation.replace(/^Bearer\s+/i, "");

  if (!expectedToken || !safeEqual(suppliedToken, expectedToken)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON" }, 400);
  }

  if (payload?.game == null) {
    await saveLocalGame(env, null);
    return jsonResponse({ success: true, game: null });
  }

  const game = cleanReportedGame(payload.game, Date.now());

  if (!game) {
    return jsonResponse({
      success: false,
      error: "A valid game name is required"
    }, 400);
  }

  await saveLocalGame(env, game);
  return jsonResponse({ success: true, game });
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

    if (url.pathname === "/game-presence") {
      if (request.method !== "POST") {
        return jsonResponse({
          success: false,
          error: "Method not allowed"
        }, 405);
      }

      return handlePresenceReport(request, env);
    }

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
