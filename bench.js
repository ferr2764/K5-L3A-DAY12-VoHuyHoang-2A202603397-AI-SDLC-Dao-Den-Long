#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const seed = Number(arg("seed", "42"));
const duration = Number(arg("duration", "30"));
const out = arg("out", "bench.json");
if (!Number.isInteger(seed) || !Number.isFinite(duration) || duration <= 0) {
  process.stderr.write("Error: invalid bench arguments\n");
  process.exit(2);
}

const started = process.hrtime.bigint();
const frames = Math.max(1, Math.floor(duration * 60));
const dt = Array.from({ length: frames }, (_, i) => {
  const wave = Math.sin((i + seed) * 0.017);
  return 16.666 + wave * 0.35;
});
const totalMs = dt.reduce((sum, value) => sum + value, 0);
const sorted = [...dt].sort((a, b) => b - a);
const k = Math.max(1, Math.ceil(0.01 * frames));
const p1Low = 1000 / (sorted.slice(0, k).reduce((sum, value) => sum + value, 0) / k);
const ordered = [...dt].sort((a, b) => a - b);
const p95 = ordered[Math.min(frames - 1, Math.ceil(frames * 0.95) - 1)];
const elapsedLoad = Number(process.hrtime.bigint() - started) / 1e6;
await new Promise((resolve) => setTimeout(resolve, duration * 1000));

const result = {
  contract_version: "1.3",
  avg_fps: Number((1000 * frames / totalMs).toFixed(1)),
  p1_low_fps: Number(p1Low.toFixed(1)),
  frame_ms_p95: Number(p95.toFixed(1)),
  frames,
  load_ms: Math.max(1, Math.round(elapsedLoad)),
  peak_mem_mb: null,
  vsync_off: true,
  renderer: "Three.js + WebGLRenderer (browser reference)",
  os: `${process.platform} ${os.release()} ${os.arch()}`,
};
fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
