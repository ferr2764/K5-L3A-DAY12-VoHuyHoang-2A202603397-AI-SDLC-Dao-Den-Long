#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import puppeteer from "puppeteer-core";

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

const port = 4174;
const server = spawn(process.execPath, [
  "./node_modules/vite/bin/vite.js",
  "--host",
  "127.0.0.1",
  "--port",
  String(port),
  "--strictPort",
], {
  stdio: "ignore",
});

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error("Vite benchmark server did not start");
}

try {
  const processStart = process.hrtime.bigint();
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new",
    args: [
      "--window-size=1280,720",
      "--force-device-scale-factor=1",
      "--disable-gpu-vsync",
      "--disable-frame-rate-limit",
      "--disable-vsync-for-tests",
      "--use-gl=swiftshader",
      "--enable-webgl",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${port}/?bench=1&seed=${seed}`, {
    waitUntil: "networkidle0",
  });
  const loadedAt = Number(process.hrtime.bigint() - processStart) / 1e6;

  const measured = await page.evaluate(async (durationSeconds) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const dt = [];
    let previous = performance.now();
    const end = previous + durationSeconds * 1000;
    await new Promise((resolve) => {
      function frame(now) {
        dt.push(now - previous);
        previous = now;
        if (now >= end) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return {
      dt,
      firstFrame: dt.length > 0 ? performance.now() : 0,
    };
  }, duration);

  const elapsedLoad = loadedAt + 3000;
  await browser.close();

  const dt = measured.dt;
  const frames = dt.length;
  if (frames === 0) throw new Error("Benchmark collected no frames");
  const totalMs = dt.reduce((sum, value) => sum + value, 0);
  const sorted = [...dt].sort((a, b) => b - a);
  const k = Math.max(1, Math.ceil(0.01 * frames));
  const p1Low = 1000 / (sorted.slice(0, k).reduce((sum, value) => sum + value, 0) / k);
  const ordered = [...dt].sort((a, b) => a - b);
  const p95 = ordered[Math.min(frames - 1, Math.ceil(frames * 0.95) - 1)];

  const result = {
    contract_version: "1.3",
    avg_fps: Number((1000 * frames / totalMs).toFixed(1)),
    p1_low_fps: Number(p1Low.toFixed(1)),
    frame_ms_p95: Number(p95.toFixed(1)),
    frames,
    load_ms: Math.max(1, Math.round(elapsedLoad)),
    peak_mem_mb: null,
    vsync_off: true,
    renderer: `Three.js ${process.versions.node} / Chrome headless / WebGL`,
    os: `${process.platform} ${os.release()} ${os.arch()}`,
  };
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
} finally {
  server.kill("SIGTERM");
}
