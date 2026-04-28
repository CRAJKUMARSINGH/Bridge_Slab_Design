import { createApp } from "./app-factory";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

(async () => {
  const app = createApp({ cors: true, logging: true });
  
  // Register routes (returns http server)
  const server = registerRoutes(app);

  // Setup vite in development (middleware attaches to this HTTP server)
  await setupVite(app, server);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Dev server http://localhost:${port}`);
  });

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
