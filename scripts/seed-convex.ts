/**
 * Loads dummy garages and items into the Convex DB.
 *
 * Prerequisites:
 * 1. Set CONVEX_SEED_SECRET in your Convex dashboard (Settings → Environment Variables).
 * 2. Add the same value to .env.local: CONVEX_SEED_SECRET=your-secret
 *
 * Run: bun run seed
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

// Load .env.local so CONVEX_SEED_SECRET is available
function loadEnvLocal() {
  try {
    const content = readFileSync(join(root, ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*CONVEX_SEED_SECRET\s*=\s*(.+?)\s*$/);
      if (m) {
        const val = m[1].replace(/^["']|["']$/g, "").trim();
        process.env.CONVEX_SEED_SECRET = val;
        break;
      }
    }
  } catch {
    // .env.local optional
  }
}

loadEnvLocal();

const secret = process.env.CONVEX_SEED_SECRET;
if (!secret) {
  console.error(
    "Missing CONVEX_SEED_SECRET. Set it in Convex Dashboard and in .env.local, then run again."
  );
  process.exit(1);
}

const args = ["convex", "run", "seed:runSeed", JSON.stringify({ secret })];

const child = spawn("bunx", args, {
  stdio: "inherit",
  shell: true,
  cwd: root,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
