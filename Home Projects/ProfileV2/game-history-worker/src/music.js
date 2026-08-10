const KEY = "sparky-music-history:v1";
const MAX_HISTORY = 6;
const LANYARD = "https://api.lanyard.rest/v1/users";
const IMPORT_HOSTS = new Set([
  "sparkyfoxer.github.io",
  "sparkyfops.pages.dev",
  "localhost",
  "127.0.0.1"
]);

const text = (value) => String(value || "").trim().slice(0, 300);

function safeUrl(value) {
  try {
    const url = new URL(text(value));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function track(value) {
  if (!value || typeof value !== "object") return null;
  const result = {
    trackId: text(value.trackId || value.track_id),
    song: text(value.song),
    artist: text(value.artist),
    album: text(value.album),
    artUrl: safeUrl(value.artUrl || value.albumArtUrl || value.album_art_url),
    firstSeenAt: text(value.firstSeenAt),
    lastSeenAt: text(value.lastSeenAt),
    seenAt: text(value.seenAt)
  };
  return result.trackId || result.song || result.artist ? result : null;
}

function trackKey(value) {
  const item = track(value);
  if (!item) return "";
  return item.trackId || [item.song, item.artist, item.album]
    .join("|").toLowerCase();
}

export function normaliseMusicState(value) {
  if (!value || typeof value !== "object") {
    return { version: 1, active: null, history: [], updatedAt: null };
  }

  const active = track(value.active);
  const activeKey = trackKey(active);
  const seen = new Set();
  const history = [];

  for (const valueItem of Array.isArray(value.history) ? value.history : []) {
    const item = track(valueItem);
    const key = trackKey(item);
    if (!item || !key || key === activeKey || seen.has(key)) continue;
    seen.add(key);
    history.push(item);
    if (history.length >= MAX_HISTORY) break;
  }

  return {
    version: 1,
    active,
    history,
    updatedAt: Number(value.updatedAt) || null
  };
}

export function spotifyFromPresence(presence, now = Date.now()) {
  const spotify = presence?.spotify;
  if (!spotify) return null;
  const iso = new Date(now).toISOString();
  return track({
    trackId: spotify.track_id,
    song: spotify.song,
    artist: spotify.artist,
    album: spotify.album,
    artUrl: spotify.album_art_url,
    firstSeenAt: iso,
    lastSeenAt: iso
  });
}

function addHistory(history, value, now) {
  const item = track(value);
  const key = trackKey(item);
  if (!item || !key) return history.slice(0, MAX_HISTORY);
  const finished = {
    ...item,
    seenAt: new Date(now).toISOString(),
    lastSeenAt: item.lastSeenAt || new Date(now).toISOString()
  };
  return [finished, ...history.filter((old) => trackKey(old) !== key)]
    .slice(0, MAX_HISTORY);
}

export function reconcileMusicState(previous, currentValue, now = Date.now()) {
  const state = normaliseMusicState(previous);
  const current = track(currentValue);
  const oldKey = trackKey(state.active);
  const newKey = trackKey(current);
  const iso = new Date(now).toISOString();
  let changed = false;

  if (newKey) {
    const filtered = state.history.filter((item) => trackKey(item) !== newKey);
    if (filtered.length !== state.history.length) {
      state.history = filtered;
      changed = true;
    }

    if (!oldKey) {
      state.active = { ...current, firstSeenAt: current.firstSeenAt || iso, lastSeenAt: iso };
      changed = true;
    } else if (oldKey === newKey) {
      const next = {
        ...state.active,
        ...current,
        firstSeenAt: state.active.firstSeenAt || current.firstSeenAt || iso,
        lastSeenAt: state.active.lastSeenAt || current.lastSeenAt || iso
      };
      if (JSON.stringify(next) !== JSON.stringify(state.active)) changed = true;
      state.active = next;
    } else {
      state.history = addHistory(state.history, state.active, now);
      state.active = { ...current, firstSeenAt: current.firstSeenAt || iso, lastSeenAt: iso };
      changed = true;
    }
  } else if (state.active) {
    state.history = addHistory(state.history, state.active, now);
    state.active = null;
    changed = true;
  }

  if (changed) state.updatedAt = now;
  return { state, changed };
}

async function presence(discordId) {
  const response = await fetch(`${LANYARD}/${encodeURIComponent(discordId)}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Lanyard returned ${response.status}`);
  const payload = await response.json();
  if (!payload.success || !payload.data) throw new Error("No Lanyard data");
  return payload.data;
}

async function load(env) {
  return normaliseMusicState(await env.GAME_HISTORY.get(KEY, "json"));
}

async function save(env, state) {
  await env.GAME_HISTORY.put(KEY, JSON.stringify(state));
}

export async function updateMusicHistory(env, now = Date.now()) {
  if (!env.GAME_HISTORY) throw new Error("GAME_HISTORY KV binding is missing");
  const discordId = text(env.DISCORD_ID);
  if (!discordId) throw new Error("DISCORD_ID is missing");

  const [stored, live] = await Promise.all([
    env.GAME_HISTORY.get(KEY, "json"),
    presence(discordId).catch(() => null)
  ]);
  const previous = normaliseMusicState(stored);

  if (!live) {
    return { ...previous, checkedAt: now, source: "cached", sourceAvailable: false };
  }

  const { state, changed } = reconcileMusicState(
    previous,
    spotifyFromPresence(live, now),
    now
  );
  if (changed || !stored) await save(env, state);
  return { ...state, checkedAt: now, source: "discord", sourceAvailable: true };
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

function importAllowed(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try { return IMPORT_HOSTS.has(new URL(origin).hostname); } catch { return false; }
}

export async function handleMusicRequest(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const url = new URL(request.url);

  if (url.pathname === "/music-history" && request.method === "GET") {
    try {
      return json({ success: true, ...(await updateMusicHistory(env)) });
    } catch (error) {
      console.error("Music history failed", error);
      try { return json({ success: true, ...(await load(env)), source: "cached", sourceAvailable: false }); }
      catch { return json({ success: false, error: "Music history unavailable" }, 503); }
    }
  }

  if (url.pathname !== "/music-history/import") return null;
  if (request.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
  if (!importAllowed(request)) return json({ success: false, error: "Forbidden" }, 403);

  let payload;
  try { payload = await request.json(); } catch { return json({ success: false, error: "Invalid JSON" }, 400); }
  const existing = await load(env);
  if (existing.active || existing.history.length) {
    return json({ success: true, imported: false, reason: "cloud history already exists" });
  }

  const candidates = [
    ...(Array.isArray(payload?.history) ? payload.history : []),
    ...(payload?.current ? [payload.current] : [])
  ];
  const state = normaliseMusicState({ history: candidates, updatedAt: Date.now() });
  if (state.history.length) await save(env, state);
  return json({ success: true, imported: Boolean(state.history.length), history: state.history });
}
