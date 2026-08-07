import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

class MemoryKV {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key);
    if (value == null) return null;
    return type === "json" ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

test("local Fedora report becomes the active game", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    data: { activities: [{ name: "Steam Runtime Launch Client", type: 0 }] }
  }), { status: 200 });

  try {
    const env = {
      GAME_HISTORY: new MemoryKV(),
      DISCORD_ID: "123",
      GAME_PUBLISH_TOKEN: "secret"
    };

    const post = new Request("https://worker.test/game-presence", {
      method: "POST",
      headers: {
        Authorization: "Bearer secret",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        game: {
          applicationId: "730",
          name: "Counter-Strike 2",
          startedAt: Date.now() - 5000
        }
      })
    });

    assert.equal((await worker.fetch(post, env)).status, 200);

    const response = await worker.fetch(
      new Request("https://worker.test/game-history"),
      env
    );
    const payload = await response.json();

    assert.equal(payload.success, true);
    assert.equal(payload.active.name, "Counter-Strike 2");
    assert.equal(payload.source, "local");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local report rejects an incorrect token", async () => {
  const env = {
    GAME_HISTORY: new MemoryKV(),
    DISCORD_ID: "123",
    GAME_PUBLISH_TOKEN: "secret"
  };

  const response = await worker.fetch(
    new Request("https://worker.test/game-presence", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ game: { name: "Counter-Strike 2" } })
    }),
    env
  );

  assert.equal(response.status, 401);
});
