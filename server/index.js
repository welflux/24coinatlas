import { createApplication } from "./app.js";
process.umask(0o077);
const { app, db, config } = createApplication();
const server = app.listen(config.port, "0.0.0.0", () =>
  console.log(`24CoinAtlas API listening on port ${config.port}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
