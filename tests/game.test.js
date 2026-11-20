import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { Game, TUNING, validateInputs, validateScenario } from "../src/game.js";

test("contract tuning matches the engine", () => {
  const contract = JSON.parse(fs.readFileSync("game.contract.json", "utf8"));
  assert.deepEqual(contract.tuning, TUNING);
});

test("picks a mote, deposits it, and lights a lantern", () => {
  const game = new Game({
    seed: 7,
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { pos: [0, 0, 5], carried: 10, flames: 3 },
      motes: [],
      shades: [],
      lanterns: [{ id: "L1", pos: [0, 0, 5] }],
      time_left_s: 300,
    },
  });

  game.applyInput({ interact: true });
  assert.equal(game.lanterns[0].lit, true);
  assert.equal(game.lanterns[0].deposited, 10);
  assert.equal(game.score, 150);
  assert.deepEqual(
    game.events.map((event) => event.name),
    ["deposit", "lantern_lit"],
  );
});

test("picks an active mote within pickup radius", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 1]],
      shades: [],
      time_left_s: 300,
    },
  });
  game.applyInput({});
  assert.equal(game.player.carried, 1);
  assert.equal(game.motes.length, 0);
  assert.equal(game.score, 0);
});

test("mote pickup radius is 2 metres", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 2]],
      shades: [],
    },
  });
  game.applyInput({});
  assert.equal(game.player.carried, 1);
});

test("pulse rises to stun and pushes nearby shades", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      motes: [],
      shades: [{ id: "S1", pos: [2, 0, 0] }],
      player: { carried: 3, flames: 3 },
      time_left_s: 300,
    },
  });
  game.applyInput({ pulse: true });
  assert.equal(game.shades[0].state, "stunned");
  assert.equal(game.player.flames, 3);
  assert.deepEqual(game.events.at(-1), {
    type: "event",
    tick: 1,
    name: "pulse",
    data: { stunned_ids: ["S1"] },
  });
});

test("shade hit drops carried motes and grants invulnerability", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { pos: [0, 0, 0], carried: 5, flames: 3 },
      motes: [],
      shades: [{ id: "S1", pos: [0, 0, 0] }],
      time_left_s: 300,
    },
  });
  game.applyInput({});
  assert.equal(game.player.flames, 2);
  assert.equal(game.player.carried, 3);
  assert.equal(game.events.at(-1).name, "player_hit");
});

test("same scenario and seed produce the same deterministic snapshot", () => {
  const scenario = {
    random_motes: true,
    random_shades: true,
    time_left_s: 300,
  };
  const a = new Game({ seed: 123, scenario }).snapshot(0);
  const b = new Game({ seed: 123, scenario }).snapshot(0);
  assert.deepEqual(a, b);
});

test("scenario and input validation rejects malformed documents", () => {
  assert.throws(() => validateScenario({ motes: "bad" }), /motes/);
  assert.throws(
    () => validateInputs({ frames: [{ tick: 1 }, { tick: 1 }] }),
    /repeated tick/,
  );
});

test("buttons are rising-edge actions", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      motes: [],
      shades: [],
      player: { pos: [0, 0, 0], carried: 10, flames: 3 },
      lanterns: [{ id: "L1", pos: [0, 0, 0] }],
    },
  });
  game.applyInput({ interact: true });
  game.applyInput({ interact: true });
  assert.equal(game.lanterns[0].deposited, 10);
  assert.equal(game.events.filter((event) => event.name === "deposit").length, 1);
});

test("night 2 and night 3 maps have their lantern counts", () => {
  const night2 = new Game({ night: 2, scenario: { random_motes: false, random_shades: false } });
  const night3 = new Game({ night: 3, scenario: { random_motes: false, random_shades: false } });
  assert.equal(night2.lanterns.length, 6);
  assert.equal(night3.lanterns.length, 7);
});

test("dash activates once and emits a dash event", () => {
  const game = new Game({
    night: 2,
    scenario: { random_motes: false, random_shades: false },
  });
  game.applyInput({ dash: true, move: [0, 1] });
  game.applyInput({ dash: true, move: [0, 1] });
  assert.equal(game.events.filter((event) => event.name === "dash").length, 1);
  assert.ok(game.player.dashCdTicks > 0);
});

test("pause freezes counters and snapshot state", () => {
  const game = new Game({
    scenario: { random_motes: false, random_shades: false, time_left_s: 10 },
  });
  game.applyInput({ pause: true });
  assert.equal(game.state, "paused");
  assert.equal(game.snapshot().state, "paused");
  game.applyInput({ pause: false });
  game.applyInput({ pause: true });
  assert.equal(game.state, "playing");
});

test("charm pick refreshes 600 tick movement buff", () => {
  const game = new Game({
    night: 2,
    scenario: {
      random_motes: false,
      random_shades: false,
      charms: [{ id: "C1", pos: [0, 0, 0], available: true }],
    },
  });
  game.applyInput({});
  assert.equal(game.player.charmTicks, 600);
  assert.equal(game.events.at(-1).name, "charm_picked");
});

test("drifter steals carried motes once", () => {
  const game = new Game({
    night: 2,
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { carried: 5 },
      drifters: [{ id: "D1", pos: [0, 0, 0], state: "chase", stolen: 0 }],
    },
  });
  game.applyInput({});
  assert.equal(game.player.carried, 2);
  assert.equal(game.drifters[0].stolen, 3);
  assert.equal(game.events.at(-1).name, "drifter_steal");
});

test("falling removes all carried motes and grants respawn invulnerability", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { pos: [0, -11, 0], carried: 7, flames: 3 },
    },
  });
  game.applyInput({});
  assert.equal(game.player.flames, 2);
  assert.equal(game.player.carried, 0);
  assert.equal(game.player.respawnWait, 60);
  assert.equal(game.player.invulnTicks, 90);
  assert.equal(game.events.at(-1).name, "player_hit");
});

test("dawn survived replaces the old all-lit win reason", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      time_left_s: 0,
      lanterns: [
        { id: "L1", pos: [0, 0, 25], lit: true, fuel: 100 },
        { id: "L2", pos: [23.8, 0, 7.7], lit: true, fuel: 100 },
        { id: "L3", pos: [14.7, 0, -20.2], lit: true, fuel: 100 },
        { id: "L4", pos: [-14.7, 0, -20.2], lit: true, fuel: 100 },
        { id: "L5", pos: [-23.8, 0, 7.7], lit: true, fuel: 100 },
      ],
    },
  });
  game.applyInput({});
  assert.equal(game.state, "won");
  assert.equal(game.endReason, "dawn_survived");
});

test("lantern needs 10 first-light motes and 5 motes to relight", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { pos: [0, 0, 25], carried: 10, flames: 3 },
      lanterns: [{ id: "L1", pos: [0, 0, 25] }],
    },
  });
  game.applyInput({ interact: true });
  assert.equal(game.lanterns[0].lit, true);
  assert.equal(game.lanterns[0].deposited, 10);
  assert.equal(game.lanterns[0].fuel, 100);
  game.updateLanternFuel();
  game.lanterns[0].fuel = 0;
  game.lanterns[0].lit = false;
  game.lanterns[0].everLit = true;
  game.player.carried = 5;
  game.applyInput({ interact: false });
  game.applyInput({ interact: true });
  assert.equal(game.lanterns[0].lit, true);
  assert.equal(game.lanterns[0].deposited, 5);
});

test("jump uses 7 m/s and only launches while grounded", () => {
  const game = new Game({
    scenario: { random_motes: false, random_shades: false },
  });
  game.applyInput({ jump: true });
  assert.equal(game.player.grounded, false);
  assert.equal(game.player.vel[1], 7 - 20 / 60);
  assert.equal(game.events.filter((event) => event.name === "jump").length, 1);
});

test("dash covers distance at 14 m/s", () => {
  const game = new Game({
    scenario: { random_motes: false, random_shades: false },
  });
  const start = game.player.pos[2];
  game.applyInput({ dash: true, move: [0, 1] });
  for (let i = 0; i < 12; i++) game.applyInput({ move: [0, 1] });
  assert.ok(game.player.pos[2] - start > 2.4);
});

test("night 1 player is clamped inside island boundary", () => {
  const game = new Game({
    night: 1,
    scenario: { random_motes: false, random_shades: false },
  });
  game.player.pos = [100, 0, 100];
  game.keepPlayerOnMap();
  assert.ok(Math.hypot(game.player.pos[0], game.player.pos[2]) <= 39);
});

test("night 3 player is clamped inside island boundary", () => {
  const game = new Game({
    night: 3,
    scenario: { random_motes: false, random_shades: false },
  });
  game.player.pos = [100, 0, 0];
  game.keepPlayerOnMap();
  assert.ok(Math.hypot(game.player.pos[0], game.player.pos[2]) <= 44);
});

test("lantern decays and turns out at zero fuel", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 25], lit: true, fuel: 0.5 }],
    },
  });
  for (let i = 0; i < 60; i++) game.applyInput({});
  assert.equal(game.lanterns[0].lit, false);
  assert.equal(game.lanterns[0].fuel, 0);
  assert.equal(game.events.at(-1).name, "lantern_out");
});

test("refueling adds 10 fuel and emits refuel", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { pos: [0, 0, 25], carried: 3 },
      lanterns: [{ id: "L1", pos: [0, 0, 25], lit: true, fuel: 20 }],
    },
  });
  game.applyInput({ interact: true });
  assert.ok(Math.abs(game.lanterns[0].fuel - 50) < 0.1);
  assert.equal(game.player.carried, 0);
  assert.equal(game.events.at(-1).name, "refuel");
});

test("drain shade is 15 points on pulse", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      player: { carried: 3 },
      shades: [{ id: "S1", pos: [1, 0, 0], state: "drain", state_ticks_left: 120 }],
    },
  });
  game.applyInput({ pulse: true });
  assert.equal(game.shades[0].state, "stunned");
  assert.equal(game.score, 15);
});

test("dawn wins only when enough lanterns remain lit", () => {
  const game = new Game({
    scenario: {
      random_motes: false,
      random_shades: false,
      time_left_s: 1 / 60,
      lanterns: [
        { id: "L1", pos: [0, 0, 25], lit: true, fuel: 100 },
        { id: "L2", pos: [23.8, 0, 7.7], lit: true, fuel: 100 },
        { id: "L3", pos: [14.7, 0, -20.2], lit: true, fuel: 100 },
      ],
    },
  });
  game.applyInput({});
  assert.equal(game.state, "won");
  assert.equal(game.endReason, "dawn_survived");
});
