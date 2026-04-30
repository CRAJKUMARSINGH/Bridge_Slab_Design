import { createApp } from "./app-factory";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import logger from "./logger";

const app = createApp({ cors: false, logging: true });
const httpServer = registerRoutes(app);

serveStatic(app);

const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(port, "0.0.0.0", () => {
  logger.info(`Production server listening on http://localhost:${port}`);
});

export default {};
