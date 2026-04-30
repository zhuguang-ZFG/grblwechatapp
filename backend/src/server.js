const { buildApp } = require("./app");
const env = require("./config/env");

async function start() {
  const app = buildApp();
  await app.listen({
    port: env.port,
    host: env.host
  });
  console.log(`kxapp-backend listening on http://${env.host}:${env.port}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
