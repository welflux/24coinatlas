import { spawn } from "node:child_process";
const api = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "server/index.js"],
  { stdio: "inherit" },
);
const web = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
  { stdio: "inherit" },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill("SIGTERM");
  web.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500).unref();
}
for (const child of [api, web]) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => stop(code || 0));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
