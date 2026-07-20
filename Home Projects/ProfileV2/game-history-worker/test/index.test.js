import assert from "node:assert/strict";
import test from "node:test";

import {
  findGame,
  normaliseState,
  reconcileState
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
