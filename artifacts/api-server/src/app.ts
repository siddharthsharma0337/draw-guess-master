import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

if (isProduction) {
  // Serve built React frontend as static files (same-origin → no CORS needed)
  const staticDir = path.resolve(import.meta.dirname, "public");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    logger.info({ staticDir }, "Serving frontend static files");
  } else {
    logger.warn({ staticDir }, "Frontend build not found — run pnpm build first");
  }
} else {
  // Dev: Vite dev server is on a different port — allow its origin
  const corsOrigin = process.env.CORS_ORIGIN ?? "*";
  app.use(cors({ origin: corsOrigin, credentials: true }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// SPA fallback: all non-API routes return index.html (for client-side routing)
// Use regex instead of "*" — Express 5 (router@2) does not accept bare "*" wildcard
if (isProduction) {
  const staticDir = path.resolve(import.meta.dirname, "public");
  app.get(/.*/, (_req, res) => {
    const indexHtml = path.join(staticDir, "index.html");
    if (existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).send("Frontend not built. Run pnpm build first.");
    }
  });
}

export default app;
