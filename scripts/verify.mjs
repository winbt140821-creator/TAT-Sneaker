// Pre-push check: a real production build, served by `next start`, run
// through scripts/smoke.mjs. `next dev` is not enough — see the header of
// smoke.mjs for the outages that only a production build reproduces.
//
// Usage: npm run verify   (uses the local database from .env)
import { spawn, execSync } from "node:child_process";

const PORT = 3123;
// next.config.ts gives any PORT other than 3000 its own distDir, so the
// build and the server below both run with PORT set — they agree on where
// the build lives, and neither touches a dev server's .next on port 3000.
const env = { ...process.env, PORT: String(PORT) };

// `next build` directly, not `npm run build` — that one also replays
// migrations against Turso, which must only ever happen on Vercel.
execSync("npx next build", { stdio: "inherit", env });

const server = spawn(`npx next start -p ${PORT}`, { shell: true, stdio: "ignore", env });
const stop = () => {
  if (process.platform === "win32") {
    try { execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" }); } catch {}
  } else {
    server.kill("SIGTERM");
  }
};

let code = 1;
try {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/robots.txt`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  const smoke = spawn(process.execPath, ["scripts/smoke.mjs", `http://localhost:${PORT}`], { stdio: "inherit" });
  code = await new Promise((resolve) => smoke.on("exit", resolve));
} finally {
  stop();
}
process.exit(code);
