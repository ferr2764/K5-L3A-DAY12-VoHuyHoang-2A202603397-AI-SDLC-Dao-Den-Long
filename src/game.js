import { TUNING } from "./tuning.js";

export { TUNING };

const round3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function seededRandom(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export const NIGHT_MAPS = {
  1: {
    radius: 40,
    spawn: [0, 0, 0],
    lanterns: [
      ["L1", 0, 25], ["L2", 23.8, 7.7], ["L3", 14.7, -20.2],
      ["L4", -14.7, -20.2], ["L5", -23.8, 7.7],
    ],
  },
  2: {
    radius: 28,
    spawn: [0, 0, 0],
    lanterns: [
      ["L1", 0, 20], ["L2", 17, -10], ["L3", -17, -10],
      ["L4", 70, 20], ["L5", 87, -10], ["L6", 53, -10],
    ],
  },
  3: {
    radius: 45,
    spawn: [0, 0, 0],
    lanterns: [
      ["L1", 0, 6], ["L2", 18, 10], ["L3", -18, 10],
      ["L4", 35, -10], ["L5", -35, -10], ["L6", 20, -35],
      ["L7", -20, -35],
    ],
  },
};

export const DEFAULT_LANTERNS = NIGHT_MAPS[1].lanterns.map(([id, x, z]) => ({
  id, pos: [x, 0, z],
}));

function validatePosition(value, label) {
  if (!Array.isArray(value) || value.length !== 3 ||
      value.some((n) => typeof n !== "number" || !Number.isFinite(n))) {
    throw new Error(`${label} must be a [x,y,z] number array`);
  }
}

export function validateScenario(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) throw new Error("scenario must be an object");
  if (s.player?.pos !== undefined) validatePosition(s.player.pos, "player.pos");
  for (const key of ["motes", "shades", "lanterns", "drifters", "charms"]) {
    if (s[key] !== undefined && !Array.isArray(s[key])) throw new Error(`${key} must be an array`);
  }
  if (s.motes) s.motes.forEach((m, i) => validatePosition(Array.isArray(m) ? m : m.pos, `motes[${i}]`));
  if (s.shades) s.shades.forEach((x, i) => validatePosition(x.pos, `shades[${i}]`));
  if (s.drifters) s.drifters.forEach((x, i) => validatePosition(x.pos, `drifters[${i}]`));
  if (s.charms) s.charms.forEach((x, i) => validatePosition(x.pos, `charms[${i}]`));
  if (s.lanterns) s.lanterns.forEach((x, i) => {
    if (typeof x.id !== "string") throw new Error(`lanterns[${i}].id must be a string`);
    if (x.pos !== undefined) validatePosition(x.pos, `lanterns[${i}].pos`);
  });
  if (s.time_left_s !== undefined && (!Number.isFinite(s.time_left_s) || s.time_left_s < 0)) {
    throw new Error("time_left_s must be a non-negative number");
  }
}

export function validateInputs(i) {
  if (!i || typeof i !== "object" || Array.isArray(i) || !Array.isArray(i.frames)) {
    throw new Error("inputs must be an object with a frames array");
  }
  let previous = -1;
  i.frames.forEach((frame, index) => {
    if (!frame || !Number.isInteger(frame.tick) || frame.tick < 0 || frame.tick <= previous) {
      throw new Error(`frames[${index}] has an invalid or repeated tick`);
    }
    previous = frame.tick;
    if (frame.move !== undefined && (!Array.isArray(frame.move) || frame.move.length !== 2 ||
      frame.move.some((n) => typeof n !== "number" || n < -1 || n > 1))) {
      throw new Error(`frames[${index}].move must contain two numbers from -1 to 1`);
    }
    if (frame.cam_yaw_deg !== undefined && (typeof frame.cam_yaw_deg !== "number" || !Number.isFinite(frame.cam_yaw_deg))) {
      throw new Error(`frames[${index}].cam_yaw_deg must be a number`);
    }
    for (const key of ["jump", "interact", "pulse", "dash", "pause"]) {
      if (frame[key] !== undefined && typeof frame[key] !== "boolean") throw new Error(`frames[${index}].${key} must be boolean`);
    }
  });
}

function motePoints(night) {
  const points = [];
  if (night === 1) {
    for (let i = 0; i < 8; i++) points.push(polar(i * 45, 12));
    for (let i = 0; i < 16; i++) points.push(polar(i * 22.5, 33));
  } else if (night === 2) {
    for (const cx of [0, 70]) {
      for (let i = 0; i < 4; i++) points.push(polar(i * 90, 10, cx));
      for (let i = 0; i < 8; i++) points.push(polar(i * 45, 22, cx));
    }
  } else {
    for (let i = 0; i < 18; i++) points.push(polar(i * 20, 34));
    for (let i = 0; i < 8; i++) points.push(polar(20 + i * 20, 18));
    for (let i = 0; i < 4; i++) points.push(polar(45 + i * 90, 5));
  }
  return points;
}

function polar(degrees, radius, cx = 0) {
  const angle = degrees * Math.PI / 180;
  return [round3(cx + Math.cos(angle) * radius), 0, round3(Math.sin(angle) * radius)];
}

export class Game {
  constructor({ seed = 1, night = 1, scenario = {} } = {}) {
    validateScenario(scenario);
    this.seed = Number(seed) >>> 0;
    this.random = seededRandom(this.seed);
    this.night = [1, 2, 3].includes(Number(night)) ? Number(night) : 1;
    this.tickCount = 0;
    this.state = "playing";
    this.endReason = null;
    this.events = [];
    this.score = 0;
    this.totalWonScore = Number(scenario.total_score ?? 0);
    this.timeLeft = scenario.time_left_s ?? ({
      1: TUNING.night1_duration_s,
      2: TUNING.night2_duration_s,
      3: TUNING.night3_duration_s,
    })[this.night];
    this.map = NIGHT_MAPS[this.night];
    this.player = {
      pos: [scenario.player?.pos?.[0] ?? 0, scenario.player?.pos?.[1] ?? 0, scenario.player?.pos?.[2] ?? 0],
      vel: [0, 0, 0],
      facing: [0, 0, 1],
      flames: scenario.player?.flames ?? 3,
      carried: scenario.player?.carried ?? 0,
      invulnTicks: scenario.player?.invuln_ticks ?? 0,
      dashCdTicks: scenario.player?.dash_cd_ticks ?? 0,
      pulseCdTicks: scenario.player?.pulse_cd_ticks ?? 0,
      charmTicks: scenario.player?.charm_ticks ?? 0,
      dashTicks: 0,
      dashDir: [0, 0, 0],
      grounded: true,
      respawnWait: 0,
      fallUsed: false,
    };
    this.pauseRequested = false;
    this.previousPause = false;
    this.previousJump = false;
    this.previousInteract = false;
    this.previousPulse = false;
    this.previousDash = false;

    this.lanterns = (this.map.lanterns).map(([id, x, z]) => ({
      id, pos: [x, 0, z], lit: false, deposited: 0,
    }));
    for (const update of scenario.lanterns ?? []) {
      const lantern = this.lanterns.find((x) => x.id === update.id);
      if (!lantern) continue;
      if (update.pos) lantern.pos = [update.pos[0], update.pos[1] ?? 0, update.pos[2]];
      if (update.lit === true) lantern.lit = true;
      if (update.deposited !== undefined) {
        lantern.deposited = update.deposited;
        lantern.lit = update.lit === true || lantern.deposited >= TUNING.lantern_cost;
      }
    }

    this.motes = [];
    if (scenario.motes !== undefined) {
      this.motes = scenario.motes.map((m, i) => ({
        id: m.id ?? `M${i + 1}`,
        pos: [Array.isArray(m) ? m[0] : m.pos[0], Array.isArray(m) ? m[1] : m.pos[1] ?? 0, Array.isArray(m) ? m[2] : m.pos[2]],
        kind: m.kind ?? "random",
        ttlTicks: m.ttl_s !== undefined ? Math.round(m.ttl_s * 60) : (m.ttl_ticks ?? 480),
      }));
    } else if (scenario.random_motes !== false) {
      motePoints(this.night).slice(0, 20).forEach((pos, i) => {
        this.motes.push({ id: `M${i + 1}`, pos, kind: "random", ttlTicks: -1 });
      });
    }

    this.shades = [];
    if (scenario.shades !== undefined) {
      this.shades = scenario.shades.map((shade, i) => ({
        id: shade.id ?? `S${i + 1}`,
        pos: [shade.pos[0], shade.pos[1] ?? 0, shade.pos[2]],
        state: shade.state ?? "chase",
        stateTicksLeft: shade.state_ticks_left ?? 0,
        recoilTicks: shade.recoil_ticks ?? 0,
        stunTicks: shade.state === "stunned" ? (shade.state_ticks_left ?? 120) : 0,
      }));
    }
    this.nextShadeId = 1 + this.shades.length;
    this.nextDrifterId = 1;
    this.drifters = [];
    if (scenario.drifters !== undefined) {
      this.drifters = scenario.drifters.map((d, i) => ({
        id: d.id ?? `D${i + 1}`,
        pos: [d.pos[0], d.pos[1] ?? 0, d.pos[2]],
        state: d.state ?? "idle",
        stolen: d.stolen ?? 0,
        stolenDropped: d.stolen_dropped ?? 0,
      }));
      this.nextDrifterId = this.drifters.length + 1;
    }

    this.charms = [];
    if (scenario.charms !== undefined) {
      this.charms = scenario.charms.map((c, i) => ({
        id: c.id ?? `C${i + 1}`,
        pos: [c.pos[0], c.pos[1] ?? 0, c.pos[2]],
        available: c.available !== false,
        respawnTicks: c.respawn_s !== undefined ? Math.round(c.respawn_s * 60) : (c.respawn_ticks ?? 0),
      }));
    } else if (this.night === 2) {
      this.charms = [{ id: "C1", pos: [35, 0, 0], available: true, respawnTicks: 0 }];
    } else if (this.night === 3) {
      this.charms = [
        { id: "C1", pos: [30, 0, 25], available: true, respawnTicks: 0 },
        { id: "C2", pos: [-30, 0, 25], available: true, respawnTicks: 0 },
      ];
    }
    this.windEnabled = scenario.wind_enabled ?? (this.night === 3);
    this.wind = { active: false, dirDeg: 0, activeTicks: 0, warningTicks: 0 };
  }

  emit(name, data) {
    this.events.push({ type: "event", tick: this.tickCount, name, data });
  }

  applyInput(input = {}) {
    if (this.state === "paused") {
      this.tickCount += 1;
      if (input.pause === true && !this.previousPause) {
        this.state = "playing";
        this.emit("resumed", {});
      }
      this.previousPause = input.pause === true;
      return;
    }
    if (this.state !== "playing") return;
    this.tickCount += 1;

    if (input.pause === true && !this.previousPause) {
      this.state = "paused";
      this.emit("paused", {});
      this.previousPause = input.pause === true;
      return;
    }
    this.previousPause = input.pause === true;

    this.decrementCounters();
    this.movePlayer(input);
    this.pickup();
    if (input.interact === true && !this.previousInteract) this.deposit();
    this.updateSafeZones();
    if (input.pulse === true && !this.previousPulse) this.pulse();
    this.updateEnemies();
    this.updateWind();
    this.checkHits();
    this.spawnEntities();
    this.checkEnd();

    this.previousInteract = input.interact === true;
    this.previousPulse = input.pulse === true;
    this.previousDash = input.dash === true;
  }

  decrementCounters() {
    this.timeLeft = Math.max(0, this.timeLeft - 1 / 60);
    if (this.player.invulnTicks > 0) this.player.invulnTicks--;
    if (this.player.dashCdTicks > 0) this.player.dashCdTicks--;
    if (this.player.pulseCdTicks > 0) this.player.pulseCdTicks--;
    if (this.player.charmTicks > 0) this.player.charmTicks--;
    if (this.player.dashTicks > 0) this.player.dashTicks--;
    if (this.player.respawnWait > 0) this.player.respawnWait--;
    for (const shade of this.shades) {
      if (shade.stunTicks > 0) {
        shade.stunTicks--;
        shade.stateTicksLeft = shade.stunTicks;
        if (shade.stunTicks === 0) shade.state = "wander";
      }
    }
    for (const mote of this.motes) if (mote.ttlTicks > 0) mote.ttlTicks--;
    for (const charm of this.charms) {
      if (!charm.available) {
        charm.respawnTicks--;
        if (charm.respawnTicks <= 0) {
          charm.available = true;
          charm.respawnTicks = 0;
        }
      }
    }
  }

  movePlayer(input) {
    if (this.player.respawnWait > 0) {
      this.player.vel = [0, 0, 0];
      return;
    }
    if (input.jump === true && !this.previousJump && this.player.grounded) {
      this.player.vel[1] = 7;
      this.player.grounded = false;
      this.emit("jump", {});
    }
    this.previousJump = input.jump === true;

    if (input.dash === true && !this.previousDash &&
        this.player.dashCdTicks === 0 && this.player.dashTicks === 0) {
      const move = input.move ?? [0, 0];
      const len = Math.hypot(move[0], move[1]);
      if (len > 0) {
        const x = move[0] / Math.max(1, len);
        const z = move[1] / Math.max(1, len);
        const theta = ((input.cam_yaw_deg ?? 0) * Math.PI) / 180;
        this.player.dashDir = [x * Math.cos(theta) + z * Math.sin(theta), 0, -x * Math.sin(theta) + z * Math.cos(theta)];
      } else {
        this.player.dashDir = [...this.player.facing];
      }
      this.player.dashTicks = Math.round(TUNING.dash_duration_s * 60);
      this.player.dashCdTicks = this.player.charmTicks > 0
        ? 0
        : Math.round(TUNING.dash_cooldown_s * 60);
      this.emit("dash", {});
    }

    const move = input.move ?? [0, 0];
    let len = Math.hypot(move[0], move[1]);
    let mx = 0, mz = 0;
    if (len > 0) {
      mx = move[0] / Math.max(1, len);
      mz = move[1] / Math.max(1, len);
      const theta = ((input.cam_yaw_deg ?? 0) * Math.PI) / 180;
      mx = mx * Math.cos(theta) + mz * Math.sin(theta);
      mz = -move[0] / Math.max(1, len) * Math.sin(theta) + (move[1] / Math.max(1, len)) * Math.cos(theta);
      const facingLen = Math.hypot(mx, mz);
      if (facingLen > 0) this.player.facing = [mx / facingLen, 0, mz / facingLen];
    }

    if (this.player.dashTicks > 0) {
      this.player.pos[0] += this.player.dashDir[0] * TUNING.dash_speed / 60;
      this.player.pos[2] += this.player.dashDir[2] * TUNING.dash_speed / 60;
    } else {
      const speed = this.player.charmTicks > 0 ? 7.2 : TUNING.player_speed;
      this.player.pos[0] += mx * speed / 60;
      this.player.pos[2] += mz * speed / 60;
    }

    if (!this.player.grounded) {
      this.player.vel[1] -= 20 / 60;
      this.player.pos[1] += this.player.vel[1] / 60;
      if (this.player.pos[1] <= 0) {
        this.player.pos[1] = 0;
        this.player.vel[1] = 0;
        this.player.grounded = true;
      }
    }

    this.player.pos = this.player.pos.map((n, i) => i === 1 ? round3(n) : round3(n));
    if (TUNING.fall_enabled && this.player.pos[1] < -10 && !this.player.fallUsed) {
      this.player.fallUsed = true;
      this.player.flames--;
      const lost = this.player.carried;
      this.player.carried = 0;
      this.emit("player_hit", {
        by: "fall",
        flames: this.player.flames,
        dropped: lost,
        lost,
      });
      if (this.player.flames <= 0) {
        this.player.flames = 0;
        this.finish("lost", "no_flames");
        return;
      }
      this.player.respawnWait = 60;
      this.player.pos = [0, 0, 0];
      this.player.vel = [0, 0, 0];
      this.player.invulnTicks = 90;
      this.player.grounded = true;
    }
  }

  pickup() {
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const mote = this.motes[i];
      if (this.player.carried >= TUNING.carry_capacity) break;
      if (distXZ(this.player.pos, mote.pos) <= TUNING.pickup_radius &&
          Math.abs(this.player.pos[1] - mote.pos[1]) <= 1.5) {
        if (mote.kind === "dropped" && mote.ttlTicks === 0) continue;
        this.motes.splice(i, 1);
        this.player.carried++;
        this.emit("mote_picked", { carried: this.player.carried });
      }
    }
    for (const charm of this.charms) {
      if (charm.available && distXZ(this.player.pos, charm.pos) <= TUNING.pickup_radius &&
          Math.abs(this.player.pos[1] - charm.pos[1]) <= 1.5) {
        charm.available = false;
        charm.respawnTicks = 2700;
        this.player.charmTicks = 600;
        this.emit("charm_picked", { charm_id: charm.id, charm_ticks: 600 });
      }
    }
  }

  deposit() {
    const candidates = this.lanterns
      .filter((l) => !l.lit)
      .filter((l) => distXZ(this.player.pos, l.pos) <= TUNING.interact_radius)
      .sort((a, b) => distXZ(this.player.pos, a.pos) - distXZ(this.player.pos, b.pos) || a.id.localeCompare(b.id));
    const lantern = candidates[0];
    if (!lantern || this.player.carried <= 0) return;
    const amount = Math.min(this.player.carried, TUNING.lantern_cost - lantern.deposited);
    if (amount <= 0) return;
    lantern.deposited += amount;
    this.player.carried -= amount;
    this.score += amount * TUNING.score.per_mote;
    this.emit("deposit", { lantern_id: lantern.id, amount, deposited: lantern.deposited });
    if (lantern.deposited >= TUNING.lantern_cost) {
      lantern.lit = true;
      this.score += TUNING.score.per_lantern;
      this.emit("lantern_lit", { lantern_id: lantern.id });
    }
  }

  updateSafeZones() {
    for (const shade of this.shades) {
      if (shade.state === "stunned") continue;
      for (const lantern of this.lanterns) {
        if (!lantern.lit) continue;
        const d = distXZ(shade.pos, lantern.pos);
        if (d < TUNING.safe_radius) {
          const dx = shade.pos[0] - lantern.pos[0];
          const dz = shade.pos[2] - lantern.pos[2];
          const len = Math.hypot(dx, dz) || 1;
          shade.pos[0] = round3(lantern.pos[0] + dx / len * TUNING.safe_radius);
          shade.pos[2] = round3(lantern.pos[2] + dz / len * TUNING.safe_radius);
        }
      }
    }
  }

  pulse() {
    if (this.player.pulseCdTicks > 0 || this.player.carried < TUNING.pulse_cost) return;
    this.player.carried -= TUNING.pulse_cost;
    this.player.pulseCdTicks = Math.round(TUNING.pulse_cooldown_s * 60);
    const center = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
    const stunnedIds = [];
    for (const shade of this.shades) {
      if (dist3(center, shade.pos) <= TUNING.pulse_radius) {
        shade.state = "stunned";
        shade.stunTicks = 120;
        shade.stateTicksLeft = 120;
        stunnedIds.push(shade.id);
        this.score += TUNING.score.per_stun;
        const dx = shade.pos[0] - this.player.pos[0];
        const dz = shade.pos[2] - this.player.pos[2];
        const len = Math.hypot(dx, dz);
        if (len > 0) {
          shade.pos[0] = round3(shade.pos[0] + dx / len * TUNING.pulse_push_m);
          shade.pos[2] = round3(shade.pos[2] + dz / len * TUNING.pulse_push_m);
        } else {
          shade.pos[0] = round3(shade.pos[0] + TUNING.pulse_push_m);
        }
      }
    }
    for (const drifter of this.drifters) {
      if (dist3(center, drifter.pos) > TUNING.pulse_radius) continue;
      if (drifter.state === "chase") {
        drifter.state = "flee";
        drifter.stolenDropped = 0;
      } else if (drifter.state === "flee" && drifter.stolen > 0) {
        for (let i = 0; i < drifter.stolen; i++) {
          const angle = this.random() * Math.PI * 2;
          this.motes.push({
            id: `MD${this.tickCount}-${i}`,
            pos: [round3(drifter.pos[0] + Math.cos(angle) * 1.5), 0, round3(drifter.pos[2] + Math.sin(angle) * 1.5)],
            kind: "dropped", ttlTicks: 480,
          });
        }
        this.emit("drifter_drop", { drifter_id: drifter.id, amount: drifter.stolen });
        drifter.stolen = 0;
      }
    }
    this.emit("pulse", { stunned_ids: stunnedIds });
  }

  updateEnemies() {
    for (const shade of this.shades) {
      if (shade.state === "stunned") continue;
      if (shade.state === "recoil") {
        shade.recoilTicks--;
        if (shade.recoilTicks <= 0) shade.state = "chase";
      }
      let dx = this.player.pos[0] - shade.pos[0];
      let dz = this.player.pos[2] - shade.pos[2];
      const d = Math.hypot(dx, dz);
      if (d > 18) {
        shade.state = "wander";
      } else if (d <= 12) {
        shade.state = "chase";
      }
      if (shade.state === "chase" || shade.state === "recoil") {
        if (d > 0) {
          const speed = this.night === 3 ? 4.5 : TUNING.shade_speed;
          shade.pos[0] = round3(shade.pos[0] + dx / d * speed / 60);
          shade.pos[2] = round3(shade.pos[2] + dz / d * speed / 60);
        }
      }
    }
    for (const drifter of this.drifters) {
      if (drifter.state === "removed") continue;
      const d = distXZ(this.player.pos, drifter.pos);
      if (drifter.state === "idle" && this.player.carried >= 5 && d <= 15) drifter.state = "chase";
      if (drifter.state === "chase" && (this.player.carried < 5 || d > 15)) drifter.state = "idle";
      if (drifter.state === "flee") {
        drifter.fleeTicks = (drifter.fleeTicks ?? 240) - 1;
        let dx = drifter.pos[0] - this.player.pos[0];
        let dz = drifter.pos[2] - this.player.pos[2];
        const len = Math.hypot(dx, dz) || 1;
        drifter.pos[0] = round3(drifter.pos[0] + dx / len * 7 / 60);
        drifter.pos[2] = round3(drifter.pos[2] + dz / len * 7 / 60);
        if (drifter.fleeTicks <= 0) drifter.state = "removed";
      } else if (drifter.state === "chase") {
        const dx = this.player.pos[0] - drifter.pos[0];
        const dz = this.player.pos[2] - drifter.pos[2];
        const len = Math.hypot(dx, dz) || 1;
        drifter.pos[0] = round3(drifter.pos[0] + dx / len * 7 / 60);
        drifter.pos[2] = round3(drifter.pos[2] + dz / len * 7 / 60);
      }
    }
  }

  updateWind() {
    if (!this.windEnabled) return;
    if (this.tickCount > 0 && this.tickCount % 1800 === 1780) {
      this.wind.warningTicks = 120;
      this.wind.dirDeg = Math.floor(this.random() * 360);
    }
    if (this.tickCount > 0 && this.tickCount % 1800 === 0) {
      this.wind.active = true;
      this.wind.activeTicks = 300;
    }
    if (this.wind.activeTicks > 0) {
      this.wind.activeTicks--;
      const angle = this.wind.dirDeg * Math.PI / 180;
      this.player.pos[0] = round3(this.player.pos[0] + Math.cos(angle) * 2 / 60);
      this.player.pos[2] = round3(this.player.pos[2] + Math.sin(angle) * 2 / 60);
      if (this.wind.activeTicks === 0) this.wind.active = false;
    }
  }

  checkHits() {
    for (const drifter of this.drifters) {
      if (drifter.state !== "chase") continue;
      if (distXZ(this.player.pos, drifter.pos) <= 1.2 &&
          Math.abs(this.player.pos[1] - drifter.pos[1]) <= 1.5 &&
          !drifter.stealUsed) {
        drifter.stealUsed = true;
        const amount = Math.min(3, this.player.carried);
        this.player.carried -= amount;
        drifter.stolen = amount;
        drifter.state = "flee";
        drifter.fleeTicks = 240;
        this.emit("drifter_steal", { drifter_id: drifter.id, amount, carried: this.player.carried });
      }
    }
    for (const shade of this.shades.sort((a, b) => a.id.localeCompare(b.id))) {
      if (shade.state === "stunned") continue;
      if (distXZ(this.player.pos, shade.pos) <= TUNING.shade_hit_radius &&
          Math.abs(this.player.pos[1] - shade.pos[1]) <= 1.5 &&
          this.player.invulnTicks === 0) {
        this.player.flames--;
        this.player.invulnTicks = 90;
        const dropped = Math.floor(this.player.carried / 2);
        this.player.carried -= dropped;
        for (let i = 0; i < dropped; i++) {
          const angle = this.random() * Math.PI * 2;
          const radius = 1.5 + this.random();
          this.motes.push({
            id: `MD${this.tickCount}-${i}`,
            pos: [round3(this.player.pos[0] + Math.cos(angle) * radius), 0, round3(this.player.pos[2] + Math.sin(angle) * radius)],
            kind: "dropped", ttlTicks: 480,
          });
        }
        shade.state = "recoil";
        shade.recoilTicks = 60;
        this.emit("player_hit", { by: "shade", flames: this.player.flames, dropped });
        if (this.player.flames <= 0) {
          this.player.flames = 0;
          this.finish("lost", "no_flames");
        }
        break;
      }
    }
  }

  spawnEntities() {
    if (this.tickCount > 0 && this.tickCount % 240 === 0) {
      const active = this.motes.filter((m) => m.kind === "random").length;
      if (active < 30) {
        const occupied = new Set(this.motes.map((m) => `${m.pos[0]},${m.pos[2]}`));
        const point = motePoints(this.night).find((p) => !occupied.has(`${p[0]},${p[2]}`));
        if (point) this.motes.push({ id: `M${this.tickCount}`, pos: point, kind: "random", ttlTicks: -1 });
      }
    }
    if (this.night === 1) {
      if (this.tickCount === 300) this.spawnShades(2);
      else if (this.tickCount >= 780 && (this.tickCount - 780) % 480 === 0 && this.shades.length < 6) this.spawnShades(1);
    } else if (this.night === 2) {
      if (this.tickCount >= 420 && (this.tickCount - 420) % 420 === 0 && this.shades.length < 8) this.spawnShades(1);
    } else if (this.night === 3) {
      if (this.tickCount >= 360 && (this.tickCount - 360) % 360 === 0 && this.shades.length < 10) this.spawnShades(1);
    }
    if (this.night >= 2 && this.tickCount >= 1200 && (this.tickCount - 1200) % 1200 === 0 &&
        this.drifters.filter((d) => d.state !== "removed").length < 2) {
      const angle = this.random() * Math.PI * 2;
      const center = this.night === 2 ? (this.random() < 0.5 ? [0, 0, 0] : [70, 0, 0]) : [0, 0, 0];
      const pos = [round3(center[0] + Math.cos(angle) * 20), 0, round3(center[2] + Math.sin(angle) * 20)];
      const id = `D${this.nextDrifterId++}`;
      this.drifters.push({ id, pos, state: "idle", stolen: 0, fleeTicks: 240 });
      this.emit("shade_spawned", { id });
    }
  }

  spawnShades(count) {
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2;
      const radius = this.night === 1 ? 37 : this.night === 2 ? 26 : 43;
      let pos = [round3(Math.cos(angle) * radius + (this.night === 2 && this.random() < 0.5 ? 70 : 0)), 0, round3(Math.sin(angle) * radius)];
      if (distXZ(pos, this.player.pos) < 15) continue;
      const id = `S${this.nextShadeId++}`;
      this.shades.push({ id, pos, state: "wander", stateTicksLeft: 0, recoilTicks: 0, stunTicks: 0 });
      this.emit("shade_spawned", { id });
    }
  }

  checkEnd() {
    if (this.player.flames <= 0) {
      this.finish("lost", "no_flames");
    } else if (this.lanterns.every((l) => l.lit)) {
      this.finish("won", "all_lit");
    } else if (this.timeLeft <= 0) {
      this.finish("lost", "dawn");
    }
  }

  finish(state, reason) {
    if (this.state !== "playing") return;
    this.state = state;
    this.endReason = reason;
    if (state === "won") {
      this.score += Math.floor(this.timeLeft) * TUNING.score.per_second_left;
      this.score += this.player.flames * TUNING.score.per_flame_left;
      this.totalWonScore += this.score;
    }
    this.emit("game_over", { result: state, reason });
  }

  snapshot(tick = this.tickCount) {
    const windDir = this.wind.dirDeg ?? 0;
    return {
      type: "snapshot",
      tick,
      sim_tick: tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(this.timeLeft),
      score: this.score,
      wind: { active: this.wind.active, dir_deg: windDir },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        flames: this.player.flames,
        carried: this.player.carried,
        grounded: this.player.grounded,
        invuln: this.player.invulnTicks,
        dash_cd_s: round3(this.player.dashCdTicks / 60),
        pulse_cd_s: round3(this.player.pulseCdTicks / 60),
        charm_s: round3(this.player.charmTicks / 60),
      },
      lanterns: this.lanterns.map((l) => ({ id: l.id, pos: l.pos.map(round3), lit: l.lit, deposited: l.deposited })),
      shades: this.shades.map((s) => ({ id: s.id, pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])], state: s.state })),
      motes_active: this.motes.length,
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: m.pos.map(round3),
        kind: m.kind,
        ttl_s: m.ttlTicks < 0 ? -1 : round3(m.ttlTicks / 60),
      })),
      drifters: this.drifters.filter((d) => d.state !== "removed").map((d) => ({
        id: d.id, pos: d.pos.map(round3), state: d.state, stolen: d.stolen,
      })),
      charms: this.charms.map((c) => ({
        id: c.id, pos: c.pos.map(round3), available: c.available,
        respawn_s: round3(c.respawnTicks / 60),
      })),
    };
  }

  end() {
    return { type: "end", ticks: this.tickCount, state: this.state, score: this.score };
  }
}
