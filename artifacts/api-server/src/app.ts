import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { createProxyMiddleware } from "http-proxy-middleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bridge Design Suite proxy — forward /api/design and /suite to the app on port 5000
const SUITE_PORT = process.env.SUITE_PORT || "5000";
const suiteProxy = createProxyMiddleware({
  target: `http://localhost:${SUITE_PORT}`,
  changeOrigin: true,
  ws: true,
  on: {
    error: (_err, _req, res) => {
      if (res && "status" in res) {
        (res as express.Response)
          .status(502)
          .send("Bridge Design Suite is starting — please wait a moment and refresh.");
      }
    },
  },
});

// Proxy the React frontend and its Vite assets
app.use("/suite", suiteProxy);

// Proxy the design API — pathRewrite restores the /api/design prefix that
// Express strips when using app.use() with a sub-path mount.
app.use("/api/design", createProxyMiddleware({
  target: `http://localhost:${SUITE_PORT}`,
  changeOrigin: true,
  ws: true,
  pathRewrite: (path) => `/api/design${path}`,
  on: {
    error: (_err, _req, res) => {
      if (res && "status" in res) {
        (res as express.Response)
          .status(502)
          .send("Bridge Design Suite is starting — please wait a moment and refresh.");
      }
    },
  },
}));

// Health endpoint for the bridge suite (check if it is up)
app.get("/api/suite-health", async (_req, res) => {
  try {
    const { default: http } = await import("http");
    await new Promise<void>((resolve, reject) => {
      http.get(`http://localhost:${SUITE_PORT}/api/health`, (r) => {
        r.resume();
        r.on("end", resolve);
      }).on("error", reject);
    });
    res.json({ status: "up", port: SUITE_PORT });
  } catch {
    res.status(503).json({ status: "down", port: SUITE_PORT });
  }
});

app.use("/api", router);

export default app;
