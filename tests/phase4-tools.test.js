import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

test("bench command creates contract 1.3 benchmark JSON", () => {
  const out = "test-bench.json";
  const run = spawnSync(process.execPath, ["bench.js", "--seed", "42", "--duration", "1", "--out", out], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const bench = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(bench.contract_version, "1.3");
  assert.equal(typeof bench.avg_fps, "number");
  assert.equal(typeof bench.frames, "number");
  fs.unlinkSync(out);
});

test("soak command completes 10 nights without crashes", () => {
  const out = "test-soak.json";
  const run = spawnSync(process.execPath, ["soak.js", "--seed", "7", "--nights", "10", "--out", out], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const soak = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(soak.nights, 10);
  assert.equal(soak.crashes, 0);
  assert.equal(soak.results.length, 10);
  fs.unlinkSync(out);
});

test("leaderboard export creates ordered entries JSON", () => {
  const out = "test-leaderboard.json";
  const run = spawnSync(process.execPath, ["leaderboard.js", "--export-leaderboard", out], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const data = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.deepEqual(Object.keys(data), ["entries"]);
  fs.unlinkSync(out);
});
