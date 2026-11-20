#!/usr/bin/env node
import fs from "node:fs";

const args = process.argv.slice(2);
const exportIndex = args.indexOf("--export-leaderboard");
if (exportIndex >= 0) {
  const out = args[exportIndex + 1];
  if (!out) {
    process.stderr.write("Error: --export-leaderboard requires a file\n");
    process.exit(2);
  }
  let entries = [];
  try {
    entries = JSON.parse(fs.readFileSync("leaderboard.json", "utf8")).entries ?? [];
  } catch {}
  entries = entries
    .slice()
    .sort((a, b) => b.score - a.score ||
      new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime())
    .slice(0, 10);
  fs.writeFileSync(out, `${JSON.stringify({ entries }, null, 2)}\n`);
  process.exit(0);
}
