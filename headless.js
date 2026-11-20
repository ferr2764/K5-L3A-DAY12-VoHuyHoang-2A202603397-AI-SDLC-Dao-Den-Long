#!/usr/bin/env node
import fs from "node:fs";
import { Game, validateScenario, validateInputs } from "./src/game.js";

function usageError(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith("--") || argv[i + 1] === undefined) {
      usageError(`invalid argument at ${argv[i] ?? "end"}`);
    }
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

function readJson(path, label) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    usageError(`invalid ${label} JSON: ${error.message}`);
  }
}

const args = parseArgs(process.argv);
const ticks = Number(args.ticks);
const seed = args.seed === undefined ? 1 : Number(args.seed);
const snapshotEvery = args["snapshot-every"] === undefined
  ? 10
  : Number(args["snapshot-every"]);

if (!Number.isInteger(ticks) || ticks < 0) usageError("--ticks must be a non-negative integer");
if (!Number.isInteger(seed)) usageError("--seed must be an integer");
if (!Number.isInteger(snapshotEvery) || snapshotEvery <= 0) {
  usageError("--snapshot-every must be a positive integer");
}
if (!args.out) usageError("--out is required");
if (args.night !== undefined && ![1, 2, 3].includes(Number(args.night))) {
  usageError("--night must be 1, 2, or 3");
}

let scenario = {};
let inputDocument = null;
try {
  if (args.scenario) {
    scenario = readJson(args.scenario, "scenario");
    validateScenario(scenario);
  }
  if (args.inputs) {
    inputDocument = readJson(args.inputs, "inputs");
    validateInputs(inputDocument);
  }
} catch (error) {
  usageError(error.message);
}

const game = new Game({
  seed,
  night: args.night === undefined ? 1 : Number(args.night),
  scenario,
});
const lines = [JSON.stringify(game.snapshot(0))];
const frames = inputDocument?.frames ?? [];
let frameIndex = 0;
let input = {
  move: [0, 0],
  cam_yaw_deg: 0,
  jump: false,
  interact: false,
  pulse: false,
  dash: false,
};

for (let step = 0; step < ticks && game.state !== "won" && game.state !== "lost"; step++) {
  while (frameIndex < frames.length && frames[frameIndex].tick === step) {
    input = { ...input, ...frames[frameIndex] };
    frameIndex += 1;
  }

  game.applyInput(input);
  for (const event of game.events) {
    if (event.tick === step + 1) lines.push(JSON.stringify(event));
  }
  if ((step + 1) % snapshotEvery === 0) {
    lines.push(JSON.stringify(game.snapshot(step + 1)));
  }
  if (game.state !== "playing") break;
}

lines.push(JSON.stringify(game.end()));
fs.writeFileSync(args.out, `${lines.join("\n")}\n`);
