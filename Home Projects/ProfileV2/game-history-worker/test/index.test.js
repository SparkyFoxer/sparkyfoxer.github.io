import assert from "node:assert/strict";
import test from "node:test";

import {
  findGame,
  normaliseState,
  reconcileState,
  shouldSaveToHistory,
  summariseWeekly
} from "../src/index.js";

const START = 1_800_000_000_000;

function game(name, startedAt = START, applicationId = "game-id") {
  return {
    applicationId,
    name,
    details: "Testing",
    state: "In game",
    startedAt
  };
}

test("findGame ignores Spotify and custom status", () => {
  const result = findGame([
    { name: "Custom Status", type: 4 },
    { name: "Spotify", type: 2 },
    {
      application_id: "123",
      name: "Trailmakers",
      timestamps: { start: START },
      type: 0
    }
  ]);

  assert.equal(result.name, "Trailmakers");
  assert.equal(result.applicationId, "123");
  assert.equal(result.startedAt, START);
});

test("a new game becomes the active session", () => {
  const { state, changed } = reconcileState({}, game("Trailmakers"), START);

  assert.equal(changed, true);
  assert.equal(state.active.name, "Trailmakers");
  assert.equal(state.history.length, 0);
});

test("the same game does not create duplicate sessions", () => {
  const first = reconcileState({}, game("Trailmakers"), START).state;
  const second = reconcileState(
    first,
    game("Trailmakers", START + 1000),
    START + 60_000
  );

  assert.equal(second.changed, false);
  assert.equal(second.state.active.name, "Trailmakers");
  assert.equal(second.state.history.length, 0);
});

test("ending a game adds it to shared history", () => {
  const active = reconcileState({}, game("Scrap Mechanic"), START).state;
  const endedAt = START + 3_600_000;
  const result = reconcileState(active, null, endedAt);

  assert.equal(result.changed, true);
  assert.equal(result.state.active, null);
  assert.equal(result.state.history[0].name, "Scrap Mechanic");
  assert.equal(result.state.history[0].durationMs, 3_600_000);
  assert.equal(result.state.history[0].endedAt, endedAt);
  assert.equal(result.state.weeklySessions[0].name, "Scrap Mechanic");
});

test("switching games ends the previous session", () => {
  const active = reconcileState({}, game("Scrap Mechanic"), START).state;
  const switched = reconcileState(
    active,
    game("Trailmakers", START + 7_200_000, "other-id"),
    START + 7_200_000
  ).state;

  assert.equal(switched.active.name, "Trailmakers");
  assert.equal(switched.history[0].name, "Scrap Mechanic");
});

test("history is limited to six sessions", () => {
  const previous = normaliseState({
    history: Array.from({ length: 6 }, (_, index) => ({
      id: `old-${index}`,
      name: `Old game ${index}`,
      startedAt: START - 20_000,
      endedAt: START - 10_000,
      durationMs: 10_000
    })),
    active: {
      id: "active",
      applicationId: "active-id",
      name: "Newest game",
      startedAt: START
    }
  });

  const result = reconcileState(previous, null, START + 10_000).state;

  assert.equal(result.history.length, 6);
  assert.equal(result.history[0].name, "Newest game");
  assert.equal(result.history.at(-1).name, "Old game 4");
});

test("Steam Linux helper processes are not saved to history", () => {
  const ignoredNames = [
    "srt-bwrap",
    "pv-bwrap",
    "pressure-vessel-wrap",
    "pressure-vessel-adverb",
    "steam-runtime-launcher-service"
  ];

  for (const name of ignoredNames) {
    assert.equal(shouldSaveToHistory(name), false, name);
  }

  assert.equal(shouldSaveToHistory("Scrap Mechanic"), true);
  assert.equal(shouldSaveToHistory("cs2"), true);
});

test("existing helper entries are removed from shared history", () => {
  const state = normaliseState({
    history: [
      {
        id: "helper",
        name: "srt-bwrap",
        startedAt: START,
        endedAt: START + 10_000,
        durationMs: 10_000
      },
      {
        id: "game",
        name: "cs2",
        startedAt: START,
        endedAt: START + 20_000,
        durationMs: 20_000
      }
    ]
  });

  assert.deepEqual(state.history.map((item) => item.name), ["cs2"]);
});

test("ending a helper session does not add it to history", () => {
  const active = reconcileState({}, game("srt-bwrap", START, ""), START).state;
  const result = reconcileState(active, null, START + 10_000);

  assert.equal(result.changed, true);
  assert.equal(result.state.active, null);
  assert.equal(result.state.history.length, 0);
});

test("switching from a helper to a game keeps history clean", () => {
  const active = reconcileState({}, game("pressure-vessel-wrap", START, ""), START).state;
  const result = reconcileState(
    active,
    game("Scrap Mechanic", START + 10_000, "scrap-mechanic"),
    START + 10_000
  );

  assert.equal(result.state.active.name, "Scrap Mechanic");
  assert.equal(result.state.history.length, 0);
  assert.equal(result.state.weeklySessions.length, 0);
});

test("version one history seeds the rolling weekly sessions", () => {
  const state = normaliseState({
    version: 1,
    history: [
      {
        id: "game",
        name: "Trailmakers",
        startedAt: START - 30_000,
        endedAt: START,
        durationMs: 30_000
      }
    ]
  }, START);

  assert.equal(state.version, 2);
  assert.equal(state.weeklySessions.length, 1);
  assert.equal(state.weeklySessions[0].name, "Trailmakers");
});

test("weekly summary combines sessions and includes the active game", () => {
  const hour = 60 * 60 * 1000;
  const summary = summariseWeekly({
    version: 2,
    weeklySessions: [
      {
        id: "trailmakers-one",
        name: "Trailmakers",
        startedAt: START - 6 * hour,
        endedAt: START - 5 * hour,
        durationMs: hour
      },
      {
        id: "trailmakers-two",
        name: "Trailmakers",
        startedAt: START - 4 * hour,
        endedAt: START - 2 * hour,
        durationMs: 2 * hour
      },
      {
        id: "scrap",
        name: "Scrap Mechanic",
        startedAt: START - 2 * hour,
        endedAt: START - hour,
        durationMs: hour
      }
    ],
    active: {
      id: "trailmakers-active",
      name: "Trailmakers",
      startedAt: START - 30 * 60 * 1000
    }
  }, START);

  assert.equal(summary.games[0].name, "Trailmakers");
  assert.equal(summary.games[0].durationMs, 3.5 * hour);
  assert.equal(summary.games[0].sessions, 3);
  assert.equal(summary.games[1].name, "Scrap Mechanic");
  assert.equal(summary.games[1].sessions, 1);
});

test("weekly summary removes sessions older than seven days", () => {
  const day = 24 * 60 * 60 * 1000;
  const summary = summariseWeekly({
    version: 2,
    weeklySessions: [
      {
        id: "old",
        name: "Old game",
        startedAt: START - 9 * day,
        endedAt: START - 8 * day,
        durationMs: day
      },
      {
        id: "recent",
        name: "Recent game",
        startedAt: START - day,
        endedAt: START,
        durationMs: day
      }
    ]
  }, START);

  assert.deepEqual(summary.games.map((item) => item.name), ["Recent game"]);
});
