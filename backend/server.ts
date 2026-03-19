import "dotenv/config";

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";

import analyzeRouter from "./routes/analyze";

const app = express();
const configuredCorsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];
const parsedRateLimitMax = Number(process.env.RATE_LIMIT_MAX);
const rateLimitMax = Number.isFinite(parsedRateLimitMax) && parsedRateLimitMax > 0 ? parsedRateLimitMax : 10;
const corsOptions = {
  origin:
    configuredCorsOrigins.length === 0
      ? "*"
      : (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
          if (!origin) {
            callback(null, true);
            return;
          }

          callback(null, configuredCorsOrigins.includes(origin));
        },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
const analyzeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait a moment and try again.",
        retryable: true,
      },
    });
  },
});

app.use(cors(corsOptions));
app.options("/api/analyze", cors(corsOptions));
app.use(express.json({ limit: "20mb" }));

app.post("/api/analyze", analyzeRateLimiter);
app.use("/api/analyze", analyzeRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    return res.status(413).json({
      error: {
        code: "IMAGE_TOO_LARGE",
        message: "Image is too large. Please use a smaller photo.",
        retryable: false,
      },
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: "Request body must be valid JSON.",
        retryable: false,
      },
      attempts: [],
    });
  }

  return next(error);
});

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

app.listen(port, () => {
  console.log(`SmartBite backend running on port ${port}`);
});
