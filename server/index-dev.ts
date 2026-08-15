import { createApp } from "./app-factory";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { existsSync } from "node:fs";

(async () => {
  const app = createApp({ cors: true, logging: true });
  
  // Register routes (returns http server)
  const server = registerRoutes(app);

  // Allow API-only startup when client app sources are unavailable.
  const clientEntry = path.resolve(process.cwd(), "client", "src", "main.tsx");
  if (existsSync(clientEntry)) {
    // Setup vite in development (middleware attaches to this HTTP server)
    await setupVite(app, server);
  } else {
    log("client/src/main.tsx missing; starting API-only dev server", "vite");
  }

  const configuredPort = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";
  const maxAttempts = 10;
  let attempts = 0;

  const listenWithRetry = (port: number) => {
    server.listen(port, host, () => {
      const address = server.address() as AddressInfo | null;
      const activePort = address?.port ?? port;
      console.log(`Dev server http://localhost:${activePort}`);
    });
  };

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code !== "EADDRINUSE") throw error;

    attempts += 1;
    if (attempts >= maxAttempts) {
      throw new Error(`No free port found after ${maxAttempts} attempts, starting from ${configuredPort}`);
    }

    const nextPort = configuredPort + attempts;
    log(`Port ${configuredPort + attempts - 1} busy, retrying on ${nextPort}`, "server");
    listenWithRetry(nextPort);
  });

  listenWithRetry(configuredPort);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌉 Bridge Design System - Enhanced                     ║
║                                                           ║
║   ✅ 1,482+ IRC Formulas                                  ║
║   ✅ 47-Sheet Excel Generation                            ║
║   ✅ Beautiful Modern UI                                  ║
║   ✅ Real-time Calculations                               ║
║   ║
╚═══════════════════════════════════════════════════════════╝
  `);
})();

export default {};
