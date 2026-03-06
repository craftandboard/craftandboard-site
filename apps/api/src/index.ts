import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

const app = createApp();

app.listen(env.PORT_API, () => {
  logger.info(`Listening on http://localhost:${env.PORT_API}`);
});
