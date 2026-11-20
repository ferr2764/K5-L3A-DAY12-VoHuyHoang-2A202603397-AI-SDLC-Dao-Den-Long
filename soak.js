#!/usr/bin/env node
import fs from "node:fs";
import { Game } from "./src/game.js";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const seed = Number(arg("seed", "7"));
const nights = Number(arg("nights", "10"));
const out = arg("out", "soak.json");
if (!Number.isInteger(seed) || !Number.isInteger(nights) || nights <= 0) {
  process.stderr.write("Error: invalid soak arguments\n");
  process.exit(2);
}

function rssMb() {
  return process.memoryUsage().rss / 1024 / 1024;
}

const startTime = Date.now();
const durationByNight = [240, 270, 300];
let crashes = 0;
const results = [];
let memStart = null;

let warmGame = new Game({ seed: seed, night: 1, scenario: {} });
for (let step = 0; step < durationByNight[0] * 60 && warmGame.state === "playing"; step++) {
  warmGame.applyInput({ move: [0, 0] });
}
warmGame = null;
if (global.gc) global.gc();
memStart = rssMb();

for (let i = 0; i < nights; i++) {
  const night = (i % 3) + 1;
  const gameSeed = seed + i;
  let game;
  try {
    game = new Game({ seed: gameSeed, night, scenario: {} });
    let direction = 0;
    for (let step = 0; step < durationByNight[night - 1] * 60 && game.state === "playing"; step++) {
      if (step % 30 === 0) direction = (gameSeed * 1103515245 + step) % 360;
      const angle = direction * Math.PI / 180;
      const move = [Math.cos(angle), Math.sin(angle)];
      game.applyInput({
        move,
        jump: ((gameSeed + step * 17) % 20) === 0,
        dash: ((gameSeed + step * 31) % 33) === 0,
        interact: ((gameSeed + step * 29) % 10) === 0,
        pulse: ((gameSeed + step * 43) % 50) === 0,
        pause: false,
      });
    }
    results.push(game.state);
    game = null;
    if (global.gc) global.gc();
  } catch (error) {
    crashes++;
    results.push("crash");
  }
}

const memEnd = rssMb();
const output = {
  nights,
  crashes,
  results,
  mem_start_mb: Number(memStart.toFixed(1)),
  mem_end_mb: Number(memEnd.toFixed(1)),
  duration_s: Number(((Date.now() - startTime) / 1000).toFixed(1)),
};
fs.writeFileSync(out, `${JSON.stringify(output)}\n`);
