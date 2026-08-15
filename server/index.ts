import { createApp } from "./app-factory";
import logger from "./logger";

const port = parseInt(process.env.PORT || "5000", 10);

(async () => {
  const app = createApp({
    cors: process.env.NODE_ENV !== "production",
    logging: true
  });

  app.listen(port, "0.0.0.0", () => {
    logger.info(`Server listening on http://localhost:${port}`);
  });
})();

export default {};
