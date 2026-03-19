import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import { AppError } from "./utils/errors";
import { logger } from "./utils/logger";
import { storiesRouter } from "./routes/stories";
import { bookmarksRouter } from "./routes/bookmarks";
import { aiRouter } from "./routes/ai";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/stories", storiesRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api", aiRouter);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, status: err.status },
    });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: err.message || "Something went wrong",
      status: 500,
    },
  });
});

app.listen(config.port, () => {
  logger.info(`Backend server running on port ${config.port}`);
});
